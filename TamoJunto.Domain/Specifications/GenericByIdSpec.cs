using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class GenericByIdSpec<T> : Specification<T>, ISingleResultSpecification<T> where T : BaseEntity
{
    public GenericByIdSpec(Guid id)
    {
        Query
            .Where(x => x.Id == id);
    }
}