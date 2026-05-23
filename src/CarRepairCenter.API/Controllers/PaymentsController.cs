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
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PaymentsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<PaymentDto>>> GetAll([FromQuery] int? repairOrderId, [FromQuery] DateTime? date)
    {
        var query = _db.Payments.Include(p => p.RepairOrder).ThenInclude(r => r.Customer).AsQueryable();
        if (repairOrderId.HasValue) query = query.Where(p => p.RepairOrderId == repairOrderId.Value);
        if (date.HasValue) query = query.Where(p => p.PaidAt.Date == date.Value.Date);

        return Ok(await query.OrderByDescending(p => p.PaidAt)
            .Select(p => new PaymentDto(p.Id, p.RepairOrderId, p.RepairOrder.OrderCode, p.RepairOrder.Customer.Name, p.Amount, p.PaymentMethod.ToString(), p.Notes, p.PaidAt))
            .ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> Create(CreatePaymentDto dto)
    {
        var order = await _db.RepairOrders.Include(r => r.Customer).FirstOrDefaultAsync(r => r.Id == dto.RepairOrderId);
        if (order is null) return BadRequest(new { message = "أمر الصيانة غير موجود" });

        if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var method))
            return BadRequest(new { message = "طريقة دفع غير صالحة" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var payment = new Payment
        {
            RepairOrderId = dto.RepairOrderId,
            Amount = dto.Amount,
            PaymentMethod = method,
            Notes = dto.Notes,
            RecordedByUserId = userId
        };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        return Ok(new PaymentDto(payment.Id, payment.RepairOrderId, order.OrderCode, order.Customer.Name, payment.Amount, payment.PaymentMethod.ToString(), payment.Notes, payment.PaidAt));
    }
}
