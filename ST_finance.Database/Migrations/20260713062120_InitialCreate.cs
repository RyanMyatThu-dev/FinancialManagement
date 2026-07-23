using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ST_finance.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_OtpVerification",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    code = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    purpose = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    expiry_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_used = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_OtpVerification_pkey", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_User",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    full_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    refresh_token = table.Column<string>(type: "text", nullable: true),
                    refresh_token_expiry_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email_confirmed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    password_hash = table.Column<string>(type: "text", nullable: true),
                    security_stamp = table.Column<string>(type: "text", nullable: true),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true),
                    phone_number = table.Column<string>(type: "text", nullable: true),
                    phone_number_confirmed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    two_factor_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    lockout_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    lockout_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    access_failed_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_User_pkey", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_Tbl_User_UserId",
                        column: x => x.UserId,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_Tbl_User_UserId",
                        column: x => x.UserId,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_Tbl_User_UserId",
                        column: x => x.UserId,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_Tbl_User_UserId",
                        column: x => x.UserId,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_Account",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    account_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    balance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true, defaultValueSql: "0.00"),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValueSql: "'#4F46E5'::character varying"),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValueSql: "'Wallet'::character varying"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_Account_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_Account_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_Category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValueSql: "'#4F46E5'::character varying"),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValueSql: "'Tag'::character varying"),
                    is_default = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_Category_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_Category_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_DailyQuotaLog",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    target_quota = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValueSql: "0.00"),
                    actual_spent = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValueSql: "0.00"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_DailyQuotaLog_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_DailyQuotaLog_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_SavingsGoal",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    goal_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    target_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    target_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_completed = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_SavingsGoal_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_SavingsGoal_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_Tag",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValueSql: "'#4F46E5'::character varying"),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_Tag_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_Tag_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_UserProfile",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    monthly_allowance_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true, defaultValueSql: "16000.00"),
                    allowance_day_of_month = table.Column<int>(type: "integer", nullable: true, defaultValue: 25),
                    target_monthly_savings = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true, defaultValueSql: "2000.00"),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true, defaultValueSql: "'THB'::character varying"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_UserProfile_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_UserProfile_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_CategoryBudget",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    limit_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    month = table.Column<int>(type: "integer", nullable: false),
                    year = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_CategoryBudget_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_CategoryBudget_category_id_fkey",
                        column: x => x.category_id,
                        principalTable: "Tbl_Category",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "Tbl_CategoryBudget_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_RecurringSchedule",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    transaction_type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    frequency = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    day_of_month = table.Column<int>(type: "integer", nullable: true),
                    day_of_week = table.Column<int>(type: "integer", nullable: true),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_triggered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_occurrence_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_RecurringSchedule_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_RecurringSchedule_account_id_fkey",
                        column: x => x.account_id,
                        principalTable: "Tbl_Account",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "Tbl_RecurringSchedule_category_id_fkey",
                        column: x => x.category_id,
                        principalTable: "Tbl_Category",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "Tbl_RecurringSchedule_target_account_id_fkey",
                        column: x => x.target_account_id,
                        principalTable: "Tbl_Account",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "Tbl_RecurringSchedule_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_Transaction",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    transaction_type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_recurring_created = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    delete_flag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_Transaction_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_Transaction_account_id_fkey",
                        column: x => x.account_id,
                        principalTable: "Tbl_Account",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "Tbl_Transaction_category_id_fkey",
                        column: x => x.category_id,
                        principalTable: "Tbl_Category",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "Tbl_Transaction_target_account_id_fkey",
                        column: x => x.target_account_id,
                        principalTable: "Tbl_Account",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "Tbl_Transaction_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_SavingsContribution",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    savings_goal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    transaction_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    note = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_SavingsContribution_pkey", x => x.id);
                    table.ForeignKey(
                        name: "Tbl_SavingsContribution_savings_goal_id_fkey",
                        column: x => x.savings_goal_id,
                        principalTable: "Tbl_SavingsGoal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "Tbl_SavingsContribution_transaction_id_fkey",
                        column: x => x.transaction_id,
                        principalTable: "Tbl_Transaction",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_TransactionTag",
                columns: table => new
                {
                    transaction_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_TransactionTag_pkey", x => new { x.transaction_id, x.tag_id });
                    table.ForeignKey(
                        name: "Tbl_TransactionTag_tag_id_fkey",
                        column: x => x.tag_id,
                        principalTable: "Tbl_Tag",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "Tbl_TransactionTag_transaction_id_fkey",
                        column: x => x.transaction_id,
                        principalTable: "Tbl_Transaction",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_Account_user_id",
                table: "Tbl_Account",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_Category_user_id",
                table: "Tbl_Category",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_CategoryBudget_category_id",
                table: "Tbl_CategoryBudget",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "unique_user_category_budget_period",
                table: "Tbl_CategoryBudget",
                columns: new[] { "user_id", "category_id", "month", "year" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "unique_user_daily_quota_date",
                table: "Tbl_DailyQuotaLog",
                columns: new[] { "user_id", "date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Tbl_OtpVerification_email_purpose_idx",
                table: "Tbl_OtpVerification",
                columns: new[] { "email", "purpose" });

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_RecurringSchedule_account_id",
                table: "Tbl_RecurringSchedule",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_RecurringSchedule_category_id",
                table: "Tbl_RecurringSchedule",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_RecurringSchedule_target_account_id",
                table: "Tbl_RecurringSchedule",
                column: "target_account_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_RecurringSchedule_user_id",
                table: "Tbl_RecurringSchedule",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_SavingsContribution_savings_goal_id",
                table: "Tbl_SavingsContribution",
                column: "savings_goal_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_SavingsContribution_transaction_id",
                table: "Tbl_SavingsContribution",
                column: "transaction_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_SavingsGoal_user_id",
                table: "Tbl_SavingsGoal",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "unique_user_tag_name",
                table: "Tbl_Tag",
                columns: new[] { "user_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_Transaction_account_id",
                table: "Tbl_Transaction",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_Transaction_category_id",
                table: "Tbl_Transaction",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_Transaction_target_account_id",
                table: "Tbl_Transaction",
                column: "target_account_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_Transaction_user_id",
                table: "Tbl_Transaction",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_TransactionTag_tag_id",
                table: "Tbl_TransactionTag",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "Tbl_User",
                column: "normalized_email");

            migrationBuilder.CreateIndex(
                name: "Tbl_User_email_key",
                table: "Tbl_User",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Tbl_User_normalized_email_key",
                table: "Tbl_User",
                column: "normalized_email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Tbl_User_normalized_username_key",
                table: "Tbl_User",
                column: "normalized_username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Tbl_User_username_key",
                table: "Tbl_User",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "Tbl_User",
                column: "normalized_username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Tbl_UserProfile_user_id_key",
                table: "Tbl_UserProfile",
                column: "user_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Tbl_CategoryBudget");

            migrationBuilder.DropTable(
                name: "Tbl_DailyQuotaLog");

            migrationBuilder.DropTable(
                name: "Tbl_OtpVerification");

            migrationBuilder.DropTable(
                name: "Tbl_RecurringSchedule");

            migrationBuilder.DropTable(
                name: "Tbl_SavingsContribution");

            migrationBuilder.DropTable(
                name: "Tbl_TransactionTag");

            migrationBuilder.DropTable(
                name: "Tbl_UserProfile");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Tbl_SavingsGoal");

            migrationBuilder.DropTable(
                name: "Tbl_Tag");

            migrationBuilder.DropTable(
                name: "Tbl_Transaction");

            migrationBuilder.DropTable(
                name: "Tbl_Account");

            migrationBuilder.DropTable(
                name: "Tbl_Category");

            migrationBuilder.DropTable(
                name: "Tbl_User");
        }
    }
}
