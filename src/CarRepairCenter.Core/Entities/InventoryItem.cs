using System.ComponentModel.DataAnnotations;

namespace CarRepairCenter.Core.Entities;

public class InventoryItem
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string ItemCode { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Category { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public int MinStockLevel { get; set; } = 5;

    [MaxLength(20)]
    public string Unit { get; set; } = "قطعة";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Computed
    public bool IsLowStock => Quantity <= MinStockLevel;

    // Navigation
    public ICollection<RepairOrderPart> RepairOrderParts { get; set; } = new List<RepairOrderPart>();
}
