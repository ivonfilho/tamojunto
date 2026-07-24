using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;


namespace TamoJunto.Domain.Models;

public partial class OfertaParceiro : BaseEntity
{
    public Guid Id { get; set; }

    public Guid IdParceiro { get; set; }

    public DateTime DataCriacao { get; set; }

    public DateTime Validade { get; set; }

    public string Descricao { get; set; } = null!;

    public string Categoria { get; set; } = null!;

    public Guid IdEndereco { get; set; }

    public string NomeProduto { get; set; } = null!;

    public decimal Preco { get; set; }

    public decimal Desconto { get; set; } 

    public string TipoProduto { get; set; } = null!;

    public string TipoOferta { get; set; } = null!;

    public Guid IdUsuarioCadastrante { get; set; }

    public virtual Endereco IdEnderecoNavigation { get; set; } = null!;

    public virtual CupomCliente? IdNavigation { get; set; }

    public virtual Parceiro IdParceiroNavigation { get; set; } = null!;

    public virtual ICollection<Imagem> Imagem { get; set; } = new List<Imagem>();

    public string CategoriaCupom { get; set; }
    
    public bool Status { get; set; } 
    
    public string QrCodePath { get; set; } = null!; 
}
