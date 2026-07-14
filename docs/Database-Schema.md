# Database Schema Design

This document details the database schema, entity attributes, keys, constraints, and relationships implemented in PostgreSQL.

## 💾 Storage Configuration
*   **Database Engine**: PostgreSQL 15+
*   **ORM**: Entity Framework Core (EF Core) 8.0 using the Npgsql provider.
*   **Conventions**: snake_case column names inside the database, PascalCase properties in C# entity classes (mapped via EF Core naming conventions).

---

## 📊 dbdiagram.io Visualizer Markup (DBML)
You can copy and paste the following DBML block directly into [dbdiagram.io](https://dbdiagram.io) to generate an interactive entity-relationship (ER) diagram for the schema:

```dbml
// Paste this code on dbdiagram.io to visualize the ER diagram

Table users {
  id uuid [pk, default: `gen_random_uuid()` ]
  username varchar(256) [unique, not null]
  normalized_username varchar(256) [unique, not null]
  email varchar(256) [unique, not null]
  normalized_email varchar(256) [unique, not null]
  full_name varchar(256)
  email_confirmed boolean [default: false]
  password_hash text [not null]
  security_stamp text
  concurrency_stamp text
  phone_number text
  phone_number_confirmed boolean [default: false]
  two_factor_enabled boolean [default: false]
  lockout_end timestamp
  lockout_enabled boolean [default: false]
  access_failed_count int [default: 0]
}

Table user_profiles {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [unique, not null]
  monthly_allowance_amount numeric(12,2) [default: 16000.00]
  allowance_day_of_month int [default: 25]
  target_monthly_savings numeric(12,2) [default: 2000.00]
  currency varchar(3) [default: 'THB']
  updated_at timestamp [default: `now()`]
}

Table accounts {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  name varchar(100) [not null]
  account_type varchar(50) [not null] // 'Bank', 'EWallet', 'TransitCard', 'Cash'
  balance numeric(12,2) [default: 0.00]
  color varchar(7) [not null, default: '#4F46E5']
  icon varchar(50) [not null, default: 'Wallet']
  created_at timestamp [default: `now()`]
}

Table categories {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  name varchar(50) [not null]
  type varchar(10) [not null] // 'Income', 'Expense'
  color varchar(7) [not null, default: '#4F46E5']
  icon varchar(50) [not null, default: 'Tag']
  is_default boolean [default: false]
}

Table tags {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  name varchar(50) [not null]
  color varchar(7) [not null, default: '#4F46E5']
}

Table transactions {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  account_id uuid [not null]
  target_account_id uuid [null]
  category_id uuid [null]
  amount numeric(12,2) [not null]
  transaction_type varchar(10) [not null] // 'Income', 'Expense', 'Transfer'
  date timestamp [not null, default: `now()`]
  description varchar(500)
  is_recurring_created boolean [default: false]
  created_at timestamp [default: `now()`]
}

Table transaction_tags {
  transaction_id uuid [not null]
  tag_id uuid [not null]
  
  Indexes {
    (transaction_id, tag_id) [pk]
  }
}

Table recurring_schedules {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  account_id uuid [not null]
  target_account_id uuid [null]
  category_id uuid [null]
  name varchar(150) [not null]
  amount numeric(12,2) [not null]
  transaction_type varchar(10) [not null]
  frequency varchar(20) [not null] // 'Daily', 'Weekly', 'Monthly', 'Yearly'
  day_of_month int [null]
  day_of_week int [null]
  start_date timestamp [not null]
  end_date timestamp [null]
  last_triggered_at timestamp [null]
  next_occurrence_date timestamp [not null]
}

Table category_budgets {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  category_id uuid [not null]
  limit_amount numeric(12,2) [not null]
  month int [not null]
  year int [not null]
  created_at timestamp [default: `now()`]
}

Table daily_quota_logs {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  date date [not null]
  target_quota numeric(12,2) [default: 0.00]
  actual_spent numeric(12,2) [default: 0.00]
  created_at timestamp [default: `now()`]
}

Table savings_goals {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null]
  goal_name varchar(150) [not null]
  target_amount numeric(12,2) [not null]
  target_date timestamp [null]
  is_completed boolean [default: false]
  created_at timestamp [default: `now()`]
}

Table savings_contributions {
  id uuid [pk, default: `gen_random_uuid()`]
  savings_goal_id uuid [not null]
  transaction_id uuid [null]
  amount numeric(12,2) [not null]
  date timestamp [not null, default: `now()`]
  note varchar(250)
}

// Relationships
Ref: user_profiles.user_id - users.id [delete: cascade]
Ref: accounts.user_id > users.id [delete: cascade]
Ref: categories.user_id > users.id [delete: cascade]
Ref: tags.user_id > users.id [delete: cascade]
Ref: transactions.user_id > users.id [delete: cascade]
Ref: recurring_schedules.user_id > users.id [delete: cascade]
Ref: category_budgets.user_id > users.id [delete: cascade]
Ref: daily_quota_logs.user_id > users.id [delete: cascade]
Ref: savings_goals.user_id > users.id [delete: cascade]

Ref: transactions.account_id > accounts.id [delete: restrict]
Ref: transactions.target_account_id > accounts.id [delete: restrict]
Ref: transactions.category_id > categories.id [delete: set null]

Ref: transaction_tags.transaction_id > transactions.id [delete: cascade]
Ref: transaction_tags.tag_id > tags.id [delete: cascade]

Ref: recurring_schedules.account_id > accounts.id [delete: restrict]
Ref: recurring_schedules.target_account_id > accounts.id [delete: restrict]
Ref: recurring_schedules.category_id > categories.id [delete: set null]

Ref: category_budgets.category_id > categories.id [delete: cascade]

Ref: savings_contributions.savings_goal_id > savings_goals.id [delete: cascade]
Ref: savings_contributions.transaction_id > transactions.id [delete: cascade]
```

---

## 🗄️ Table Details

### 1. `users` (Managed by ASP.NET Core Identity)
Stores user credentials and core login data.
*   `id`: `UUID` (Primary Key, generated via `uuid_generate_v4()`)
*   `username`: `VARCHAR(256)` (Unique, Indexed)
*   `email`: `VARCHAR(256)` (Unique, Indexed)
*   `full_name`: `VARCHAR(256)` (Nullable)
*   `email_confirmed`: `BOOLEAN` (Default: `false`)
*   `password_hash`: `TEXT`

### 2. `user_profiles`
Holds additional application settings, specifically Chula student-tailored variables. Supports zero-allowance students.
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `monthly_allowance_amount`: `NUMERIC(12, 2)` (Default: `16000.00`, can be `0.00` for self-funded students)
*   `allowance_day_of_month`: `INT` (Default: `25`, Check constraint: `1` to `31`)
*   `target_monthly_savings`: `NUMERIC(12, 2)` (Default: `2000.00`)
*   `currency`: `VARCHAR(3)` (Default: `'THB'`)
*   `updated_at`: `TIMESTAMP WITH TIME ZONE`

### 3. `accounts`
Tracks where money is kept (bank account, wallet, transit card, cash).
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `name`: `VARCHAR(100)` (e.g., "SCB Savings", "TrueMoney", "Rabbit Card", "Cash")
*   `account_type`: `VARCHAR(50)` (Check constraint: `'Bank'`, `'EWallet'`, `'TransitCard'`, `'Cash'`)
*   `balance`: `NUMERIC(12, 2)` (Default: `0.00`)
*   `color`: `VARCHAR(7)` (Hex color, e.g., `'#4F46E5'`)
*   `icon`: `VARCHAR(50)` (Lucide icon identifier)
*   `created_at`: `TIMESTAMP WITH TIME ZONE`

### 4. `categories`
User-customizable categories for tracking spending and stipend income.
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `name`: `VARCHAR(50)` (e.g., "Food & Canteen", "Rent", "BTS/Transit", "Books")
*   `type`: `VARCHAR(10)` (Check constraint: `'Income'` or `'Expense'`)
*   `color`: `VARCHAR(7)`
*   `icon`: `VARCHAR(50)`
*   `is_default`: `BOOLEAN` (Default: `false` - indicates built-in categories)

### 5. `tags`
Custom tags to allow cross-category logging (e.g. tagging `#chula-canteen` on a transaction categorized under `Food & Canteen`).
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `name`: `VARCHAR(50)` (Check constraint: lowercase letters, numbers, and dashes. Unique per user)
*   `color`: `VARCHAR(7)`

### 6. `transactions`
The double-entry ledger. All cash movements are recorded here.
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `account_id`: `UUID` (Foreign Key -> `accounts.id`, Restrict Delete) - *Source account*
*   `target_account_id`: `UUID` (Foreign Key -> `accounts.id`, Restrict Delete, Nullable) - *Target account (Transfers only)*
*   `category_id`: `UUID` (Foreign Key -> `categories.id`, Set Null, Nullable) - *Null for transfers or goal earmarks*
*   `amount`: `NUMERIC(12, 2)` (Always positive)
*   `transaction_type`: `VARCHAR(10)` (Check constraint: `'Income'`, `'Expense'`, or `'Transfer'`)
*   `date`: `TIMESTAMP WITH TIME ZONE`
*   `description`: `VARCHAR(500)`
*   `is_recurring_created`: `BOOLEAN` (Default: `false` - created via schedule scheduler)
*   `created_at`: `TIMESTAMP WITH TIME ZONE`

### 7. `transaction_tags` (Many-to-Many Join Table)
Connects transactions with tags.
*   `transaction_id`: `UUID` (Foreign Key -> `transactions.id`, Cascade Delete)
*   `tag_id`: `UUID` (Foreign Key -> `tags.id`, Cascade Delete)
*   *Composite Primary Key: (`transaction_id`, `tag_id`)*

### 8. `recurring_schedules`
Stores schedules for automated transaction logging (like monthly stipend deposits or utility bills).
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `account_id`: `UUID` (Foreign Key -> `accounts.id`, Restrict Delete)
*   `target_account_id`: `UUID` (Foreign Key -> `accounts.id`, Restrict Delete, Nullable)
*   `category_id`: `UUID` (Foreign Key -> `categories.id`, Set Null, Nullable)
*   `name`: `VARCHAR(150)`
*   `amount`: `NUMERIC(12, 2)`
*   `transaction_type`: `VARCHAR(10)` (Check constraint: `'Income'`, `'Expense'`, or `'Transfer'`)
*   `frequency`: `VARCHAR(20)` (Check constraint: `'Daily'`, `'Weekly'`, `'Monthly'`, `'Yearly'`)
*   `day_of_month`: `INT` (Nullable, 1-31)
*   `day_of_week`: `INT` (Nullable, 0-6)
*   `start_date`: `TIMESTAMP WITH TIME ZONE`
*   `end_date`: `TIMESTAMP WITH TIME ZONE` (Nullable)
*   `last_triggered_at`: `TIMESTAMP WITH TIME ZONE` (Nullable)
*   `next_occurrence_date`: `TIMESTAMP WITH TIME ZONE`

### 9. `category_budgets`
Tracks user-set limits for individual categories.
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `category_id`: `UUID` (Foreign Key -> `categories.id`, Cascade Delete)
*   `limit_amount`: `NUMERIC(12, 2)`
*   `month`: `INT` (1-12)
*   `year`: `INT`
*   `created_at`: `TIMESTAMP WITH TIME ZONE`

### 10. `daily_quota_logs`
Logs the dynamic "Safe-to-Spend" daily budget limit calculated by the system for each calendar day.
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `date`: `DATE` (Unique per user + date combination)
*   `target_quota`: `NUMERIC(12, 2)` (The allowed spending budget calculated for this day)
*   `actual_spent`: `NUMERIC(12, 2)` (The actual sum of expenses logged on this day)
*   `created_at`: `TIMESTAMP WITH TIME ZONE`

### 11. `savings_goals`
Goals that the student is saving up for.
*   `id`: `UUID` (Primary Key)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Cascade Delete)
*   `goal_name`: `VARCHAR(150)` (e.g., "M4 iPad Pro", "Emergency Fund")
*   `target_amount`: `NUMERIC(12, 2)`
*   `target_date`: `TIMESTAMP WITH TIME ZONE` (Nullable)
*   `is_completed`: `BOOLEAN` (Default: `false`)
*   `created_at`: `TIMESTAMP WITH TIME ZONE`

