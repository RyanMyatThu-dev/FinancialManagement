# Backend Feature Tasks Breakdown

This document provides a feature-by-feature breakdown of the backend API implementation tasks. The backend is designed as a 3-tier architecture: **ST_finance.Api** $\rightarrow$ **ST_finance.Domain** $\rightarrow$ **ST_finance.Database**.

---

## 🔐 Feature 1: User Authentication & Profile Management
Manages user registrations, sessions, security, and allowance cycle preferences.

- [x] **1.1 Identity Integration**
  - Configure ASP.NET Core Identity to map onto `Tbl_User` and `Tbl_UserProfile` within `ChulaFinancialDbContext`.
- [x] **1.2 JWT Authentication Pipeline**
  - Implement a token generator service in the Database/Domain layer.
  - Setup JWT middleware authentication in `Program.cs` to protect endpoints.
- [x] **1.3 API Endpoints**
  - `POST /api/auth/register`: Create user and insert a default profile (`monthly_allowance_amount = 16000.00`, `allowance_day_of_month = 25`, `target_monthly_savings = 2000.00`).
  - `POST /api/auth/login`: Validate credentials and return JWT security tokens.
  - `GET /api/auth/profile`: Get current student profile settings.
  - `PUT /api/auth/profile`: Update allowance amounts, start day, or savings target.

---

## 💳 Feature 2: Account & Wallet Management
Tracks physical and digital wallets (Banks, E-Wallets, BTS Rabbit Cards, Cash).

- [x] **2.1 Repository & Business Logic**
  - Implement validation: Account name must be unique per user. Account type must belong to check constraint values.
- [x] **2.2 API Endpoints**
  - `GET /api/accounts`: List all user wallets (include fields: name, balance, available balance, type, color, icon).
  - `POST /api/accounts`: Add a new wallet with an initial balance.
  - `PUT /api/accounts/{id}`: Update color, name, icon, or baseline balance.
  - `DELETE /api/accounts/{id}`: Safely remove an account (block deletion if linked to transactions unless explicitly requested).

---

## 📝 Feature 3: Transaction Ledger & Tagging Engine
Logs income, expense, and internal transfers while dynamically adjusting account balances.

- [ ] **3.1 Balance Synchronization Logic**
  - When creating a transaction:
    - **Income**: Add to source `AccountId`.
    - **Expense**: Deduct from source `AccountId`.
    - **Transfer**: Deduct from source `AccountId` and add to destination `TargetAccountId`.
  - When updating/deleting: Roll back the previous balance offset before applying new changes.
- [ ] **3.2 Tagging engine**
  - Manage tags in `Tbl_Tag`.
  - Implement composite mapping inside `Tbl_TransactionTag` when transactions are saved.
- [ ] **3.3 API Endpoints**
  - `GET /api/transactions`: Search, paginate, and filter transactions (by date range, account, type, tags e.g., `#chula-canteen`).
  - `POST /api/transactions`: Log a transaction.
  - `PUT /api/transactions/{id}`: Edit transaction details.
  - `DELETE /api/transactions/{id}`: Remove transaction and restore wallet balance.

---

## 📅 Feature 4: Automated Recurring Scheduler
Runs background worker checks to execute recurring stipends/allowances, rent, and subscriptions automatically.

- [ ] **4.1 Hosted Background Worker**
  - Implement a .NET background worker class (`IHostedService` / `BackgroundService`).
  - Configure the service to trigger every 24 hours.
- [ ] **4.2 Transaction Generation Logic**
  - Find all rows in `Tbl_RecurringSchedule` where `NextOccurrenceDate <= CurrentTime`.
  - Create standard transactions (`Tbl_Transaction`) and adjust account balances.
  - Advance `NextOccurrenceDate` depending on interval frequency (Daily, Weekly, Monthly, Yearly).
- [ ] **4.3 API Endpoints**
  - `GET /api/recurring`: List recurring schedules.
  - `POST /api/recurring`: Create a schedule (e.g., "Monthly Allowance Payout on the 25th", "BTS pass subscription").
  - `DELETE /api/recurring/{id}`: Cancel recurring schedule.

---

## 🎯 Feature 5: Savings Goals & Earmark Ledger
Tracks virtual savings goals by locking away portions of cash balances from safe-to-spend limits.

- [ ] **5.1 Virtual Allocation Calculator**
  - Implement logic to sum all savings contributions for a given goal.
  - Validate that users do not contribute more money than they actually have available.
- [ ] **5.2 Goal Completion Triggers**
  - Automatically flag `is_completed = TRUE` when total contributions equal or exceed `target_amount`.
- [ ] **5.3 API Endpoints**
  - `GET /api/savings-goals`: List goals, target amount, target date, and accumulated progress.
  - `POST /api/savings-goals`: Add goal (e.g., "M4 iPad Pro").
  - `POST /api/savings-goals/{id}/contribute`: Earmark funds (`+Amount` or `-Amount` for withdrawal).
  - `GET /api/savings-goals/{id}/contributions`: List contribution ledger history.

---

## 📊 Feature 6: Dashboard Statistics & Budget Quotas
Calculates dynamic quotas, Chula canteen indices, and categorizes monthly budgets.

- [ ] **6.1 Safe-to-Spend Quota Engine**
  - Implement algorithm to compute rolling daily quota:
    $$\text{Quota} = \frac{\text{Total Balances} - \text{Remaining Fixed Bills} - \text{Remaining Goal Needs}}{\text{Days Remaining until 25th}}$$
  - Compute the Chula Canteen Meal Index:
    $$\text{Canteen Index} = \text{floor}\left(\frac{\text{Quota} - \text{Spent Today}}{50}\right)$$
- [ ] **6.2 Quota Logging Daemon**
  - Log daily quota targets to `Tbl_DailyQuotaLog` at midnight for charting history.
- [ ] **6.3 Monthly Category Budgets**
  - Maintain monthly limits inside `Tbl_CategoryBudget`.
- [ ] **6.4 API Endpoints**
  - `GET /api/dashboard/summary`: Return current quota, canteen index, active warnings, total savings, and cash flows.
  - `GET /api/dashboard/trends`: Return daily quota logs over the past month for Recharts plotting.
  - `GET /api/budgets`: List categories and comparison of spent vs. budget limits.
