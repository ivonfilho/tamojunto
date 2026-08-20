using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Cliente : BaseEntity
{
    public Guid Id { get; set; }
    public string? Cpf { get; set; }
    public Guid IdUsuario { get; set; }

    public Guid? IdEmpresa { get; set; }

    public virtual ICollection<Assinatura> Assinatura { get; set; } = new List<Assinatura>();

    public virtual ICollection<CupomCliente> CupomCliente { get; set; } = new List<CupomCliente>();

    public virtual Empresa? IdEmpresaNavigation { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
