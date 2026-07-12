# Base stage for running the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["ST_finance.Domain/ST_finance.Domain.csproj", "ST_finance.Domain/"]
COPY ["ST_finance.Database/ST_finance.Database.csproj", "ST_finance.Database/"]
COPY ["ST_finance.Api/ST_finance.Api.csproj", "ST_finance.Api/"]
RUN dotnet restore "ST_finance.Api/ST_finance.Api.csproj"

# Copy all source files and compile
COPY . .
WORKDIR "/src/ST_finance.Api"
RUN dotnet build "ST_finance.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "ST_finance.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ST_finance.Api.dll"]
