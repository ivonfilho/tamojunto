namespace TamoJunto.API.RequestModel;

public class HistoricoLoginRequest
{
    public Guid Id { get; set; }

    public DateTime Date { get; set; }

    public string Ip { get; set; } = null!;

    public string Local { get; set; } = null!;

    public Guid IdUsuario { get; set; }
}