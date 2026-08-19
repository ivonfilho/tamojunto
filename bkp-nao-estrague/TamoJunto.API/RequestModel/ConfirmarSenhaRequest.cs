namespace TamoJunto.API.RequestModel;

public class ConfirmarSenhaRequest
{
    public string Token { get; set; } = string.Empty;
    public string NovaSenha { get; set; } = string.Empty;
}