### 12. `savings_contributions`
Ledger recording virtual contributions to, or withdrawals from, savings goals. Earmarks cash without physical bank transfers.
*   `id`: `UUID` (Primary Key)
*   `savings_goal_id`: `UUID` (Foreign Key -> `savings_goals.id`, Cascade Delete)
*   `transaction_id`: `UUID` (Foreign Key -> `transactions.id`, Cascade Delete, Nullable) - *Links to an actual transaction if applicable*
*   `amount`: `NUMERIC(12, 2)` (Positive = saved, Negative = withdrawn/spent)
*   `date`: `TIMESTAMP WITH TIME ZONE`
*   `note`: `VARCHAR(250)`

---

## 🔒 Delete Propagation Rules
*   **`users`**: Cascades deletion to everything (profiles, accounts, categories, transactions, goals).
*   **`accounts`**: **Restricts deletion** if transactions depend on it. Users must re-categorize transactions or archive accounts rather than hard-delete to protect history.
*   **`categories`**: **Sets NULL** on transactions, allowing transactions to persist even if their category is deleted.
*   **`tags`**: Cascades deletion on join records (`transaction_tags`) but leaves `transactions` intact.

---

## 🐳 Containerized Database setup
A containerized PostgreSQL setup is configured for instant schema deployment. It mounts a pre-defined SQL script containing the full table definitions:
- **Initialization Script**: `docker/init.sql` (Creates all 12 tables and schemas on startup)
- **Deployment Command**:
  ```bash
  docker compose up -d db
  ```
- **Connection Details**:
  - Host: `localhost` (or `db` inside Docker network)
  - Port: `5432`
  - Database name: `ST_Finance`
  - Username: `chula_admin`
  - Password: `chula_secure_pwd_2026`

---
**Next Step**: Review typical transaction flows and calculations in [[Use-Cases]].
