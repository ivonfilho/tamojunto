using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class CupomClientePorClienteSpec : Specification<CupomCliente>
{
    public CupomClientePorClienteSpec(Guid idCliente)
    {
        Query
            .Where(c => c.IdCliente == idCliente)
            .Include(c => c.OfertaParceiro)
            .ThenInclude(o => o.IdParceiroNavigation)
            .ThenInclude(p => p.IdEmpresaNavigation)
            .OrderByDescending(c => c.DataResgate);
    }
}
