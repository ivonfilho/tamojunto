using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class CupomComOfertaSpec : Specification<CupomCliente>
{
    public CupomComOfertaSpec()
    {
        Query.Include(c => c.OfertaParceiro)
            .ThenInclude(op => op.IdParceiroNavigation)
            .ThenInclude(p => p.IdEmpresaNavigation);
    }
}
