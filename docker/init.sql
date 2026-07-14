-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (ASP.NET Core Identity compatible)
CREATE TABLE IF NOT EXISTS "Tbl_User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(256) UNIQUE NOT NULL,
    normalized_username VARCHAR(256) UNIQUE NOT NULL,
    email VARCHAR(256) UNIQUE NOT NULL,
    normalized_email VARCHAR(256) UNIQUE NOT NULL,
    full_name VARCHAR(256) NULL,
    email_confirmed BOOLEAN DEFAULT FALSE,
    password_hash TEXT NOT NULL,
    security_stamp TEXT NULL,
    concurrency_stamp TEXT NULL,
    phone_number TEXT NULL,
    phone_number_confirmed BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    lockout_end TIMESTAMP WITH TIME ZONE NULL,
    lockout_enabled BOOLEAN DEFAULT FALSE,
    access_failed_count INT DEFAULT 0,
    refresh_token TEXT NULL,
    refresh_token_expiry_time TIMESTAMP WITH TIME ZONE NULL,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. User Profiles table
CREATE TABLE IF NOT EXISTS "Tbl_UserProfile" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    monthly_allowance_amount NUMERIC(12, 2) DEFAULT 16000.00,
    allowance_day_of_month INT DEFAULT 25 CHECK (allowance_day_of_month >= 1 AND allowance_day_of_month <= 31),
    target_monthly_savings NUMERIC(12, 2) DEFAULT 2000.00,
    currency VARCHAR(3) DEFAULT 'THB',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Accounts table
CREATE TABLE IF NOT EXISTS "Tbl_Account" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Bank', 'EWallet', 'TransitCard', 'Cash')),
    balance NUMERIC(12, 2) DEFAULT 0.00,
    color VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    icon VARCHAR(50) NOT NULL DEFAULT 'Wallet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Categories table
CREATE TABLE IF NOT EXISTS "Tbl_Category" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('Income', 'Expense')),
    color VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    icon VARCHAR(50) NOT NULL DEFAULT 'Tag',
    is_default BOOLEAN DEFAULT FALSE,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. Tags table
CREATE TABLE IF NOT EXISTS "Tbl_Tag" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    CONSTRAINT unique_user_tag_name UNIQUE (user_id, name),
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6. Transactions table
CREATE TABLE IF NOT EXISTS "Tbl_Transaction" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES "Tbl_Account"(id) ON DELETE RESTRICT,
    target_account_id UUID NULL REFERENCES "Tbl_Account"(id) ON DELETE RESTRICT,
    category_id UUID NULL REFERENCES "Tbl_Category"(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('Income', 'Expense', 'Transfer')),
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(500) NULL,
    is_recurring_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. Transaction Tags join table
CREATE TABLE IF NOT EXISTS "Tbl_TransactionTag" (
    transaction_id UUID NOT NULL REFERENCES "Tbl_Transaction"(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES "Tbl_Tag"(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- 8. Recurring Schedules table
CREATE TABLE IF NOT EXISTS "Tbl_RecurringSchedule" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES "Tbl_Account"(id) ON DELETE RESTRICT,
    target_account_id UUID NULL REFERENCES "Tbl_Account"(id) ON DELETE RESTRICT,
    category_id UUID NULL REFERENCES "Tbl_Category"(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('Income', 'Expense', 'Transfer')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Yearly')),
    day_of_month INT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
    day_of_week INT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    last_triggered_at TIMESTAMP WITH TIME ZONE NULL,
    next_occurrence_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9. Category Budgets table
CREATE TABLE IF NOT EXISTS "Tbl_CategoryBudget" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES "Tbl_Category"(id) ON DELETE CASCADE,
    limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year INT NOT NULL CHECK (year >= 2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_category_budget_period UNIQUE (user_id, category_id, month, year),
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10. Daily Quota Logs table
CREATE TABLE IF NOT EXISTS "Tbl_DailyQuotaLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    target_quota NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    actual_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_daily_quota_date UNIQUE (user_id, date)
);

-- 11. Savings Goals table
CREATE TABLE IF NOT EXISTS "Tbl_SavingsGoal" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "Tbl_User"(id) ON DELETE CASCADE,
    goal_name VARCHAR(150) NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount >= 0),
    target_date TIMESTAMP WITH TIME ZONE NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    delete_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- 12. Savings Contributions table
CREATE TABLE IF NOT EXISTS "Tbl_SavingsContribution" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    savings_goal_id UUID NOT NULL REFERENCES "Tbl_SavingsGoal"(id) ON DELETE CASCADE,
    transaction_id UUID NULL REFERENCES "Tbl_Transaction"(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(250) NULL
);

-- 13. OTP Verification table
CREATE TABLE IF NOT EXISTS "Tbl_OtpVerification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(256) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS "Tbl_OtpVerification_email_purpose_idx" ON "Tbl_OtpVerification"(email, purpose);
