# Financial Manager & Budget Tracker

A tailored, premium financial management, data visualizer, and budget tracker application designed specifically for Students. 

This app is optimized to manage with a set monthly allowance amount, with student-centric features like a **Dynamic Safe-to-Spend Quota** and a **Canteen Meal Index** (calculating your daily budget in units of ~50 Baht canteen meals).

---

## 🚀 Key Features

*   **Monthly Allowance**: Countdown to the next disbursement day (the 25th of the month).
*   **Fixed Deductions Baseline**: Subtracts fixed costs (like dorm rent and utility bills) immediately to isolate your actual disposable budget.
*   **Dynamic Rolling Daily Limit**: Automatically recalculates how much you can spend today. If you overspend, tomorrow's limit shrinks; if you save, tomorrow's limit grows.
*   **Canteen Meal Index**: Translates monetary amounts into canteen meals (50 THB each) so you always know your budget in food terms.
*   **Multi-Account Ledger**: Track SCB Bank, TrueMoney E-wallet, Rabbit Card transit card, and Cash balances with seamless transfer logs.
*   **Advanced Tagging**: Add tags like `#canteen`, `#commute`, and `#exam-prep` for custom reports.
*   **Virtual Savings Goals**: Earmark savings for textbooks, study gear (like an iPad), or emergency reserves.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js (App Router, TypeScript) + Tailwind CSS + Shadcn UI + Recharts
*   **Backend**: ASP.NET Core 8.0 Web API (C#)
*   **Database**: PostgreSQL
*   **Architecture**: N-Layered Clean Architecture (Domain, Application, Infrastructure, Api) using CQRS with MediatR.

---

## 📂 Project Structure

```text
FinancialManagement/
├── README.md               # Main project introduction
├── docs/                   # Obsidian vault documentation MOC
│   ├── 00-Index.md
│   ├── Goals-and-Scope.md
│   ├── Architecture-Design.md
│   ├── Database-Schema.md
│   └── Use-Cases.md
├── ST_finance.slnx                  # Solution File
├── ST_finance.Database/             # Database DbContext, entities mapping, migrations
├── ST_finance.Domain/               # Core business logic, services, validators
├── ST_finance.Api/                  # Web API Controllers & HTTP configuration
└── ST_finance.Frontend/             # Next.js Frontend Application
```

For detailed guides, open the files in the `docs/` folder (fully optimized as an **Obsidian Vault**).

---

## 💻 Getting Started (Local Development Setup)

### Prerequisites
*   [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
*   [Node.js (v18+) & npm](https://nodejs.org/)
*   [PostgreSQL Database](https://www.postgresql.org/) (or Docker for containerized setup)

### 1. Database Setup (Via Docker Compose)
You can launch a local PostgreSQL container pre-configured with the schema SQL by running:
```bash
docker compose up -d db
```
This starts the database on port `5432` with database name `st_financial_db` and executes the initialization script in `docker/init.sql` to generate all 12 tables instantly.

### 🔄 Automatic Startup Migrations & Seeding
When the backend API boots up, it automatically checks the database:
1. **Migrations**: It runs all pending EF Core Migrations to ensure the database schema is up-to-date.
2. **Guarded Seeding**: It checks if there are any users in the database. If the database is completely empty, it automatically triggers `DbSeeder.SeedAsync()` to populate the database with 2 realistic, person-specific demo student accounts (`somchai` and `kanya`) containing 1 year of historical transactions, monthly budgets, saving goals, and daily quota logs.
   * **Note**: Seeding is strictly guarded and **will not run** if any users exist in the database. This prevents duplicate seed data or overriding user-registered accounts.

To run the entire stack (both Database and .NET Web API) inside containers:
```bash
docker compose up --build
```

### 2. Backend Configuration (For Local Host Execution)
If running the API directly on your host machine (outside Docker):
1.  Ensure your local PostgreSQL instance is running (via Docker or local service).
2.  Navigate to `ST_finance.Api/appsettings.json`.
3.  Ensure the `ConnectionStrings:DefaultConnection` matches your PostgreSQL details:
    `Host=localhost;Port=5432;Database=st_financial_db;Username=postgres;Password=postgres;`
4.  Run the API:
    ```bash
    dotnet run --project ST_finance.Api/ST_finance.Api.csproj
    ```
5.  Open `http://localhost:5000/swagger` to inspect the API endpoints.

### 3. Frontend Setup (Coming Soon)
1.  Navigate to the `ST_finance.Frontend/` directory.
2.  Install dependencies and start the development server:
    ```bash
    npm install
    npm run dev
    ```
3.  Open `http://localhost:3000` to view the dashboard.
