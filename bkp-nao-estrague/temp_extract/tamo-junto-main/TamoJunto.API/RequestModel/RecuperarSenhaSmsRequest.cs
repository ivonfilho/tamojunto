using System.ComponentModel.DataAnnotations;

namespace TamoJunto.API.RequestModel;

public class RecuperarSenhaSmsRequest
{
    [Required(ErrorMessage = "Telefone é obrigatório")]
    public string Telefone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nova senha é obrigatória")]
    [MinLength(6, ErrorMessage = "A senha deve ter pelo menos 6 caracteres")]
    public string NovaSenha { get; set; } = string.Empty;

    [Required(ErrorMessage = "Confirmação de senha é obrigatória")]
    [Compare("NovaSenha", ErrorMessage = "As senhas não coincidem")]
    public string ConfirmacaoSenha { get; set; } = string.Empty;
}
