using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRepairCenter.API.DTOs;
using CarRepairCenter.Core.Entities;
using CarRepairCenter.Infrastructure.Data;

namespace CarRepairCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly AppDbContext _db;
    public VehiclesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<VehicleDto>>> GetAll([FromQuery] int? customerId, [FromQuery] string? search)
    {
        var query = _db.Vehicles.AsNoTracking().Include(v => v.Customer).AsQueryable();
        if (customerId.HasValue)
            query = query.Where(v => v.CustomerId == customerId.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(v => v.PlateNumber.Contains(search) || v.Make.Contains(search) || v.Model.Contains(search));

        var vehicles = await query.OrderByDescending(v => v.CreatedAt)
            .Select(v => new VehicleDto(v.Id, v.CustomerId, v.Customer.Name, v.PlateNumber, v.Make, v.Model, v.Year, v.Color, v.VIN, v.Notes, v.CreatedAt))
            .ToListAsync();
        return Ok(vehicles);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VehicleDto>> GetById(int id)
    {
        var v = await _db.Vehicles.AsNoTracking().Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) return NotFound();
        return Ok(new VehicleDto(v.Id, v.CustomerId, v.Customer.Name, v.PlateNumber, v.Make, v.Model, v.Year, v.Color, v.VIN, v.Notes, v.CreatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<VehicleDto>> Create(CreateVehicleDto dto)
    {
        var customer = await _db.Customers.FindAsync(dto.CustomerId);
        if (customer is null) return BadRequest(new { message = "العميل غير موجود" });

        var vehicle = new Vehicle
        {
            CustomerId = dto.CustomerId,
            PlateNumber = dto.PlateNumber,
            Make = dto.Make,
            Model = dto.Model,
            Year = dto.Year,
            Color = dto.Color,
            VIN = dto.VIN,
            Notes = dto.Notes
        };
        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = vehicle.Id },
            new VehicleDto(vehicle.Id, vehicle.CustomerId, customer.Name, vehicle.PlateNumber, vehicle.Make, vehicle.Model, vehicle.Year, vehicle.Color, vehicle.VIN, vehicle.Notes, vehicle.CreatedAt));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateVehicleDto dto)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);
        if (vehicle is null) return NotFound();

        vehicle.PlateNumber = dto.PlateNumber;
        vehicle.Make = dto.Make;
        vehicle.Model = dto.Model;
        vehicle.Year = dto.Year;
        vehicle.Color = dto.Color;
        vehicle.VIN = dto.VIN;
        vehicle.Notes = dto.Notes;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult> GetHistory(int id)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);
        if (vehicle is null) return NotFound();

        var orders = await _db.RepairOrders
            .AsNoTracking()
            .Where(r => r.VehicleId == id)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.OrderCode,
                TotalAmount = (
                    (r.RepairOrderServices.Sum(s => (decimal?)s.Price) ?? 0m)
                    + (r.RepairOrderParts.Sum(p => (decimal?)(p.Quantity * p.UnitPrice)) ?? 0m)
                ) * (1 - r.DiscountPercentage / 100m),
                Status = r.Status.ToString(),
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }
}
