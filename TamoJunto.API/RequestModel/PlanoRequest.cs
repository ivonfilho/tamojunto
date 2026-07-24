namespace TamoJunto.API.RequestModel;

public class PlanoRequest
{
    public string Titulo { get; set; } = null!;
    public decimal Valor { get; set; }
    public string Descricao { get; set; } = null!;
    public string Tipo { get; set; } = null!; // MENSAL, ANUAL, GRATIS
} 