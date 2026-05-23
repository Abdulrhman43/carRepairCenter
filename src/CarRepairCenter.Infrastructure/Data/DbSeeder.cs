using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CarRepairCenter.Core.Entities;

namespace CarRepairCenter.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        await db.Database.MigrateAsync();

        // ── Roles ──
        string[] roles = ["Admin", "Receptionist"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // ── Admin User ──
        if (await userManager.FindByEmailAsync("admin@makanak.com") is null)
        {
            var admin = new AppUser
            {
                UserName = "admin@makanak.com",
                Email = "admin@makanak.com",
                FullName = "مدير النظام",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(admin, "Admin@123");
            await userManager.AddToRoleAsync(admin, "Admin");
        }

        // ── Receptionist User ──
        if (await userManager.FindByEmailAsync("reception@makanak.com") is null)
        {
            var receptionist = new AppUser
            {
                UserName = "reception@makanak.com",
                Email = "reception@makanak.com",
                FullName = "موظف الاستقبال",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(receptionist, "Reception@123");
            await userManager.AddToRoleAsync(receptionist, "Receptionist");
        }

        // ── Services Catalog ──
        if (!await db.Services.AnyAsync())
        {
            db.Services.AddRange(
                new Service { Name = "تغيير زيت المحرك", Description = "تغيير زيت المحرك مع الفلتر", DefaultPrice = 350 },
                new Service { Name = "تغيير فلتر الهواء", Description = "استبدال فلتر الهواء", DefaultPrice = 150 },
                new Service { Name = "فحص الفرامل", Description = "فحص وضبط الفرامل", DefaultPrice = 200 },
                new Service { Name = "تغيير تيل الفرامل", Description = "استبدال تيل الفرامل الأمامي أو الخلفي", DefaultPrice = 400 },
                new Service { Name = "ضبط زوايا", Description = "ضبط زوايا الإطارات", DefaultPrice = 250 },
                new Service { Name = "تغيير بطارية", Description = "استبدال بطارية السيارة", DefaultPrice = 100 },
                new Service { Name = "فحص شامل", Description = "فحص شامل لجميع أنظمة السيارة", DefaultPrice = 500 },
                new Service { Name = "تغيير سير التايمنج", Description = "استبدال سير التوقيت", DefaultPrice = 1500 },
                new Service { Name = "تنظيف بخاخات", Description = "تنظيف بخاخات الوقود", DefaultPrice = 300 },
                new Service { Name = "شحن تكييف", Description = "شحن غاز التكييف وفحص التسريب", DefaultPrice = 350 }
            );
        }

        // ── Inventory Items ──
        if (!await db.InventoryItems.AnyAsync())
        {
            db.InventoryItems.AddRange(
                new InventoryItem { ItemCode = "INV-0001", Name = "زيت محرك 5W-30", Category = "زيوت", Quantity = 50, UnitPrice = 180, Unit = "لتر", MinStockLevel = 10 },
                new InventoryItem { ItemCode = "INV-0002", Name = "فلتر زيت", Category = "فلاتر", Quantity = 30, UnitPrice = 80, Unit = "قطعة", MinStockLevel = 5 },
                new InventoryItem { ItemCode = "INV-0003", Name = "فلتر هواء", Category = "فلاتر", Quantity = 25, UnitPrice = 120, Unit = "قطعة", MinStockLevel = 5 },
                new InventoryItem { ItemCode = "INV-0004", Name = "تيل فرامل أمامي", Category = "فرامل", Quantity = 20, UnitPrice = 250, Unit = "طقم", MinStockLevel = 5 },
                new InventoryItem { ItemCode = "INV-0005", Name = "تيل فرامل خلفي", Category = "فرامل", Quantity = 15, UnitPrice = 200, Unit = "طقم", MinStockLevel = 5 },
                new InventoryItem { ItemCode = "INV-0006", Name = "شمعات إشعال", Category = "كهرباء", Quantity = 40, UnitPrice = 60, Unit = "قطعة", MinStockLevel = 8 },
                new InventoryItem { ItemCode = "INV-0007", Name = "سائل فرامل", Category = "سوائل", Quantity = 20, UnitPrice = 90, Unit = "لتر", MinStockLevel = 5 },
                new InventoryItem { ItemCode = "INV-0008", Name = "سائل تبريد", Category = "سوائل", Quantity = 30, UnitPrice = 70, Unit = "لتر", MinStockLevel = 10 },
                new InventoryItem { ItemCode = "INV-0009", Name = "فلتر بنزين", Category = "فلاتر", Quantity = 20, UnitPrice = 100, Unit = "قطعة", MinStockLevel = 5 },
                new InventoryItem { ItemCode = "INV-0010", Name = "سير مروحة", Category = "أحزمة", Quantity = 10, UnitPrice = 150, Unit = "قطعة", MinStockLevel = 3 }
            );
        }

        await db.SaveChangesAsync();
    }
}
