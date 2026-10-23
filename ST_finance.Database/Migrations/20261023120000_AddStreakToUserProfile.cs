using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ST_finance.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddStreakToUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "current_streak",
                table: "Tbl_UserProfile",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "longest_streak",
                table: "Tbl_UserProfile",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateOnly>(
                name: "last_logged_date",
                table: "Tbl_UserProfile",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "current_streak",
                table: "Tbl_UserProfile");

            migrationBuilder.DropColumn(
                name: "longest_streak",
                table: "Tbl_UserProfile");

            migrationBuilder.DropColumn(
                name: "last_logged_date",
                table: "Tbl_UserProfile");
        }
    }
}
