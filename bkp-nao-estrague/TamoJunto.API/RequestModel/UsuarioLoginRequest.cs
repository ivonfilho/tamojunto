namespace TamoJunto.API.RequestModel;

public class UsuarioLoginRequest
{
    public string Email { get; set; } = null!;
    public string Senha { get; set; } = null!;
}