# AWS Lambda Serverless Deployment Guide

This guide details the steps, commands, and architectural concepts required to deploy the ASP.NET Core Web API to AWS Lambda fronted by Amazon API Gateway. 

---

## 🧠 1. Core Serverless Concepts

For a first-time practical deployment, it is important to map SAA-C03 theory to real AWS behavior:

### A. AWS Lambda (Function-as-a-Service)
* **Execution Model**: Unlike a container running 24/7 on EC2, Lambda is event-driven. AWS provisions a microVM (using Firecracker) only when an HTTP request arrives, runs the API code, and then freezes the execution context.
* **Scale-to-Zero**: If there are no requests, the resources are released. You pay **$0.00** for idle time.
* **Cold Starts**: The first request to an idle function experiences a "cold start" delay (typically 1-3 seconds for .NET 8) while AWS instantiates the microVM and bootstraps the .NET runtime. Subsequent requests are "warm" and execute in milliseconds.

### B. Amazon API Gateway
* **Role**: Acts as the public entry point (HTTP endpoint) for your API. It receives the HTTPS request, packages it into a JSON payload (Proxy Integration), and invokes your Lambda function.
* **HTTP API vs. REST API**: 
  * **HTTP API** (Recommended): A lightweight, low-latency, and significantly cheaper version of API Gateway (perfect for staging and cost-savings).
  * **REST API**: Includes advanced enterprise features (API keys, request validation, usage plans) but costs more.

### C. IAM Execution Role
* Lambda requires an IAM Role (Service Role) to grant it permission to execute and interact with other AWS services (e.g., writing logs to Amazon CloudWatch).

---

## 🛠️ 2. Step 1: Code Configuration

To run a standard ASP.NET Core Web API inside Lambda, you must equip the project with the AWS Lambda wrapper.

### 1. Install the NuGet Package
Add the hosting wrapper to the API project (`ST_finance.Api`):
```bash
dotnet add ST_finance.Api/ST_finance.Api.csproj package Amazon.Lambda.AspNetCoreServer.Hosting
```

### 2. Update `Program.cs`
Modify `ST_finance.Api/Program.cs` to check if it is running in AWS Lambda. Add the following line:

```csharp
// Register AWS Lambda Hosting. 
// When running locally, this behaves as a normal Kestrel web server.
// When running on AWS Lambda, it automatically forwards API Gateway HTTP requests to ASP.NET Core controllers.
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);
```

---

## 📦 3. Step 2: Tooling Setup

AWS provides a specialized .NET Core Global CLI Tool to package and deploy Lambda functions directly from the terminal.

### 1. Install the AWS Lambda Global Tool
```bash
dotnet tool install -g Amazon.Lambda.Tools
```
*(If already installed, ensure it is updated: `dotnet tool update -g Amazon.Lambda.Tools`)*

### 2. Verify AWS CLI Configuration
Ensure your terminal is authenticated with your AWS account:
```bash
aws sts get-caller-identity
```
If not configured, run `aws configure` and enter your Access Key, Secret Key, and Default Region.

---

## 🚀 4. Step 3: Deployment Options

There are two primary methods to deploy your API using the CLI tool.

### Option A: The Serverless Application (Recommended - IaC)
This method uses AWS CloudFormation (Infrastructure-as-Code) to automatically provision the Lambda function, IAM Role, and API Gateway HTTP API in a single step.

1. Create a `serverless.template` file in the project directory (`ST_finance.Api/`). This template defines the CloudFormation stack:
   ```json
   {
     "AWSTemplateFormatVersion": "2010-09-09",
     "Transform": "AWS::Serverless-2016-10-31",
     "Description": "An AWS Serverless Application running ASP.NET Core Web API.",
     "Resources": {
       "AspNetCoreFunction": {
         "Type": "AWS::Serverless::Function",
         "Properties": {
           "Handler": "ST_finance.Api",
           "Runtime": "dotnet8",
           "CodeUri": "",
           "MemorySize": 512,
           "Timeout": 30,
           "Role": {
             "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/st-finance-lambda-execution-role"
           },
           "Events": {
             "ProxyResource": {
               "Type": "HttpApi",
               "Properties": {
                 "Path": "/{proxy+}",
                 "Method": "ANY"
               }
             },
             "RootResource": {
               "Type": "HttpApi",
               "Properties": {
                 "Path": "/",
                 "Method": "ANY"
               }
             }
           }
         }
       }
     },
     "Outputs": {
       "ApiURL": {
         "Description": "API Gateway Endpoint URL",
         "Value": {
           "Fn::Sub": "https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com/"
         }
       }
     }
   }
   ```
2. Run the deployment command from the project directory. Supply your S3 deployment bucket dynamically via the `--s3-bucket` flag so that you don't have to hardcode your private bucket name in the configuration files:
   ```bash
   dotnet lambda deploy-serverless --stack-name st-finance-staging-stack --s3-bucket <your-unique-s3-bucket-name>
   ```
3. **Result**: CloudFormation builds your code, zips it, uploads it to S3, constructs the Lambda function, creates the API Gateway, hooks up the permissions, and prints out the final `ApiURL` endpoint in the console.

---

### Option B: Raw Function Deployment (Manual Hookup)
If you prefer to configure the AWS resources manually through the AWS Web Console:

1. **Deploy the Lambda Function**:
   ```bash
   dotnet lambda deploy-function st-finance-staging-api
   ```
   *The CLI will ask you to select the runtime (`dotnet8`), memory (`512MB`), timeout (`30s`), and select or create an IAM execution role (choose the basic execution role).*

2. **Manually Create HTTP API in AWS Console**:
   * Go to the **API Gateway Console** -> Create API -> **HTTP API**.
   * Add Integration -> Choose **Lambda** -> Select your function (`st-finance-staging-api`).
   * Configure Routes: Set route to `ANY /{proxy+}` (captures all paths like `/api/auth/login`, `/api/accounts`) and `ANY /` (captures root index).
   * Deploy the API and copy the Invoke URL.

---

## 🔒 5. Step 4: Environment Variables & Database Connection

Lambda runs in isolated environments. You must supply your database credentials as Environment Variables.

### 1. Setting Variables in the AWS Console
1. Go to **AWS Lambda Console** -> Functions -> Select your function.
2. Navigate to **Configuration** tab -> **Environment variables** -> Click **Edit**.
3. Add key-value pairs:
   * `ASPNETCORE_ENVIRONMENT` = `Staging`
   * `ConnectionStrings__DefaultConnection` = `Host=<supabase_host>;Port=5432;Database=postgres;Username=postgres;Password=<your_password>;`

> [!IMPORTANT]
> Double underscores (`__`) are used in environmental configurations as key separators to represent nested JSON configurations (e.g., `ConnectionStrings:DefaultConnection` in `appsettings.json` becomes `ConnectionStrings__DefaultConnection`).

---

## ⚡ 6. Optimization Best Practices (.NET Serverless)

To keep performance high and cost low:

1. **Memory Allocation**: 
   * Do not allocate `128MB` to a .NET Lambda. It will run slow and suffer from heavy cold starts. 
   * **Allocate `512MB` or `1024MB`**. AWS scales CPU power proportionally with memory. A faster execution time often costs *less* overall than a slow execution time on lower memory.
2. **Minimize ZIP Size**:
   * Make sure your project file doesn't publish unnecessary files. The AWS Lambda zip package size limit is 50MB (zipped) and 250MB (unzipped).
3. **CORS Setup**:
   * Ensure that the backend Cors configuration (in `Program.cs`) permits requests from your Vercel frontend URL.

---

*Related links:*
- [[Environments]]
- [[Architecture-Design]]
