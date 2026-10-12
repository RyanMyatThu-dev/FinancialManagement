using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ST_finance.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringTransactionIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "recurring_occurrence_date",
                table: "Tbl_Transaction",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "recurring_schedule_id",
                table: "Tbl_Transaction",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "unique_recurring_schedule_occurrence",
                table: "Tbl_Transaction",
                columns: new[] { "recurring_schedule_id", "recurring_occurrence_date" },
                unique: true,
                filter: "recurring_schedule_id IS NOT NULL AND recurring_occurrence_date IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "unique_recurring_schedule_occurrence",
                table: "Tbl_Transaction");

            migrationBuilder.DropColumn(
                name: "recurring_occurrence_date",
                table: "Tbl_Transaction");

            migrationBuilder.DropColumn(
                name: "recurring_schedule_id",
                table: "Tbl_Transaction");
        }
    }
}
