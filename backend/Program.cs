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

app.MapGet("/api/books/{id:int}", async (BookstoreContext db, int id) =>
{
    var book = await db.Books
        .AsNoTracking()
        .FirstOrDefaultAsync(b => b.BookID == id);

    return book is null
        ? Results.NotFound(new { message = $"Book {id} was not found." })
        : Results.Ok(book);
});

app.MapPost("/api/books", async (BookstoreContext db, BookUpsertRequest request) =>
{
    var validationError = ValidateBook(request);
    if (validationError is not null)
    {
        return Results.BadRequest(new { message = validationError });
    }

    var book = new Book
    {
        Title = request.Title.Trim(),
        Author = request.Author.Trim(),
        Publisher = request.Publisher.Trim(),
        ISBN = request.ISBN.Trim(),
        Classification = request.Classification.Trim(),
        Category = request.Category.Trim(),
        PageCount = request.PageCount,
        Price = request.Price
    };

    db.Books.Add(book);
    await db.SaveChangesAsync();

    return Results.Created($"/api/books/{book.BookID}", book);
});

app.MapPut("/api/books/{id:int}", async (BookstoreContext db, int id, BookUpsertRequest request) =>
{
    var validationError = ValidateBook(request);
    if (validationError is not null)
    {
        return Results.BadRequest(new { message = validationError });
    }

    var book = await db.Books.FirstOrDefaultAsync(b => b.BookID == id);
    if (book is null)
    {
        return Results.NotFound(new { message = $"Book {id} was not found." });
    }

    book.Title = request.Title.Trim();
    book.Author = request.Author.Trim();
    book.Publisher = request.Publisher.Trim();
    book.ISBN = request.ISBN.Trim();
    book.Classification = request.Classification.Trim();
    book.Category = request.Category.Trim();
    book.PageCount = request.PageCount;
    book.Price = request.Price;

    await db.SaveChangesAsync();
    return Results.Ok(book);
});

app.MapDelete("/api/books/{id:int}", async (BookstoreContext db, int id) =>
{
    var book = await db.Books.FirstOrDefaultAsync(b => b.BookID == id);
    if (book is null)
    {
        return Results.NotFound(new { message = $"Book {id} was not found." });
    }

    db.Books.Remove(book);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();

static string? ValidateBook(BookUpsertRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return "Title is required.";
    }

    if (string.IsNullOrWhiteSpace(request.Author))
    {
        return "Author is required.";
    }

    if (string.IsNullOrWhiteSpace(request.Publisher))
    {
        return "Publisher is required.";
    }

    if (string.IsNullOrWhiteSpace(request.ISBN))
    {
        return "ISBN is required.";
    }

    if (string.IsNullOrWhiteSpace(request.Classification))
    {
        return "Classification is required.";
    }

    if (string.IsNullOrWhiteSpace(request.Category))
    {
        return "Category is required.";
    }

    if (request.PageCount < 1)
    {
        return "Page count must be at least 1.";
    }

    if (request.Price < 0)
    {
        return "Price cannot be negative.";
    }

    return null;
}

public class BookUpsertRequest
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public string ISBN { get; set; } = string.Empty;
    public string Classification { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int PageCount { get; set; }
    public decimal Price { get; set; }
}
