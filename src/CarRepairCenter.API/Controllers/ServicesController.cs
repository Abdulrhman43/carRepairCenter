using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRepairCenter.API.DTOs;
using CarRepairCenter.Core.Entities;
using CarRepairCenter.Infrastructure.Data;

namespace CarRepairCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ServicesController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<ServiceDto>>> GetAll([FromQuery] bool? activeOnly)
    {
        var query = _db.Services.AsQueryable();
        if (activeOnly == true) query = query.Where(s => s.IsActive);

        return Ok(await query.OrderBy(s => s.Name)
            .Select(s => new ServiceDto(s.Id, s.Name, s.Description, s.DefaultPrice, s.IsActive))
            .ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<ServiceDto>> Create(CreateServiceDto dto)
    {
        var service = new Service { Name = dto.Name, Description = dto.Description, DefaultPrice = dto.DefaultPrice };
        _db.Services.Add(service);
        await _db.SaveChangesAsync();
        return Ok(new ServiceDto(service.Id, service.Name, service.Description, service.DefaultPrice, service.IsActive));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateServiceDto dto)
    {
        var service = await _db.Services.FindAsync(id);
        if (service is null) return NotFound();
        service.Name = dto.Name;
        service.Description = dto.Description;
        service.DefaultPrice = dto.DefaultPrice;
        service.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
