# Financial Manager & Budget Tracker

A tailored, premium financial management, data visualizer, and budget tracker application designed specifically for students. This application features a **Dynamic Safe-to-Spend Quota** and a **Canteen Meal Index** (converting budgets to ~50 Baht canteen meal units) to help students manage their allowance.

---

## 🌐 1. Cloud Architecture & Hosting

This application is built on a modern, cost-efficient, and auto-scaling serverless cloud stack:

```mermaid
flowchart TB
    %% Environments & Subgraphs
    subgraph GitHubEnv ["GitHub Environment"]
        Runner["GitHub Actions Runner"]
    end

    subgraph VercelEnv ["Vercel Environment"]
        VercelApp["Next.js Frontend<br>(st-finance.vercel.app)"]
    end

    subgraph AWSEnv ["AWS Cloud (ap-southeast-1)"]
        subgraph IAMSecurity ["IAM & OIDC Security"]
            OIDC["OIDC Identity Provider<br>(githubusercontent.com)"]
            DeployerRole["github-actions-lambda-deployer<br>(IAM Role)"]
            ExecRole["st-finance-lambda-execution-role<br>(IAM Role)"]
        end

        subgraph ServerlessRuntime ["Serverless Runtime"]
            APIGW["API Gateway (HTTP API v2)"]
            Lambda["AWS Lambda Function<br>(ASP.NET Core Web API)"]
            EventBridge["Amazon EventBridge (Scheduler)"]
        end

        subgraph StagingStorage ["Staging Storage"]
            S3["S3 Staging Bucket<br>(st-finance-deployments-ryan-2026)"]
        end
    end

    subgraph SupabaseEnv ["Supabase Database Cloud"]
        SupabaseDB[("PostgreSQL Database")]
    end

    %% Flows
    %% 1. Runtime Flow (Solid Lines)
    VercelApp ====|"1. HTTPS Request"| APIGW
    APIGW ====|"2. Proxy Request"| Lambda
    Lambda ====|"3. EF Core Query (Port 5432)"| SupabaseDB
    EventBridge ====|"Direct Invoke (JSON payload)"| Lambda

    %% 2. CI/CD & Deploy Flow (Dashed Lines)
    Runner -.->|"1. Authenticate with OIDC JWT"| OIDC
    OIDC -.->|"2. Temporary STS Credentials"| DeployerRole
    DeployerRole -.->|"3. Push Build ZIP"| S3
    DeployerRole -.->|"4. Deploy Code via CloudFormation"| Lambda
    Lambda -.->|"Assume Role"| ExecRole

    %% Styling Link Styles
    linkStyle 0,1,2,3 stroke:#4CAF50,stroke-width:2px; %% Green for Runtime Flow
    linkStyle 4,5,6,7,8 stroke:#2196F3,stroke-width:2px,stroke-dasharray: 5; %% Blue for DevOps Flow
```

### 💻 Frontend (Vercel)
* **Hosting**: Hosted on **Vercel** ([https://st-finance.vercel.app/](https://st-finance.vercel.app/)).
* **Configuration**: Set the following environment variable in the Vercel Settings to connect to the backend:
  * `NEXT_PUBLIC_API_URL`: The HTTPS Invoke URL from API Gateway.

### ⚡ Backend API (AWS Lambda)
* **Hosting**: Deployed as an ASP.NET Core 8.0 serverless function on **AWS Lambda** (behind API Gateway).
* **Configuration**: Set the following Environment Variables in the AWS Lambda Console:
  * `ASPNETCORE_ENVIRONMENT`: `Staging`
  * `ConnectionStrings__DbConnection`: Supabase connection string (`Host=...;Port=5432;Database=postgres;...`).
  * `JwtSettings__SecretKey`: Your 32+ character JWT signing key.
  * `Gmail__Username` / `Gmail__Password` / `Gmail__FromEmail`: SMTP credentials for OTP emails.
  * `SchedulerApiKey`: Secret API key to secure the recurring jobs.

### ⏰ Cron & Recurring Job Scheduling (EventBridge)
Because AWS Lambda is stateless and shuts down when inactive, background job runners (like Hangfire) are disabled in the cloud. Instead, **Amazon EventBridge Scheduler** is configured to trigger endpoints directly on a schedule:
1. **Process Recurring (Hourly)**: Sends a direct Lambda invoke payload triggering `POST /api/jobs/process-recurring`.
2. **Log Daily Quotas (Daily 00:00 BKK)**: Trigger payload invoking `POST /api/jobs/log-daily-quotas`.
* *Security*: Requests include the header `x-scheduler-api-key` which must match the `SchedulerApiKey` environment variable.

### 🚀 CI/CD Pipeline (GitHub Actions)
Pushes to the `main` branch trigger a deployment pipeline (`.github/workflows/deploy.yml`):
* **Security**: Authenticates with AWS via secure **OpenID Connect (OIDC)** (no permanent credentials stored).
* **Required GitHub Secrets**:
  * `AWS_ROLE_TO_ASSUME`: Role ARN of your deployer IAM role.
  * `AWS_DEPLOYMENT_S3_BUCKET`: Private S3 bucket (`st-finance-deployments-ryan-2026`) used to stage build archives.

---

## 💻 2. Quick Local Development

For local testing, the project runs on Kestrel and local PostgreSQL.

### Prerequisites
* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js (v18+) & npm](https://nodejs.org/)

### 🚀 Commands to Run

```bash
# 1. Start the local database (mounts init.sql automatically)
docker compose up -d db

# 2. Run the Backend API (runs auto-migrations and seeds demo data on empty start)
dotnet run --project ST_finance.Api/ST_finance.Api.csproj

# 3. Start the Frontend UI
cd ST_finance.Frontend
npm install
npm run dev
```
* Local API Docs: `http://localhost:5213/swagger` (Scalar: `/scalar/v1`)
* Local Frontend: `http://localhost:3000`

---

## 📂 3. Project Structure

```text
FinancialManagement/
├── README.md               # Main project introduction & cloud manual
├── docs/                   # Obsidian vault documentation MOC
│   ├── 00-Index.md
│   ├── Goals-and-Scope.md
│   ├── Architecture-Design.md
│   ├── Database-Schema.md
│   ├── Use-Cases.md
│   ├── Environments.md
│   └── AWS-Lambda-Deployment-Guide.md
├── ST_finance.slnx         # Solution file
├── ST_finance.Database/    # EF Core db context and schema configurations
├── ST_finance.Domain/      # Business logic controllers and services (contains JobsController)
├── ST_finance.Api/         # Main bootstrapping host and AWS Serverless templates
└── ST_finance.Frontend/    # Next.js client-side application
```

*For deeper engineering guides, see the notes inside the `docs/` folder (fully compatible with Obsidian).*
