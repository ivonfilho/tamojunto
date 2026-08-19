using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class HistoricoLogin : BaseEntity
{
    public Guid Id { get; set; }

    public DateTime Date { get; set; }

    public string Ip { get; set; } = null!;

    public string Local { get; set; } = null!;

    public Guid IdUsuario { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
