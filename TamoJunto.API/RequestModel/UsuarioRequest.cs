using System.Text.Json.Serialization;

namespace TamoJunto.API.RequestModel;

public enum UserRole
{
    Cliente,
    Parceiro,
    Admin
}

public class UsuarioRequest
{
    public string Nome { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Senha { get; set; } = null!;

    public string TipoCadastro { get; set; }

    public string? CNPJ { get; set; }

    public string? NomeEmpresa { get; set; }

    public string? Atividade { get; set; }

    public string? CPF { get; set; }

    public string? UrlImagem { get; set; } = null!;

    // Propriedades adicionais para compatibilidade com frontend
    public string? ConfirmacaoSenha { get; set; } = null!;

    // Campos específicos do parceiro
    public string? Website { get; set; } = null!;

    public string? Contato { get; set; } = null!;
}