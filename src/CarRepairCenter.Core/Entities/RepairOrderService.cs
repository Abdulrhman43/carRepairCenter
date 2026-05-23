using System.ComponentModel.DataAnnotations;

namespace CarRepairCenter.Core.Entities;

public class RepairOrderService
{
    public int Id { get; set; }

    public int RepairOrderId { get; set; }
    public int ServiceId { get; set; }

    /// <summary>
    /// Price can differ from default (custom pricing per customer)
    /// </summary>
    public decimal Price { get; set; }

    [MaxLength(300)]
    public string? Notes { get; set; }

    // Navigation
    public RepairOrder RepairOrder { get; set; } = null!;
    public Service Service { get; set; } = null!;
}
