namespace CarRepairCenter.Core.Entities;

public class RepairOrderPart
{
    public int Id { get; set; }

    public int RepairOrderId { get; set; }
    public int InventoryItemId { get; set; }

    public int Quantity { get; set; }

    /// <summary>
    /// Price at time of use (snapshot)
    /// </summary>
    public decimal UnitPrice { get; set; }

    public decimal TotalPrice => Quantity * UnitPrice;

    // Navigation
    public RepairOrder RepairOrder { get; set; } = null!;
    public InventoryItem InventoryItem { get; set; } = null!;
}
