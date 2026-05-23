using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRepairCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_RepairOrders_CreatedAt",
                table: "RepairOrders",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RepairOrders_Status",
                table: "RepairOrders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaidAt",
                table: "Payments",
                column: "PaidAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RepairOrders_CreatedAt",
                table: "RepairOrders");

            migrationBuilder.DropIndex(
                name: "IX_RepairOrders_Status",
                table: "RepairOrders");

            migrationBuilder.DropIndex(
                name: "IX_Payments_PaidAt",
                table: "Payments");
        }
    }
}
