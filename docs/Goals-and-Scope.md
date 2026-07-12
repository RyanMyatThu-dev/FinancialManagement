# Goals and Scope

This document outlines the background, functional scope, and key metrics of the Student Financial Management and Budget Tracker Application.

## 🎓 User Background & Allowance Context
The primary user is a student studying at **Chulalongkorn University** (Bangkok, Thailand), who may be a scholarship recipient or self-funded:
*   **Stipend / Allowance**: Default configured for a 16,000 THB monthly stipend, but customizable. Supports **self-funded students** (monthly allowance = `0.00`) by calculating budgets purely from current bank balances.
*   **Allowance Cycle Start**: Default configured to the **25th of each month** (matching Chula stipend payout), but customizable.
*   **Dorm & Utilities**: Typical fixed cost of **5,000 THB per month** (automatically deducted at the start of each cycle).
*   **Net Disposable Income**: 11,000 THB per month for a scholarship student (~366.67 THB/day average).

## 🎯 Project Goals
1.  **Reduce Financial Stress**: Give the student clear visibility over how much they can spend safely each day to avoid running out of money before the 25th.
2.  **Enable Savings**: Help track progress towards specific study tools (e.g., an iPad for note-taking, textbooks) or emergency funds.
3.  **Optimize Commute & Food Spending**: Detail where the stipend goes, focusing on student-centric habits (Chula canteen meals, BTS/MRT travel, study materials).

## 🚀 Key Functional Features

### 1. Dynamic Safe-to-Spend Quota
*   **Problem**: Standard static budgets don't adjust when you overspend early in the month, leading to a cash crunch before the next stipend.
*   **Solution**: A rolling daily spending limit that recalculates dynamically. If the user spends less than the quota today, tomorrow's quota increases slightly. If the user overspends, tomorrow's limit shrinks.
*   **Formula**:
    \[
    \text{Daily Quota} = \frac{\text{Total Available Cash} - \text{Remaining Fixed Bills} - \text{Remaining Goal Targets}}{\text{Days Remaining until the 25th}}
    \]

### 2. Chula Canteen Meal Index
*   **Metaphor**: Real numbers can feel abstract. To make the budget relatable, the app translates monetary amounts into a **Canteen Meal Index** based on the cost of a typical plate of food at a Chulalongkorn University canteen (estimated at **50 THB**).
*   **Example**: If the daily quota is 300 THB, the index shows **6 meals**. If the user has 100 THB left today, the index shows **2 meals**.

### 3. Account-level Management
Tracks the distribution of the 16,000 THB stipend across common payment methods in Thailand:
*   **SCB/K-Plus Bank Account**: Main stipend deposit account.
*   **Rabbit Card**: For BTS Skytrain rides to campus.
*   **TrueMoney Wallet**: For convenience stores (7-Eleven) and local shops.
*   **Cash**: For street food and canteen vendors.

### 4. Tagging System
Allows specific sub-categorization relevant to Chula student life:
*   `#chula-canteen` - Meals inside the university.
*   `#commute` - BTS/MRT transit or motorcycle taxi (Win).
*   `#co-working` - Cafe or study space rental (e.g., Samyan Mitrtown).
*   `#midterms` / `#finals` - Stress-relief expenses or printouts.

---
**Next Step**: Review the implementation details in [[Architecture-Design]] and [[Database-Schema]].
