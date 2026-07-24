using System;
using System.Collections.Generic;

namespace TamoJunto.Domain.Models;

public partial class Plano : BaseEntity
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = null!;
    public decimal Valor { get; set; }
    public string Descricao { get; set; } = null!;
    public string Tipo { get; set; } = null!; 
    public bool Ativo { get; set; } = true;
    public DateTime DataCriacao { get; set; } = DateTime.Now;
}
