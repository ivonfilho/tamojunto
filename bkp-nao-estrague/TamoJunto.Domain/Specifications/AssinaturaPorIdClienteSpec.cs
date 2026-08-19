using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class AssinaturaPorIdClienteSpec : Specification<Assinatura>
{
    public AssinaturaPorIdClienteSpec(Guid idCliente)
    {
        Query
            .Where(a => a.IdCliente == idCliente)
            .OrderByDescending(a => a.DataCompra);
    }
}
