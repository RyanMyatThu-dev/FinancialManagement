using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ST_finance.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddEnableQuotaPacingToUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "enable_quota_pacing",
                table: "Tbl_UserProfile",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "enable_quota_pacing",
                table: "Tbl_UserProfile");
        }
    }
}
