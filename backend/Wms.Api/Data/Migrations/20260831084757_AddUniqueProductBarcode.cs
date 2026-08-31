using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wms.Api.Data.Migrations;

public partial class AddUniqueProductBarcode : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_Products_Barcode",
            table: "Products",
            column: "Barcode",
            unique: true,
            filter: "[Barcode] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Products_Barcode",
            table: "Products");
    }
}
