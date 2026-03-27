using Microsoft.EntityFrameworkCore;
using Mission11_Meek;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<BookstoreContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("BookstoreConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.MapGet("/api/categories", async (BookstoreContext db) =>
{
    var categories = await db.Books
        .AsNoTracking()
        .Select(b => b.Category)
        .Distinct()
        .OrderBy(c => c)
        .ToListAsync();

    return Results.Ok(categories);
});

app.MapGet("/api/books", async (
    BookstoreContext db,
    int page = 1,
    int pageSize = 5,
    string sort = "asc",
    string? category = null) =>
{
    if (page < 1)
    {
        page = 1;
    }

    if (pageSize < 1)
    {
        pageSize = 5;
    }

    if (pageSize > 100)
    {
        pageSize = 100;
    }

    var query = db.Books.AsNoTracking().AsQueryable();

    if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
    {
        query = query.Where(b => b.Category == category);
    }

    query = sort.Equals("desc", StringComparison.OrdinalIgnoreCase)
        ? query.OrderByDescending(b => b.Title)
        : query.OrderBy(b => b.Title);

    var totalBooks = await query.CountAsync();

    var books = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new
    {
        books,
        totalBooks,
        page,
        pageSize,
        totalPages = (int)Math.Ceiling(totalBooks / (double)pageSize)
    });
});

app.Run();
