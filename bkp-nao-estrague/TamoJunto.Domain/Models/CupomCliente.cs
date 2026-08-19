using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class CupomCliente : BaseEntity
{
    public Guid Id { get; set; }

    public DateTime DataResgate { get; set; }
    public DateTime? DataUtilizacao { get; set; }

    public Guid IdOfertaParceiro { get; set; }

    public Guid IdCliente { get; set; }

    public virtual Cliente IdClienteNavigation { get; set; } = null!;

    public virtual OfertaParceiro? OfertaParceiro { get; set; }
}
