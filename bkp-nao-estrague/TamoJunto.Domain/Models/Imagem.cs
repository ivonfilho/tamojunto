using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace TamoJunto.Domain.Models;

public partial class Imagem : BaseEntity
{
    public Guid Id { get; set; }

    public string Path { get; set; } = null!;

    public Guid? IdOfertaParceiro { get; set; }

    public Guid? UsuarioId { get; set; }

    public virtual OfertaParceiro IdOfertaParceiroNavigation { get; set; } = null!;

    [ForeignKey("UsuarioId")]
    public virtual Usuario? UsuarioNavigation { get; set; }
}
