using System.ComponentModel.DataAnnotations;
using CarRepairCenter.Core.Enums;

namespace CarRepairCenter.Core.Entities;

public class Payment
{
    public int Id { get; set; }

    public int RepairOrderId { get; set; }

    public decimal Amount { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    [MaxLength(300)]
    public string? Notes { get; set; }

    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    [MaxLength(450)]
    public string? RecordedByUserId { get; set; }

    // Navigation
    public RepairOrder RepairOrder { get; set; } = null!;
}
