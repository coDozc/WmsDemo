using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Wms.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkGoodsReceiptsToPurchaseOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PurchaseOrderId",
                table: "GoodsReceipts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceipts_PurchaseOrderId",
                table: "GoodsReceipts",
                column: "PurchaseOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_GoodsReceipts_PurchaseOrders_PurchaseOrderId",
                table: "GoodsReceipts",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GoodsReceipts_PurchaseOrders_PurchaseOrderId",
                table: "GoodsReceipts");

            migrationBuilder.DropIndex(
                name: "IX_GoodsReceipts_PurchaseOrderId",
                table: "GoodsReceipts");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "GoodsReceipts");
        }
    }
}
