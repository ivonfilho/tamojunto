namespace TamoJunto.API.RequestModel;

public class ClienteRequest
{
    public Guid Id { get; set; }

    public string Cpf { get; set; } = null!;

    public Guid IdUsuario { get; set; }

    public Guid IdEmpresa { get; set; }
}