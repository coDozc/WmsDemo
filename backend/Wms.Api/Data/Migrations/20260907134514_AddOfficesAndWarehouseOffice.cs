using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wms.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOfficesAndWarehouseOffice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses");

            migrationBuilder.AddColumn<int>(
                name: "OfficeId",
                table: "Warehouses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Offices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offices", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Offices",
                columns: new[]
                {
                    "Id", "Code", "Name", "City", "District", "Type",
                    "IsActive", "CreatedAtUtc"
                },
                values: new object[]
                {
                    1,
                    "MERKEZ",
                    "Merkez Ofis",
                    "İstanbul",
                    null,
                    "Headquarters",
                    true,
                    new DateTime(2026, 9, 7, 0, 0, 0, DateTimeKind.Utc)
                });

            migrationBuilder.Sql(
                "UPDATE [Warehouses] SET [OfficeId] = 1 WHERE [OfficeId] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_OfficeId_Code",
                table: "Warehouses",
                columns: new[] { "OfficeId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Offices_Code",
                table: "Offices",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Warehouses_Offices_OfficeId",
                table: "Warehouses",
                column: "OfficeId",
                principalTable: "Offices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Warehouses_Offices_OfficeId",
                table: "Warehouses");

            migrationBuilder.DropTable(
                name: "Offices");

            migrationBuilder.DropIndex(
                name: "IX_Warehouses_OfficeId_Code",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "OfficeId",
                table: "Warehouses");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses",
                column: "Code",
                unique: true);
        }
    }
}
