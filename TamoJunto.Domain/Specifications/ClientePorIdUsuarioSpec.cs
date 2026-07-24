using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class ClientePorIdUsuarioSpec : Specification<Cliente>
{
    public ClientePorIdUsuarioSpec(Guid idUsuario)
    {
        Query.Where(x => x.IdUsuario == idUsuario);
    }
}
