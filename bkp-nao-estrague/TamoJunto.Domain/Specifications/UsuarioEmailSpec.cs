using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class UsuarioEmailSpec : Specification<Usuario>, ISingleResultSpecification<Usuario>
{
    public UsuarioEmailSpec(string email)
    {
        var e = (email ?? string.Empty).Trim().ToLowerInvariant();
        Query
            .Where(x => x.Email.ToLower() == e);
    }
}