namespace TamoJunto.API.RequestModel;

public class BackofficeRequest
{
    public Guid Id { get; set; }

    public Guid IdUsuario { get; set; }

    public string Cpf { get; set; } = null!;
}