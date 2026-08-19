namespace TamoJunto.API.RequestModel;

public class OfertaParceiroRequest
{
    public Guid Id { get; set; }

    public Guid IdParceiro { get; set; }

    public DateTime DataCriacao { get; set; }

    public DateTime Validade { get; set; }

    public string? QrCodePath { get; set; }

    public string Descricao { get; set; } = null!;

    public string Categoria { get; set; } = null!;

    public Guid IdEndereco { get; set; }

    public string NomeProduto { get; set; } = null!;

    public decimal Preco { get; set; }

    public decimal Desconto { get; set; }

    public string TipoProduto { get; set; } = null!;

    public string TipoOferta { get; set; } = null!;

    public Guid IdUsuarioCadastrante { get; set; }
    
    public bool Status { get; set; }
}