using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wms.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Locations",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Storage");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Locations");
        }
    }
}
