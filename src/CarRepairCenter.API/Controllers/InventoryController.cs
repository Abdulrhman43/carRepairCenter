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
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;
    public InventoryController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<InventoryItemDto>>> GetAll([FromQuery] string? search)
    {
        var query = _db.InventoryItems.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(i => i.Name.Contains(search) || i.ItemCode.Contains(search));

        return Ok(await query.OrderBy(i => i.Name)
            .Select(i => new InventoryItemDto(i.Id, i.ItemCode, i.Name, i.Category, i.Quantity, i.UnitPrice, i.MinStockLevel, i.Unit, i.IsActive, i.Quantity <= i.MinStockLevel))
            .ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<InventoryItemDto>> Create(CreateInventoryItemDto dto)
    {
        var lastCode = await _db.InventoryItems.OrderByDescending(i => i.Id).Select(i => i.ItemCode).FirstOrDefaultAsync();
        var nextNum = 1;
        if (lastCode is not null && int.TryParse(lastCode.Replace("INV-", ""), out var n)) nextNum = n + 1;

        var item = new InventoryItem
        {
            ItemCode = $"INV-{nextNum:D4}",
            Name = dto.Name,
            Category = dto.Category,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            MinStockLevel = dto.MinStockLevel,
            Unit = dto.Unit
        };
        _db.InventoryItems.Add(item);
        await _db.SaveChangesAsync();
        return Ok(new InventoryItemDto(item.Id, item.ItemCode, item.Name, item.Category, item.Quantity, item.UnitPrice, item.MinStockLevel, item.Unit, item.IsActive, item.IsLowStock));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateInventoryItemDto dto)
    {
        var item = await _db.InventoryItems.FindAsync(id);
        if (item is null) return NotFound();
        item.Name = dto.Name;
        item.Category = dto.Category;
        item.Quantity = dto.Quantity;
        item.UnitPrice = dto.UnitPrice;
        item.MinStockLevel = dto.MinStockLevel;
        item.Unit = dto.Unit;
        item.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
