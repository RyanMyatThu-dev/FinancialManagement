# Backend Code Quality Audit

**Date:** 2026-08-28
**Scope:** `ST_finance.Api`, `ST_finance.Domain`, `ST_finance.Database`, `ST_finance.Shared`, `ST_finance.UnitTests`
**Method:** Read-only review across three parallel passes (Domain feature slices, API host, Database/Shared/Tests). No code was changed.

## Executive summary

The dominant architecture — Controller → `IXService` → `XService` → `Models/`, one folder per feature — is solid and used consistently by 7 of 10 feature slices (Accounts, Authentication, Budgets, Dashboard, RecurringSchedules, SavingsGoals, Transactions). The problems are concentrated in three places:

1. **Three feature slices break the pattern** (Admin, Reports, Jobs), which means a new contributor sees two contradictory templates to copy from.
2. **The same small pieces of logic are hand-copied everywhere** — a `GetUserId()` helper, a Bangkok-timezone calculation, pagination clamping, and a user-data-deletion routine each exist in 4–10 near-identical copies instead of one shared implementation.
3. **A handful of concrete risks**: hardcoded DB credentials as a fallback, an unauthenticated Hangfire dashboard, migrations running unconditionally on Lambda cold start, and 4 of 10 feature slices (Admin, Authentication, Jobs, Reports) with zero unit tests — Authentication being the most concerning gap given it covers login/OTP/refresh tokens.

None of this requires a rewrite. Most fixes are extract-a-helper or move-a-file, and none block adding new features — but doing the top few first will make the next feature slice easier to build correctly.

## High severity

