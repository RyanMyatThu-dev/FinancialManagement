# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-23

### Added
- User authentication with JWT and OTP email verification
- Account management with multiple account types (Bank, Cash, E-Wallet, Savings)
- Transaction tracking (Income, Expense, Transfer) with category support
- Budget management with period-based tracking and alerts
- Savings goals with progress tracking
- Recurring transaction schedules (hourly processing via EventBridge)
- Dynamic Safe-to-Spend daily quota with canteen meal index
- Dashboard with financial summaries and quota logging
- API rate limiting (auth-strict: 5 req/min, api-general: 100 req/min)
- Soft delete policy across all user data tables
- Role-based authorization with custom permission policies
- Scalar API documentation (`/scalar/v1`)
- AWS Lambda serverless deployment with GitHub Actions CI/CD
- Docker Compose local development environment
- Comprehensive unit test suite (Accounts, Budgets, Transactions, Savings Goals, Dashboard, Recurring Schedules)
- Full documentation suite (Architecture, Database Schema, Use Cases, Environments, Deployment Guide)
