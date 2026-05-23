using System.ComponentModel.DataAnnotations;

namespace CarRepairCenter.Core.Entities;

public class Vehicle
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    [Required, MaxLength(20)]
    public string PlateNumber { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Make { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    public int? Year { get; set; }

    [MaxLength(30)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? VIN { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Customer Customer { get; set; } = null!;
    public ICollection<RepairOrder> RepairOrders { get; set; } = new List<RepairOrder>();
}
