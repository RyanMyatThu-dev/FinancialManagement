using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ST_finance.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationInfrastructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "time_zone_id",
                table: "Tbl_UserProfile",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValueSql: "'Asia/Bangkok'::character varying");

            migrationBuilder.CreateTable(
                name: "Tbl_Notification",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    dedupe_key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    body = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    action_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    data_json = table.Column<string>(type: "jsonb", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValueSql: "'Pending'::character varying"),
                    scheduled_for = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    queued_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_Notification_pkey", x => x.id);
                    table.CheckConstraint("Tbl_Notification_status_check", "status IN ('Pending', 'Queued', 'Completed', 'Cancelled', 'Failed')");
                    table.ForeignKey(
                        name: "Tbl_Notification_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_NotificationPreference",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    daily_reminder_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    daily_reminder_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false, defaultValue: new TimeOnly(20, 0, 0)),
                    next_daily_reminder_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    balance_alerts_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    fun_notifications_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    quiet_hours_start = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    quiet_hours_end = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    show_sensitive_content = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_NotificationPreference_pkey", x => x.id);
                    table.CheckConstraint("Tbl_NotificationPreference_quiet_hours_check", "(quiet_hours_start IS NULL AND quiet_hours_end IS NULL) OR (quiet_hours_start IS NOT NULL AND quiet_hours_end IS NOT NULL)");
                    table.ForeignKey(
                        name: "Tbl_NotificationPreference_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_PushSubscription",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    endpoint = table.Column<string>(type: "text", nullable: false),
                    p256dh_key = table.Column<string>(type: "text", nullable: false),
                    auth_key = table.Column<string>(type: "text", nullable: false),
                    device_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_success_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    failure_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_PushSubscription_pkey", x => x.id);
                    table.CheckConstraint("Tbl_PushSubscription_failure_count_check", "failure_count >= 0");
                    table.ForeignKey(
                        name: "Tbl_PushSubscription_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "Tbl_User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tbl_NotificationDelivery",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    notification_id = table.Column<Guid>(type: "uuid", nullable: false),
                    push_subscription_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValueSql: "'Pending'::character varying"),
                    attempt_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_attempt_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    failure_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    failure_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("Tbl_NotificationDelivery_pkey", x => x.id);
                    table.CheckConstraint("Tbl_NotificationDelivery_attempt_count_check", "attempt_count >= 0");
                    table.CheckConstraint("Tbl_NotificationDelivery_status_check", "status IN ('Pending', 'Sent', 'TemporaryFailure', 'PermanentFailure', 'Skipped')");
                    table.ForeignKey(
                        name: "Tbl_NotificationDelivery_notification_id_fkey",
                        column: x => x.notification_id,
                        principalTable: "Tbl_Notification",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "Tbl_NotificationDelivery_push_subscription_id_fkey",
                        column: x => x.push_subscription_id,
                        principalTable: "Tbl_PushSubscription",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "Tbl_Notification_pending_schedule_idx",
                table: "Tbl_Notification",
                column: "scheduled_for",
                filter: "status = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "Tbl_Notification_user_dedupe_key",
                table: "Tbl_Notification",
                columns: new[] { "user_id", "dedupe_key" },
                unique: true,
                filter: "dedupe_key IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tbl_NotificationDelivery_push_subscription_id",
                table: "Tbl_NotificationDelivery",
                column: "push_subscription_id");

            migrationBuilder.CreateIndex(
                name: "Tbl_NotificationDelivery_notification_subscription_key",
                table: "Tbl_NotificationDelivery",
                columns: new[] { "notification_id", "push_subscription_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Tbl_NotificationDelivery_retry_idx",
                table: "Tbl_NotificationDelivery",
                columns: new[] { "status", "last_attempt_at" },
                filter: "status IN ('Pending', 'TemporaryFailure')");

            migrationBuilder.CreateIndex(
                name: "Tbl_NotificationPreference_due_daily_idx",
                table: "Tbl_NotificationPreference",
                column: "next_daily_reminder_at",
                filter: "daily_reminder_enabled = TRUE AND next_daily_reminder_at IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "Tbl_NotificationPreference_user_id_key",
                table: "Tbl_NotificationPreference",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "Tbl_PushSubscription_active_user_idx",
                table: "Tbl_PushSubscription",
                column: "user_id",
                filter: "revoked_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "Tbl_PushSubscription_endpoint_key",
                table: "Tbl_PushSubscription",
                column: "endpoint",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tbl_NotificationDelivery");

            migrationBuilder.DropTable(
                name: "Tbl_NotificationPreference");

            migrationBuilder.DropTable(
                name: "Tbl_Notification");

            migrationBuilder.DropTable(
                name: "Tbl_PushSubscription");

            migrationBuilder.DropColumn(
                name: "time_zone_id",
                table: "Tbl_UserProfile");
        }
    }
}
