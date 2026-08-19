using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class CupomClientePorClienteEOfertaSpec : Specification<CupomCliente>, ISingleResultSpecification<CupomCliente>
{
    public CupomClientePorClienteEOfertaSpec(Guid idCliente, Guid idOfertaParceiro)
    {
        Query.Where(x => x.IdCliente == idCliente && x.IdOfertaParceiro == idOfertaParceiro);
    }
} 