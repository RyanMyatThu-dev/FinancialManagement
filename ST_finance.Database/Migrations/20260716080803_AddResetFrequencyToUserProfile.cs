using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ST_finance.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddResetFrequencyToUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "reset_frequency",
                table: "Tbl_UserProfile",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                defaultValueSql: "'Monthly'::character varying");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "reset_frequency",
                table: "Tbl_UserProfile");
        }
    }
}
