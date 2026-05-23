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
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> GetAll([FromQuery] string? search)
    {
        var query = _db.Customers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || c.Phone.Contains(search) || c.CustomerCode.Contains(search));

        var customers = await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CustomerDto(c.Id, c.CustomerCode, c.Name, c.Phone, c.Phone2, c.Address, c.Notes, c.CreatedAt, c.Vehicles.Count))
            .ToListAsync();
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        var c = await _db.Customers.Include(x => x.Vehicles)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();
        return Ok(new CustomerDto(c.Id, c.CustomerCode, c.Name, c.Phone, c.Phone2, c.Address, c.Notes, c.CreatedAt, c.Vehicles.Count));
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create(CreateCustomerDto dto)
    {
        // Auto-generate code
        var lastCode = await _db.Customers.OrderByDescending(c => c.Id).Select(c => c.CustomerCode).FirstOrDefaultAsync();
        var nextNum = 1;
        if (lastCode is not null && int.TryParse(lastCode.Replace("CUS-", ""), out var n)) nextNum = n + 1;

        var customer = new Customer
        {
            CustomerCode = $"CUS-{nextNum:D4}",
            Name = dto.Name,
            Phone = dto.Phone,
            Phone2 = dto.Phone2,
            Address = dto.Address,
            Notes = dto.Notes
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = customer.Id },
            new CustomerDto(customer.Id, customer.CustomerCode, customer.Name, customer.Phone, customer.Phone2, customer.Address, customer.Notes, customer.CreatedAt, 0));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateCustomerDto dto)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer is null) return NotFound();

        customer.Name = dto.Name;
        customer.Phone = dto.Phone;
        customer.Phone2 = dto.Phone2;
        customer.Address = dto.Address;
        customer.Notes = dto.Notes;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer is null) return NotFound();
        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
