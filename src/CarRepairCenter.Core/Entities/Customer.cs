using System.ComponentModel.DataAnnotations;

namespace CarRepairCenter.Core.Entities;

public class Customer
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string CustomerCode { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone2 { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    public ICollection<RepairOrder> RepairOrders { get; set; } = new List<RepairOrder>();
}
