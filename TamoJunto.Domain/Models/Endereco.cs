using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Endereco : BaseEntity
{
    public Guid Id { get; set; }

    public string Nome { get; set; }

    public string Pais { get; set; }

    public string Rua { get; set; }

    public int Numero { get; set; }

    public string Complemento { get; set; } 

    public string Estado { get; set; } = null!;

    public string Cidade { get; set; } = null!;

    public string Bairro { get; set; } = null!;

    public Guid IdUsuario { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual ICollection<OfertaParceiro> OfertaParceiro { get; set; } = new List<OfertaParceiro>();
}
