namespace TamoJunto.API.RequestModel;

public class EmpresaRequest
{
    public Guid Id { get; set; }

    public string Cnpj { get; set; } = null!;

    public string Nome { get; set; } = null!;

    public string Atividade { get; set; } = null!;
}