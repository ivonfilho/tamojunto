using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class GenericAllSpec<T> : Specification<T> where T : BaseEntity
{
    public GenericAllSpec()
    {
        Query
            .Where(x => true);
    }

    public GenericAllSpec(string[] includeLista)
    {
        foreach (var include in includeLista)
        {
            Query.Include(include);
        }
        Query.Where(x => true);

    }
}