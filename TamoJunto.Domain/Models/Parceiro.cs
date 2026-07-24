using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Parceiro : BaseEntity
{
    public Guid Id { get; set; }

    public Guid IdUsuario { get; set; }

    public Guid IdEmpresa { get; set; }

    public string Nome { get; set; }

    public string Website { get; set; }

    public DateTime DataCriacao { get; set; }

    public string Contato { get; set; }

    public bool Status { get; set; } = true;

    public virtual Empresa IdEmpresaNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual ICollection<OfertaParceiro> OfertaParceiro { get; set; } = new List<OfertaParceiro>();
}
