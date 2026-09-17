using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wms.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentCounters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DocumentCounters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentType = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    LastNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentCounters", x => x.Id);
                    table.CheckConstraint("CK_DocumentCounters_LastNumber", "[LastNumber] > 0");
                    table.CheckConstraint("CK_DocumentCounters_Year", "[Year] >= 2000 AND [Year] <= 9999");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentCounters_DocumentType_Year",
                table: "DocumentCounters",
                columns: new[] { "DocumentType", "Year" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentCounters");
        }
    }
}
