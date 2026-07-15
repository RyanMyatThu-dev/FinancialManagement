# Environments & Deployment

This document tracks the deployment and hosting environments for the Student Financial Management and Budget Tracker Application.

## 📌 Environment Strategy
We maintain separate environments for development, testing, staging, and production to isolate data and test features before they reach users.

---

## 🧪 Staging (Active Stage)
The staging environment is used for end-to-end verification, showcasing updates, and QA. It mimics the production setup with the same architecture components, hosted on free/low-cost tiers.

### 🌐 Overview & Hosting
| Component | Technology | Hosting Provider / Tier | Details |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL | Supabase | Managed PostgreSQL database on Supabase's cloud infrastructure. |
| **Backend API** | ASP.NET Core | AWS Lambda + API Gateway | Serverless function fronted by an API Gateway HTTP API (fully covered by perpetual free tier). |
| **Frontend UI** | Next.js / React | Vercel | Hosted on Vercel for native support, preview deployments, and optimal speed. |

### 🛠️ Configuration & Secrets
*   **Database URL**: Hosted on Supabase.
*   **API Base URL**: Hosted on API Gateway endpoint URL (or custom domain).
*   **Frontend CORS**: Configured to accept requests from the Vercel app domain.

---

## 🚀 Production (Upcoming Stage)
The production environment will host the live application for students. 

> [!TIP]
> To maximize the duration of our $100 AWS credits and make use of the perpetual free tier, production will also be deployed serverless using **AWS Lambda** and **API Gateway**. This ensures high availability, automatic scaling, and zero idle costs when the app is not in use.

---

*Related links:*
- [[Architecture-Design]]
- [[Database-Schema]]
- [[00-Index]]
