using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Backoffice : BaseEntity
{
    public Guid Id { get; set; }

    public Guid IdUsuario { get; set; }

    public string Cpf { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
