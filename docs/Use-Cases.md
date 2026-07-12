# Use Cases and Core Algorithms

This document outlines the primary use cases and functional algorithms implemented in the system, specifically detailing how the database tables interact.

---

## 🧮 Use Case 1: Dynamic Safe-to-Spend Quota Calculation

The core feature of this application is recalculating the daily budget dynamically based on the student's behaviour.

### Objective
Calculate the maximum amount the student can spend *today* while ensuring they survive until the next allowance/budget cycle reset (default is the 25th of the month) and stay on track with their savings goals.

### The Algorithm
Run at the start of each day, or dynamically when the dashboard is loaded:

1.  **Retrieve Current State**:
    *   `totalBalance`: Sum of all `balance` from `accounts` for the current user.
    *   `fixedBillsRemaining`: Sum of remaining scheduled recurring expenses (`amount`) set between `today` and the `nextCycleDate`.
    *   `savingsGoalRemaining`: Sum of `(target_amount - current_amount)` for all active `savings_goals`. (Calculated by summing `amount` in `savings_contributions` for each goal).
    *   `nextCycleDate`: The `next_occurrence_date` of the user's monthly allowance schedule or budget cycle date in `recurring_schedules` (if the allowance is set to `0.00`, this default is still used to bound the current cycle).
    *   `daysRemaining`: Number of days from `today` to `nextCycleDate` (inclusive of today, minimum of 1).

2.  **Calculate Daily Quota**:
    \[
    \text{Daily Quota} = \frac{\text{totalBalance} - \text{fixedBillsRemaining} - \text{savingsGoalRemaining}}{\text{daysRemaining}}
    \]
    *If the resulting quota is negative, it indicates the student has overspent, and the UI will alert them with a "Red Alert" (0 THB safe-to-spend limit, suggesting they defer goals or adjust budgets).*

3.  **Logging**:
    At midnight (00:00:01), the backend runs this calculation and inserts a new row in `daily_quota_logs` with the computed `target_quota`. Any expense logged during that day increments `actual_spent`.

---

## 🍜 Use Case 2: Chula Canteen Meal Index Translation

To make the daily budget intuitive, we convert the currency values into food units.

### The Formula
Assuming a standard, filling meal at a Chulalongkorn University faculty canteen (e.g., Faculty of Arts, Engineering, or Samyan Mitrtown local stalls) costs **50 THB**:

\[
\text{Meal Index} = \text{floor}\left(\frac{\text{Daily Quota} - \text{Actual Spent Today}}{50}\right)
\]

### UI Display Metaphors
*   **7+ Meals**: "Safe Zone" 🟢 (Plenty of room for dessert or a BTS trip to Siam).
*   **3–6 Meals**: "Normal Zone" 🟡 (Comfortable. Covers breakfast, lunch, and dinner, plus a snack).
*   **1–2 Meals**: "Warning Zone" 🟠 (Be careful, stick to the cheapest food options).
*   **0 Meals**: "Danger Zone" 🔴 (You've hit or exceeded your limit. Visit the canteen with cash reserves or seek assistance!).

---

## 📅 Use Case 3: Automated Recurring Payments Handler

### Objective
Ensure that fixed monthly allowance deposits (if configured) and recurring bills (dorm rent, mobile data subscription) are recorded automatically on their due dates without requiring manual user input.

### Execution Flow
A hosted background service (`IHostedService` in .NET) wakes up once every 24 hours (at 00:01:00 UTC+7):

1.  Query the database for schedules:
    ```csharp
    var pendingSchedules = await dbContext.RecurringSchedules
        .Where(s => s.NextOccurrenceDate <= DateTimeOffset.UtcNow)
        .ToListAsync();
    ```
2.  For each `schedule` in `pendingSchedules`:
    *   **Open a database transaction**.
    *   **Create Transaction**: Create a new record in `transactions` copying the schedule's `Amount`, `AccountId`, `TargetAccountId`, `CategoryId`, and `TransactionType`. Mark `IsRecurringCreated = true`.
    *   **Update Balances**:
        *   If `'Income'`: Update source `accounts.balance = balance + amount`.
        *   If `'Expense'`: Update source `accounts.balance = balance - amount`.
        *   If `'Transfer'`: Update source `accounts.balance = balance - amount` AND target `accounts.balance = balance + amount`.
    *   **Recalculate Next Date**: Update the schedule's `LastTriggeredAt = DateTimeOffset.UtcNow` and set `NextOccurrenceDate` to the next occurrence in the future (e.g., add 1 month).
    *   **Commit the transaction**.

---

## 🎁 Use Case 4: Earmarking Savings (Virtual Goals)

### Objective
Allocate cash from the general pool toward a specific goal (e.g., an iPad for classes) without physically transferring money between bank accounts.

### Workflow
1.  User clicks "Save 500 Baht to iPad Goal".
2.  The backend:
    *   Checks if the user has at least 500 THB of disposable balance.
    *   **Inserts** a contribution record in `savings_contributions` linked to the Goal ID:
        *   `amount`: `500.00`
        *   `date`: `NOW()`
        *   `note`: `"Virtual contribution from SCB account"`
3.  When checking the dashboard, the 500 THB is subtracted from the "Disposable Balances" pool so the student doesn't accidentally spend it on daily food/transit.
