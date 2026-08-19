namespace TamoJunto.API.RequestModel;

public class ImagemRequest
{
    public Guid Id { get; set; }

    public string Path { get; set; } = null!;

    public Guid? IdOfertaParceiro { get; set; }
}