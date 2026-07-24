using Ardalis.Specification;
using Microsoft.EntityFrameworkCore;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class UsuarioLoginSpec : Specification<Usuario>, ISingleResultSpecification<Usuario>
{
    public UsuarioLoginSpec(string email, string senha)
    {
        var emailNorm = (email ?? string.Empty).Trim().ToLowerInvariant();
        Query
            .Where(x => x.Email.ToLower() == emailNorm && x.Senha == senha);
    }
}