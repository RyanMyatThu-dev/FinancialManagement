# Project Rules & Guidelines

This document defines the architectural rules and constraints for AI Agents developing the Student Financial Management backend.

## 🛠️ Design & Architecture Rules

### 1. Controller Placement
*   **Rule**: Do NOT register controllers in the `ST_finance.Api` layer.
*   **Requirement**: All API Controllers must be placed in their respective feature folders in the `ST_finance.Domain` project (e.g. `ST_finance.Domain/Features/Accounts/AccountsController.cs`).
*   **Base Class**: Every controller must inherit from `ApiControllerBase`.

### 2. Result Pattern & HTTP Status Consistency
*   **Rule**: Every controller action must return wrapping types in the `Result` or `Result<TValue>` patterns.
*   **Requirement**: Use `return HandleResult(result)` inside controllers. This automatically maps success to `200 Ok(Result<TValue>)`, `404 NotFound(Result)` for missing resources, and `400 BadRequest(Result)` for validation errors, keeping the client payload contract consistent:
    ```json
    {
      "isSuccess": true,
      "isFailure": false,
      "error": { "code": "", "message": "" },
      "value": { ... }
    }
    ```

### 3. Dual-Layer Model Validation
*   **Controller Level**: Always check `ModelState.IsValid` at the entry point of all POST/PUT routes:
    ```csharp
    if (!ModelState.IsValid)
    {
        var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
        return BadRequest(Result.Failure<TResponse>(CustomErrors.Validation.InvalidInput(errors)));
    }
    ```
*   **Service Level**: Validate all business rules and model parameters, returning `Result.Failure(...)` instead of throwing exceptions for expected business errors.

### 4. Soft Delete Policy
*   **Rule**: Never execute hard deletes (`_context.Remove(entity)`) on user data tables.
*   **Requirement**: 
    *   All tables (including `Tbl_User`) must include a `delete_flag` boolean column (C# property `DeleteFlag`).
    *   Set `DeleteFlag = true` during deletions.
    *   Configure global query filters inside `AppDbContext.cs` (`modelBuilder.Entity<TblAccount>().HasQueryFilter(e => !e.DeleteFlag)`).

### 5. Strongly-Typed Enums
*   **Rule**: Use strongly-typed C# enums for columns like `AccountType` instead of raw strings.
*   **Requirement**: Convert to/from strings when saving to PostgreSQL by registering `.HasConversion<string>()` inside `AppDbContext.cs` to satisfy database-level `CHECK` constraints.
