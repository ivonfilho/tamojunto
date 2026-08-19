namespace TamoJunto.API.RequestModel;

public class CupomClienteRequest
{
    public Guid Id { get; set; }

    public DateTime DataResgate { get; set; }

    public Guid IdOfertaParceiro { get; set; }

    public Guid IdCliente { get; set; }
}