using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Pagamento : BaseEntity
{
    public Guid Id { get; set; }

    public DateTime Data { get; set; }

    public string Descricao { get; set; } = null!;

    public decimal Valor { get; set; }

    public string Status { get; set; } = null!;

    public virtual Assinatura? Assinatura { get; set; }

    public string UrlPagamento { get; set; }

}
