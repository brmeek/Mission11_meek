using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Mission11_Meek;

public class Book
{
    [Key]
    public int BookID { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Author { get; set; } = string.Empty;

    [Required]
    public string Publisher { get; set; } = string.Empty;

    [Required]
    public string ISBN { get; set; } = string.Empty;

    [Required]
    public string Classification { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Required]
    public int PageCount { get; set; }

    [Required]
    [Column(TypeName = "REAL")]
    public decimal Price { get; set; }
}
