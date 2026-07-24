using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Empresa : BaseEntity
{
    public Guid Id { get; set; }

    public string Cnpj { get; set; } = null!;

    public string Nome { get; set; } = null!;

    public string Atividade { get; set; } = null!;

    public virtual Cliente? Cliente { get; set; }

    public virtual Parceiro? Parceiro { get; set; }
}
