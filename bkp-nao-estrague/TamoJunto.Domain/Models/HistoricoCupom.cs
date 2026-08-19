using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class HistoricoCupom : BaseEntity
{
    public Guid Id { get; set; }

    public Guid IdCupom { get; set; }

    public Guid IdUsuario { get; set; }

    public DateTime DataUso { get; set; }

    public string Status { get; set; } = null!; 
    
    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
    
    public virtual CupomCliente IdCupomClienteNavigation { get; set; } = null!;
}