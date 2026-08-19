using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Notificacao : BaseEntity
{
    public Guid Id { get; set; }

    public string Titulo { get; set; } = null!;
    public string SubTitulo { get; set; } = null!;
    public DateTime DataCriacao { get; set; }

    public Guid IdUsuario { get; set; }

}
