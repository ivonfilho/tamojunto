namespace TamoJunto.API.RequestModel;

public class EnderecoRequest
{
    public Guid Id { get; set; }

    public string Nome { get; set; }

    public string Pais { get; set; }

    public string Rua { get; set; } 

    public int Numero { get; set; }

    public string Complemento { get; set; } 

    public string Estado { get; set; } = null!;

    public string Cidade { get; set; } = null!;

    public string Bairro { get; set; } = null!;

    public Guid IdUsuario { get; set; }
}