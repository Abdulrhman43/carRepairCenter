using System.ComponentModel.DataAnnotations;

namespace CarRepairCenter.Core.Entities;

public class Service
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    public decimal DefaultPrice { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<RepairOrderService> RepairOrderServices { get; set; } = new List<RepairOrderService>();
}
