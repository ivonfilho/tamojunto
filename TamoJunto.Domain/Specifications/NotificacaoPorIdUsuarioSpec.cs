using Ardalis.Specification;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Specifications;

public class NotificacaoPorIdUsuarioSpec : Specification<Notificacao>
{
    public NotificacaoPorIdUsuarioSpec(Guid idUsuario)
    {
        Query
            .Where(n => n.IdUsuario == idUsuario)
            .OrderByDescending(n => n.DataCriacao);
    }
}
