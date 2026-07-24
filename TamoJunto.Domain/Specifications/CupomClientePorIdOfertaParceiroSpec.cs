using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

/// <summary>
/// Um cupom por oferta no modelo atual (índice único em IdOfertaParceiro).
/// </summary>
public class CupomClientePorIdOfertaParceiroSpec : Specification<CupomCliente>, ISingleResultSpecification<CupomCliente>
{
    public CupomClientePorIdOfertaParceiroSpec(Guid idOfertaParceiro)
    {
        Query.Where(c => c.IdOfertaParceiro == idOfertaParceiro);
    }
}
