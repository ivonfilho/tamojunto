namespace TamoJunto.API.RequestModel;

public class HistoricoCupomRequest
{
    public Guid IdCupom { get; set; }
    public Guid IdUsuario { get; set; }
    public DateTime DataUso { get; set; }
    public string Status { get; set; } = null!;
}
