using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class GenericByUsuarioSpec<T> : Specification<T> where T : Parceiro
{
    public GenericByUsuarioSpec(Guid idUsuario)
    {
        Query.Where(p => p.IdUsuario == idUsuario); 
    }
}
