using System.ComponentModel.DataAnnotations;

namespace TamoJunto.API.RequestModel;

public class RecuperarSenhaEmailRequest
{
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;
}

