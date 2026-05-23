using System.ComponentModel.DataAnnotations;
using CarRepairCenter.Core.Enums;

namespace CarRepairCenter.Core.Entities;

public class RepairOrder
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string OrderCode { get; set; } = string.Empty;

    public int CustomerId { get; set; }
    public int VehicleId { get; set; }

    [Required, MaxLength(1000)]
    public string ProblemDescription { get; set; } = string.Empty;

    public RepairStatus Status { get; set; } = RepairStatus.Waiting;

    /// <summary>
    /// Discount percentage applied to the total (0-100)
    /// </summary>
    public decimal DiscountPercentage { get; set; } = 0;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }

    [MaxLength(450)]
    public string? CreatedByUserId { get; set; }

    // Computed properties
    public decimal TotalServicesAmount => RepairOrderServices?.Sum(s => s.Price) ?? 0;
    public decimal TotalPartsAmount => RepairOrderParts?.Sum(p => p.TotalPrice) ?? 0;
    public decimal SubTotal => TotalServicesAmount + TotalPartsAmount;
    public decimal DiscountAmount => SubTotal * (DiscountPercentage / 100);
    public decimal TotalAmount => SubTotal - DiscountAmount;
    public decimal PaidAmount => Payments?.Sum(p => p.Amount) ?? 0;
    public decimal RemainingAmount => TotalAmount - PaidAmount;
    public bool IsFullyPaid => RemainingAmount <= 0;

    // Navigation
    public Customer Customer { get; set; } = null!;
    public Vehicle Vehicle { get; set; } = null!;
    public ICollection<RepairOrderService> RepairOrderServices { get; set; } = new List<RepairOrderService>();
    public ICollection<RepairOrderPart> RepairOrderParts { get; set; } = new List<RepairOrderPart>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
