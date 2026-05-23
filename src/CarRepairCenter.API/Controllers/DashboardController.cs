using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRepairCenter.API.DTOs;
using CarRepairCenter.Core.Enums;
using CarRepairCenter.Infrastructure.Data;

namespace CarRepairCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get()
    {
        var today = DateTime.UtcNow.Date;

        // Run independent count queries in parallel
        var todayOrdersTask = _db.RepairOrders.CountAsync(r => r.CreatedAt.Date == today);
        var activeOrdersTask = _db.RepairOrders.CountAsync(r => r.Status == RepairStatus.Waiting || r.Status == RepairStatus.InProgress);
        var todayRevenueTask = _db.Payments.Where(p => p.PaidAt.Date == today).SumAsync(p => (decimal?)p.Amount);
        var lowStockItemsTask = _db.InventoryItems.CountAsync(i => i.Quantity <= i.MinStockLevel && i.IsActive);
        var totalCustomersTask = _db.Customers.CountAsync();

        await Task.WhenAll(todayOrdersTask, activeOrdersTask, todayRevenueTask, lowStockItemsTask, totalCustomersTask);

        // Calculate outstanding entirely in SQL — no entity materialization
        var totalOutstanding = await _db.RepairOrders
            .Select(r => new
            {
                ServiceTotal = r.RepairOrderServices.Sum(s => (decimal?)s.Price) ?? 0m,
                PartsTotal = r.RepairOrderParts.Sum(p => (decimal?)(p.Quantity * p.UnitPrice)) ?? 0m,
                Paid = r.Payments.Sum(p => (decimal?)p.Amount) ?? 0m,
                r.DiscountPercentage
            })
            .Select(x => new
            {
                Remaining = (x.ServiceTotal + x.PartsTotal) - ((x.ServiceTotal + x.PartsTotal) * x.DiscountPercentage / 100m) - x.Paid
            })
            .Where(x => x.Remaining > 0)
            .SumAsync(x => (decimal?)x.Remaining) ?? 0m;

        var recentOrders = await _db.RepairOrders
            .Include(r => r.Customer).Include(r => r.Vehicle)
            .Include(r => r.RepairOrderServices).ThenInclude(s => s.Service)
            .Include(r => r.RepairOrderParts).ThenInclude(p => p.InventoryItem)
            .Include(r => r.Payments)
            .AsSplitQuery()
            .OrderByDescending(r => r.CreatedAt).Take(5).ToListAsync();

        return Ok(new DashboardDto(
            todayOrdersTask.Result, activeOrdersTask.Result, todayRevenueTask.Result ?? 0, totalOutstanding, lowStockItemsTask.Result, totalCustomersTask.Result,
            recentOrders.Select(r => new RepairOrderDto(
                r.Id, r.OrderCode, r.CustomerId, r.Customer.Name, r.Customer.Phone,
                r.VehicleId, r.Vehicle.PlateNumber, $"{r.Vehicle.Make} {r.Vehicle.Model}",
                r.ProblemDescription, r.Status.ToString(), r.DiscountPercentage,
                r.TotalServicesAmount, r.TotalPartsAmount, r.SubTotal,
                r.DiscountAmount, r.TotalAmount, r.PaidAmount, r.RemainingAmount, r.IsFullyPaid,
                r.Notes, r.CreatedAt, r.StartedAt, r.CompletedAt, r.DeliveredAt,
                r.RepairOrderServices.Select(s => new RepairOrderServiceDto(s.Id, s.ServiceId, s.Service.Name, s.Price, s.Notes)).ToList(),
                r.RepairOrderParts.Select(p => new RepairOrderPartDto(p.Id, p.InventoryItemId, p.InventoryItem.Name, p.Quantity, p.UnitPrice, p.TotalPrice)).ToList(),
                r.Payments.Select(p => new PaymentDto(p.Id, p.RepairOrderId, r.OrderCode, r.Customer.Name, p.Amount, p.PaymentMethod.ToString(), p.Notes, p.PaidAt)).ToList()
            )).ToList()
        ));
    }

    [HttpGet("report")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DailyReportDto>> DailyReport([FromQuery] DateTime? date)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;

        // Run independent queries in parallel
        var paymentsTask = _db.Payments.Where(p => p.PaidAt.Date == targetDate).ToListAsync();
        var ordersCreatedTask = _db.RepairOrders.CountAsync(r => r.CreatedAt.Date == targetDate);
        var ordersCompletedTask = _db.RepairOrders.CountAsync(r => r.CompletedAt.HasValue && r.CompletedAt.Value.Date == targetDate);
        var pendingOrdersTask = _db.RepairOrders.CountAsync(r => r.Status == RepairStatus.Waiting || r.Status == RepairStatus.InProgress);

        // Calculate outstanding entirely in SQL — no full table load
        var outstandingTask = _db.RepairOrders
            .Select(r => new
            {
                ServiceTotal = r.RepairOrderServices.Sum(s => (decimal?)s.Price) ?? 0m,
                PartsTotal = r.RepairOrderParts.Sum(p => (decimal?)(p.Quantity * p.UnitPrice)) ?? 0m,
                Paid = r.Payments.Sum(p => (decimal?)p.Amount) ?? 0m,
                r.DiscountPercentage
            })
            .Select(x => new
            {
                Remaining = (x.ServiceTotal + x.PartsTotal) - ((x.ServiceTotal + x.PartsTotal) * x.DiscountPercentage / 100m) - x.Paid
            })
            .Where(x => x.Remaining > 0)
            .SumAsync(x => (decimal?)x.Remaining);

        await Task.WhenAll(paymentsTask, ordersCreatedTask, ordersCompletedTask, pendingOrdersTask, outstandingTask);

        var payments = paymentsTask.Result;
        var outstanding = outstandingTask.Result ?? 0m;

        var breakdown = payments.GroupBy(p => p.PaymentMethod)
            .Select(g => new PaymentMethodSummaryDto(g.Key.ToString(), g.Sum(p => p.Amount), g.Count()))
            .ToList();

        return Ok(new DailyReportDto(targetDate, payments.Sum(p => p.Amount), ordersCreatedTask.Result, ordersCompletedTask.Result, pendingOrdersTask.Result, outstanding, breakdown));
    }
}
