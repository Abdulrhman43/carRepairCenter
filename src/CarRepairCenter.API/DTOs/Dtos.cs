using System.ComponentModel.DataAnnotations;

namespace CarRepairCenter.API.DTOs;

// ── Auth ──
public record LoginDto([Required] string Email, [Required] string Password);
public record AuthResponseDto(string Token, string Email, string FullName, string Role, DateTime Expiration);

// ── Customer ──
public record CustomerDto(int Id, string CustomerCode, string Name, string Phone, string? Phone2, string? Address, string? Notes, DateTime CreatedAt, int VehicleCount);
public record CreateCustomerDto([Required] string Name, [Required] string Phone, string? Phone2, string? Address, string? Notes);
public record UpdateCustomerDto([Required] string Name, [Required] string Phone, string? Phone2, string? Address, string? Notes);

// ── Vehicle ──
public record VehicleDto(int Id, int CustomerId, string CustomerName, string PlateNumber, string Make, string Model, int? Year, string? Color, string? VIN, string? Notes, DateTime CreatedAt);
public record CreateVehicleDto(int CustomerId, [Required] string PlateNumber, [Required] string Make, [Required] string Model, int? Year, string? Color, string? VIN, string? Notes);

// ── Service ──
public record ServiceDto(int Id, string Name, string? Description, decimal DefaultPrice, bool IsActive);
public record CreateServiceDto([Required] string Name, string? Description, [Required] decimal DefaultPrice);
public record UpdateServiceDto([Required] string Name, string? Description, [Required] decimal DefaultPrice, bool IsActive);

// ── Inventory ──
public record InventoryItemDto(int Id, string ItemCode, string Name, string? Category, int Quantity, decimal UnitPrice, int MinStockLevel, string Unit, bool IsActive, bool IsLowStock);
public record CreateInventoryItemDto([Required] string Name, string? Category, int Quantity, [Required] decimal UnitPrice, int MinStockLevel, string Unit);
public record UpdateInventoryItemDto([Required] string Name, string? Category, int Quantity, [Required] decimal UnitPrice, int MinStockLevel, string Unit, bool IsActive);

// ── RepairOrder ──
public record RepairOrderDto(int Id, string OrderCode, int CustomerId, string CustomerName, string CustomerPhone, int VehicleId, string VehiclePlate, string VehicleMakeModel, string ProblemDescription, string Status, decimal DiscountPercentage, decimal TotalServicesAmount, decimal TotalPartsAmount, decimal SubTotal, decimal DiscountAmount, decimal TotalAmount, decimal PaidAmount, decimal RemainingAmount, bool IsFullyPaid, string? Notes, DateTime CreatedAt, DateTime? StartedAt, DateTime? CompletedAt, DateTime? DeliveredAt, List<RepairOrderServiceDto> Services, List<RepairOrderPartDto> Parts, List<PaymentDto> Payments);
public record CreateRepairOrderDto(int CustomerId, int VehicleId, [Required] string ProblemDescription, string? Notes, decimal DiscountPercentage);
public record UpdateRepairOrderStatusDto([Required] string Status);

// ── RepairOrderService ──
public record RepairOrderServiceDto(int Id, int ServiceId, string ServiceName, decimal Price, string? Notes);
public record AddRepairOrderServiceDto(int ServiceId, decimal Price, string? Notes);

// ── RepairOrderPart ──
public record RepairOrderPartDto(int Id, int InventoryItemId, string ItemName, int Quantity, decimal UnitPrice, decimal TotalPrice);
public record AddRepairOrderPartDto(int InventoryItemId, int Quantity, decimal? UnitPrice);

// ── Payment ──
public record PaymentDto(int Id, int RepairOrderId, string? OrderCode, string? CustomerName, decimal Amount, string PaymentMethod, string? Notes, DateTime PaidAt);
public record CreatePaymentDto(int RepairOrderId, decimal Amount, [Required] string PaymentMethod, string? Notes);

// ── Reports ──
public record DailyReportDto(DateTime Date, decimal TotalRevenue, int TotalOrders, int CompletedOrders, int PendingOrders, decimal OutstandingBalance, List<PaymentMethodSummaryDto> PaymentBreakdown);
public record PaymentMethodSummaryDto(string Method, decimal Amount, int Count);

// ── Dashboard ──
public record DashboardDto(int TodayOrders, int ActiveOrders, decimal TodayRevenue, decimal TotalOutstanding, int LowStockItems, int TotalCustomers, List<RepairOrderDto> RecentOrders);
