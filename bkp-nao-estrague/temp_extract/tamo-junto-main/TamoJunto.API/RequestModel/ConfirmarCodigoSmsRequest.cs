using System.ComponentModel.DataAnnotations;

namespace TamoJunto.API.RequestModel;

public class ConfirmarCodigoSmsRequest
{
    [Required(ErrorMessage = "Telefone é obrigatório")]
    public string Telefone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Código é obrigatório")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "O código deve ter 6 dígitos")]
    public string Codigo { get; set; } = string.Empty;
}
