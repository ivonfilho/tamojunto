using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class UsuarioPorIdSpec : Specification<Usuario>
{
    public UsuarioPorIdSpec(Guid usuarioId)
    {
        Query.Where(usuario => usuario.Id == usuarioId);
    }
}
