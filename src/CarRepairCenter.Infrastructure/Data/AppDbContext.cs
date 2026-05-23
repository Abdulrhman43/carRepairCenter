using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CarRepairCenter.Core.Entities;

namespace CarRepairCenter.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<RepairOrder> RepairOrders => Set<RepairOrder>();
    public DbSet<RepairOrderService> RepairOrderServices => Set<RepairOrderService>();
    public DbSet<RepairOrderPart> RepairOrderParts => Set<RepairOrderPart>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── Customer ──
        builder.Entity<Customer>(e =>
        {
            e.HasIndex(c => c.CustomerCode).IsUnique();
            e.HasIndex(c => c.Phone).IsUnique();
        });

        // ── Vehicle ──
        builder.Entity<Vehicle>(e =>
        {
            e.HasIndex(v => v.PlateNumber).IsUnique();
            e.HasOne(v => v.Customer)
                .WithMany(c => c.Vehicles)
                .HasForeignKey(v => v.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Service ──
        builder.Entity<Service>(e =>
        {
            e.Property(s => s.DefaultPrice).HasPrecision(18, 2);
        });

        // ── InventoryItem ──
        builder.Entity<InventoryItem>(e =>
        {
            e.HasIndex(i => i.ItemCode).IsUnique();
            e.Property(i => i.UnitPrice).HasPrecision(18, 2);
            e.Ignore(i => i.IsLowStock);
        });

        // ── RepairOrder ──
        builder.Entity<RepairOrder>(e =>
        {
            e.HasIndex(r => r.OrderCode).IsUnique();
            e.HasIndex(r => r.Status);
            e.HasIndex(r => r.CreatedAt);
            e.HasIndex(r => r.CustomerId);
            e.HasIndex(r => r.VehicleId);
            e.Property(r => r.DiscountPercentage).HasPrecision(5, 2);

            e.Ignore(r => r.TotalServicesAmount);
            e.Ignore(r => r.TotalPartsAmount);
            e.Ignore(r => r.SubTotal);
            e.Ignore(r => r.DiscountAmount);
            e.Ignore(r => r.TotalAmount);
            e.Ignore(r => r.PaidAmount);
            e.Ignore(r => r.RemainingAmount);
            e.Ignore(r => r.IsFullyPaid);

            e.HasOne(r => r.Customer)
                .WithMany(c => c.RepairOrders)
                .HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.Vehicle)
                .WithMany(v => v.RepairOrders)
                .HasForeignKey(r => r.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── RepairOrderService ──
        builder.Entity<RepairOrderService>(e =>
        {
            e.HasIndex(s => s.RepairOrderId);
            e.Property(s => s.Price).HasPrecision(18, 2);
        });

        // ── RepairOrderPart ──
        builder.Entity<RepairOrderPart>(e =>
        {
            e.HasIndex(p => p.RepairOrderId);
            e.Property(p => p.UnitPrice).HasPrecision(18, 2);
            e.Ignore(p => p.TotalPrice);
        });

        // ── Payment ──
        builder.Entity<Payment>(e =>
        {
            e.HasIndex(p => p.RepairOrderId);
            e.HasIndex(p => p.PaidAt);
            e.Property(p => p.Amount).HasPrecision(18, 2);
        });
    }
}
