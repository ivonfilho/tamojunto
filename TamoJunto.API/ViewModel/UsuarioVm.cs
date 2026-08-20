namespace TamoJunto.API.ViewModel;

public class UsuarioVm
{
    public string Nome { get; set; }

    public string Email { get; set; }

    public string? ImagemUrl { get; set; }

    public string? Token { get; set; }
    public string Role { get; set; }

    public string? Contato { get; set; }
}