using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class GenericByOfertaIdSpec : Specification<Imagem>
{
    public GenericByOfertaIdSpec(Guid ofertaId)
    {
        Query.Where(x => x.IdOfertaParceiro == ofertaId);
    }
} 