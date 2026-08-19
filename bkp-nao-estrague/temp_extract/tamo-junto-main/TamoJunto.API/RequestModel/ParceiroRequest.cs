namespace TamoJunto.API.RequestModel;

public class ParceiroRequest
{
    public Guid Id { get; set; }

    public Guid IdUsuario { get; set; }

    public Guid IdEmpresa { get; set; }

    public string Nome { get; set; }

    public string Website { get; set; }

    public DateTime? DataCriacao { get; set; }

    public string Contato { get; set; }

    public bool Status { get; set; } = true;

}