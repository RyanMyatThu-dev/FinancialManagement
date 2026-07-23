using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ST_finance.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddCompletedAtToSavingsGoal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "completed_at",
                table: "Tbl_SavingsGoal",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "completed_at",
                table: "Tbl_SavingsGoal");
        }
    }
}
