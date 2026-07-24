using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Assinatura : BaseEntity
{
    public Guid Id { get; set; }

    public Guid? IdCliente { get; set; }

    public DateTime DataCompra { get; set; }

    public DateTime DataRenovacao { get; set; }

    public Guid? IdPagamento { get; set; }

    public Guid IdPlano { get; set; }

    public Guid? IdParceiro { get; set; }

    public virtual Cliente? IdClienteNavigation { get; set; }

    public virtual Pagamento? IdPagamentoNavigation { get; set; }

    public virtual Plano IdPlanoNavigation { get; set; } = null!;
}
