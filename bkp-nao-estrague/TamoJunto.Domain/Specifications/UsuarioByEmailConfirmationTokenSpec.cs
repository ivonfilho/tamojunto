using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

/// <summary>
/// Busca usuário pelo token de confirmação de e-mail (comparação case-insensitive e à prova de espaços na URL).
/// </summary>
public class UsuarioByEmailConfirmationTokenSpec : Specification<Usuario>, ISingleResultSpecification<Usuario>
{
    public UsuarioByEmailConfirmationTokenSpec(string token)
    {
        var normalized = (token ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalized))
        {
            Query.Where(_ => false);
            return;
        }

        Query.Where(u =>
            u.EmailConfirmationToken != null &&
            u.EmailConfirmationToken.ToLower() == normalized);
    }
}
