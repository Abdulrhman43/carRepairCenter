using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRepairCenter.API.DTOs;
using CarRepairCenter.Core.Entities;
using CarRepairCenter.Core.Enums;
using CarRepairCenter.Infrastructure.Data;

namespace CarRepairCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RepairOrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public RepairOrdersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<RepairOrderDto>>> GetAll([FromQuery] string? status, [FromQuery] string? search)
    {
        var query = _db.RepairOrders
            .AsNoTracking()
            .Include(r => r.Customer)
            .Include(r => r.Vehicle)
            .Include(r => r.RepairOrderServices).ThenInclude(s => s.Service)
            .Include(r => r.RepairOrderParts).ThenInclude(p => p.InventoryItem)
            .Include(r => r.Payments)
            .AsSplitQuery()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RepairStatus>(status, true, out var s))
            query = query.Where(r => r.Status == s);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(r => r.OrderCode.Contains(search) || r.Customer.Name.Contains(search) || r.Vehicle.PlateNumber.Contains(search));

        var orders = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(orders.Select(MapToDto).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RepairOrderDto>> GetById(int id)
    {
        var r = await LoadOrder(id);
        if (r is null) return NotFound();
        return Ok(MapToDto(r));
    }

    [HttpGet("vehicle/{vehicleId}")]
    public async Task<ActionResult<List<RepairOrderDto>>> GetByVehicle(int vehicleId)
    {
        var orders = await _db.RepairOrders
            .AsNoTracking()
            .Include(r => r.Customer).Include(r => r.Vehicle)
            .Include(r => r.RepairOrderServices).ThenInclude(s => s.Service)
            .Include(r => r.RepairOrderParts).ThenInclude(p => p.InventoryItem)
            .Include(r => r.Payments)
            .AsSplitQuery()
            .Where(r => r.VehicleId == vehicleId)
            .OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(orders.Select(MapToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<RepairOrderDto>> Create(CreateRepairOrderDto dto)
    {
        var lastCode = await _db.RepairOrders.OrderByDescending(r => r.Id).Select(r => r.OrderCode).FirstOrDefaultAsync();
        var nextNum = 1;
        if (lastCode is not null && int.TryParse(lastCode.Replace("REP-", ""), out var n)) nextNum = n + 1;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var order = new RepairOrder
        {
            OrderCode = $"REP-{nextNum:D4}",
            CustomerId = dto.CustomerId,
            VehicleId = dto.VehicleId,
            ProblemDescription = dto.ProblemDescription,
            Notes = dto.Notes,
            DiscountPercentage = dto.DiscountPercentage,
            CreatedByUserId = userId
        };
        _db.RepairOrders.Add(order);
        await _db.SaveChangesAsync();

        var loaded = await LoadOrder(order.Id);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, MapToDto(loaded!));
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateRepairOrderStatusDto dto)
    {
        var order = await _db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();
        if (!Enum.TryParse<RepairStatus>(dto.Status, true, out var newStatus))
            return BadRequest(new { message = "حالة غير صالحة" });

        order.Status = newStatus;
        switch (newStatus)
        {
            case RepairStatus.InProgress: order.StartedAt = DateTime.UtcNow; break;
            case RepairStatus.Done: order.CompletedAt = DateTime.UtcNow; break;
            case RepairStatus.Delivered: order.DeliveredAt = DateTime.UtcNow; break;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/discount")]
    public async Task<IActionResult> UpdateDiscount(int id, [FromBody] decimal discountPercentage)
    {
        var order = await _db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();
        order.DiscountPercentage = discountPercentage;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Services on Order ──
    [HttpPost("{id}/services")]
    public async Task<IActionResult> AddService(int id, AddRepairOrderServiceDto dto)
    {
        var order = await _db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();

        _db.RepairOrderServices.Add(new RepairOrderService
        {
            RepairOrderId = id,
            ServiceId = dto.ServiceId,
            Price = dto.Price,
            Notes = dto.Notes
        });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{orderId}/services/{serviceLineId}")]
    public async Task<IActionResult> RemoveService(int orderId, int serviceLineId)
    {
        var line = await _db.RepairOrderServices.FirstOrDefaultAsync(s => s.Id == serviceLineId && s.RepairOrderId == orderId);
        if (line is null) return NotFound();
        _db.RepairOrderServices.Remove(line);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Parts on Order ──
    [HttpPost("{id}/parts")]
    public async Task<IActionResult> AddPart(int id, AddRepairOrderPartDto dto)
    {
        var order = await _db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();

        var item = await _db.InventoryItems.FindAsync(dto.InventoryItemId);
        if (item is null) return BadRequest(new { message = "قطعة الغيار غير موجودة" });

        // Warn if stock is low but don't block
        var warning = item.Quantity < dto.Quantity
            ? $"تحذير: الكمية المتاحة ({item.Quantity}) أقل من المطلوبة ({dto.Quantity})"
            : null;

        item.Quantity -= dto.Quantity;

        _db.RepairOrderParts.Add(new RepairOrderPart
        {
            RepairOrderId = id,
            InventoryItemId = dto.InventoryItemId,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice ?? item.UnitPrice
        });
        await _db.SaveChangesAsync();
        return Ok(new { warning });
    }

    [HttpDelete("{orderId}/parts/{partLineId}")]
    public async Task<IActionResult> RemovePart(int orderId, int partLineId)
    {
        var line = await _db.RepairOrderParts.FirstOrDefaultAsync(p => p.Id == partLineId && p.RepairOrderId == orderId);
        if (line is null) return NotFound();

        // Restore inventory
        var item = await _db.InventoryItems.FindAsync(line.InventoryItemId);
        if (item is not null) item.Quantity += line.Quantity;

        _db.RepairOrderParts.Remove(line);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ──
    private async Task<RepairOrder?> LoadOrder(int id, bool tracking = false)
    {
        var query = _db.RepairOrders
            .Include(r => r.Customer).Include(r => r.Vehicle)
            .Include(r => r.RepairOrderServices).ThenInclude(s => s.Service)
            .Include(r => r.RepairOrderParts).ThenInclude(p => p.InventoryItem)
            .Include(r => r.Payments)
            .AsSplitQuery()
            .AsQueryable();

        if (!tracking) query = query.AsNoTracking();

        return await query.FirstOrDefaultAsync(r => r.Id == id);
    }

    private static RepairOrderDto MapToDto(RepairOrder r) => new(
        r.Id, r.OrderCode,
        r.CustomerId, r.Customer.Name, r.Customer.Phone,
        r.VehicleId, r.Vehicle.PlateNumber, $"{r.Vehicle.Make} {r.Vehicle.Model}",
        r.ProblemDescription, r.Status.ToString(),
        r.DiscountPercentage,
        r.TotalServicesAmount, r.TotalPartsAmount, r.SubTotal,
        r.DiscountAmount, r.TotalAmount, r.PaidAmount, r.RemainingAmount, r.IsFullyPaid,
        r.Notes, r.CreatedAt, r.StartedAt, r.CompletedAt, r.DeliveredAt,
        r.RepairOrderServices.Select(s => new RepairOrderServiceDto(s.Id, s.ServiceId, s.Service.Name, s.Price, s.Notes)).ToList(),
        r.RepairOrderParts.Select(p => new RepairOrderPartDto(p.Id, p.InventoryItemId, p.InventoryItem.Name, p.Quantity, p.UnitPrice, p.TotalPrice)).ToList(),
        r.Payments.Select(p => new PaymentDto(p.Id, p.RepairOrderId, r.OrderCode, r.Customer.Name, p.Amount, p.PaymentMethod.ToString(), p.Notes, p.PaidAt)).ToList()
    );
}