| # | Area | Finding | Recommendation |
|---|------|---------|-----------------|
| 1 | Security | `AppDbContext.OnConfiguring` falls back to a hardcoded Postgres connection string with plaintext `postgres`/`postgres` credentials if none is injected. | Remove the fallback; throw if `DbContextOptions` isn't configured via DI/appsettings. |
| 2 | Security | Hangfire dashboard (`Program.cs:231-243`) has no `DashboardOptions.Authorization` filter — it's currently only gated by `IsDevelopment()`, which is the sole protection. | Add an explicit authorization filter regardless of environment gating. |
| 3 | Reliability | EF Core migrations run unconditionally on every app startup (`Program.cs:178-197`), including inside AWS Lambda, a frequently cold-started, stateless host. Concurrent cold starts can race to check/apply migrations against the same DB. | Move migrations to a controlled deploy step; don't run `MigrateAsync()` from the request-serving process. |
| 4 | Duplication | `GetUserId()` is copy-pasted verbatim into 6 controllers (Transactions, Accounts, Budgets, Dashboard, RecurringSchedules, SavingsGoals). `Reports` reimplements it with *different* behavior (returns `Guid.Empty` instead of throwing). | Move into the shared `ApiControllerBase` that already exists; delete the copies. |
| 5 | Duplication | Bangkok-timezone offset math (`.AddHours(±7)`) is hand-rolled in ~10 places across `TransactionService`, `DashboardService`, `BudgetService`, `RecurringScheduleService`, `QuotaLoggingJob`. | Extract a `BkkTimeHelper` (`StartOfDayUtc`, `EndOfDayUtc`, `StartOfMonthUtc`). |
| 6 | Duplication | `TransactionService.GetTransactionsAsync` and `GetTransactionSummaryAsync` duplicate ~140 lines of identical filter-building logic. | Extract a single `BuildFilteredQuery(...)` helper. |
| 7 | Duplication | `DeleteUserDataAsync` (9-entity cleanup, same order) is duplicated near-verbatim between `AdminController.cs:310-353` and `DbSeeder.cs:125-168`. | Extract one shared method (e.g. `UserDataCleanupService`) called by both. |
| 8 | Structure | `Admin` and `Reports` skip the Service/Interface layer entirely — EF queries and business logic sit directly in the controller, unlike every other slice. | Give both a proper `IXService`/`XService` pair to match the rest of the codebase. |
| 9 | Structure | `DashboardService.GetDashboardSummaryAsync` is a ~250-line god method mixing reset-date math, quota-pacing, budget warnings, and timeframe aggregation (the author's own numbered comments 1–9 mark the seams). | Extract into named private helpers along those existing seams. |
| 10 | Structure | `ST_finance.Database/ST_finance.Database/` is a stray, empty, untracked nested duplicate folder (confirmed via `git ls-files`/`git status`) — leftover scaffolding. | Delete it. |
| 11 | Test coverage | 4 of 10 feature slices have zero unit tests: **Admin, Authentication, Jobs, Reports**. Authentication (login, OTP, refresh tokens) is the highest-risk gap. | Prioritize Authentication tests first, then Admin/Reports. |
| 12 | Structure | `TransactionService.cs` is 872 lines and owns transactions, categories, *and* tags together, unlike every other concept which gets its own slice. | Consider splitting Categories/Tags into their own slice or at least their own service file. |

## Medium severity

- **Reports controller behavior inconsistency**: its `GetUserId()` returns `Guid.Empty` on failure instead of throwing, silently diverging from the other 6 copies (`ReportsController.cs:66-70`).
- **Debug logging in production paths**: `Console.WriteLine` left in `TransactionService.cs:800,828` and used instead of `ILogger` for job failures in `RecurringJobService.cs:53` — failed recurring charges are invisible to production logs.
- **Stringly-typed domain concepts**: transaction type (`"Income"/"Expense"/"Transfer"`) and `ResetFrequency` (`"Monthly"/"Weekly"/"None"`) are compared as raw strings, inconsistent with `AccountType`, which is a proper enum.
- **No API versioning** configured in `Program.cs` — nothing enforces a consistent route scheme as more Domain controllers are added.
- **No global exception-handling middleware** for non-development environments; the only normalized error shape lives in the rate-limiter's `OnRejected` callback, so unhandled exceptions elsewhere won't match it. Notably, `POST /api/reports`'s failure path (a missing or invalid JWT claim) now throws instead of returning `Guid.Empty` as a result of the Task 4 `GetUserId` consolidation in the Phase 1 fix plan, so that endpoint currently depends on this middleware existing to return a 401 rather than surfacing an unhandled 500 — a regression that should be prioritized in Phase 2/3 follow-up work.
- **Config validated late, not at boot**: missing `SecretKey`/`DbConnection` fails deep inside JWT/Npgsql internals (`secretKey!` null-forgiving at `Program.cs:91`) rather than with a clear startup error.
- **`RecurringSchedules` folder holds two unrelated services** (`RecurringScheduleService` for CRUD, `RecurringJobService` for batch job running, no interface) with confusingly similar names; the job runner logically belongs in a real "Jobs" slice alongside `QuotaLoggingJob`.
- **`Jobs/JobsController` owns no logic** — pure wiring around services that live in other folders, a different shape from every other slice.
- **DTOs placed inconsistently**: most slices keep request/response records under `Models/`; `Admin` and `Reports` define them inline at the bottom of the controller file.
- **"Disposable balance" formula duplicated** between `DashboardService.cs:117-126` and `SavingsGoalService.ContributeToGoalAsync:144-152` — risk of drift.
- **`SavingsGoalResponse` hand-built in 5 places** in `SavingsGoalService.cs` instead of a single `MapToResponse` helper (every sibling service already has one).
- **EF model configured entirely inline** in one ~400-line `OnModelCreating` in `AppDbContext.cs`. Standard scaffold output, but doesn't scale — split into one `IEntityTypeConfiguration<T>` per entity.
- **No test-data builder pattern**: each of the 6 test files hand-rolls its own `Guid.NewGuid()` seed data inline; will get worse as the suite grows.

## Low severity

- CORS origins and rate-limit thresholds are hardcoded literals in `Program.cs` rather than config-driven.
- The four separate `if (app.Environment.IsDevelopment())` guards in the middleware pipeline could be one block.
- `ModelState.IsValid` → error-join boilerplate repeated in ~15 action methods — candidate for a single action filter/attribute.
- Pagination clamping (`if (pageNumber < 1) ...`) repeated near-identically across 5 services.
- Two unrelated "delete a user" operations (`AuthService.DeleteUserAsync` soft-delete vs `AdminController` hard-delete) have confusingly similar names — rename to `DeactivateUserAsync` / `PurgeUserDataAsync`.
- `TblRolePermission.cs` / `TblUserReport.cs` use braced namespaces + non-`partial` class, inconsistent with every other scaffolded entity (file-scoped namespace + `partial`).
- `ST_finance.Database/Class1.cs` — leftover `dotnet new classlib` template file, unused.
- `RecurringScheduleTests.cs` name doesn't match the `<Feature>ServiceTests` convention used by its siblings, and also covers unrelated `RecurringJobService`/`TransactionService` interactions.
- `ApiControllerBase.MapErrorToResponse` infers HTTP status via substring-matching on the error `Code` (`Contains("NotFound")`) — fragile if a new `CustomErrors` code is added without matching the expected substring.
- No seeding mechanism/folder exists in `ST_finance.Database` despite Admin/Reports features implying default data needs.
- `AccessTokenExpiryMinutes`/`RefreshTokenExpiryDays` duplicated identically (not overridden) between `appsettings.json` and `appsettings.Development.json`.

## Test coverage by feature slice

| Feature | Has unit tests? |
|---|---|
| Accounts | Yes |
| Budgets | Yes |
| Dashboard | Yes |
| RecurringSchedules | Yes |
| SavingsGoals | Yes |
| Transactions | Yes |
| **Admin** | **No** |
| **Authentication** | **No** |
| **Jobs** | **No** (only indirectly, via a test file that actually targets RecurringSchedules) |
| **Reports** | **No** |

## Suggested order of attack

1. Fix the two security/reliability items (hardcoded DB fallback credentials, unauthenticated Hangfire dashboard, migrations-on-cold-start) — cheap, high-risk-reduction.
2. Hoist `GetUserId()` into `ApiControllerBase`; extract `BkkTimeHelper`; extract the duplicated transaction filter query and `DeleteUserDataAsync` — these are the four duplication fixes with the most call sites, so fixing them now also lowers the surface area for the structural work below.
3. Give `Admin` and `Reports` a real Service/Interface layer, matching the other 7 slices; move `RecurringJobService`/`QuotaLoggingJob` into a proper `Jobs` slice.
4. Add unit tests for Authentication first, then Admin and Reports.
5. Everything in "Low severity" is cleanup that can ride along with whatever feature work touches those files next — not worth a dedicated pass.
