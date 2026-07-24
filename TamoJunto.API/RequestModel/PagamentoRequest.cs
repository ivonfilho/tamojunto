namespace TamoJunto.API.RequestModel;

public class PagamentoRequest
{
    public Guid Id { get; set; }

    public DateTime Data { get; set; }

    public string Descricao { get; set; } = null!;

    public decimal Valor { get; set; }

    public string Status { get; set; } = null!;

    public string SubscriptionId { get; set; }  
    public string CardNumber { get; set; }  
    public string ExpMonth { get; set; } 
    public string ExpYear { get; set; }  
    public string SecuritCode { get; set; } 
    public string CardHolderName { get; set; } 
    public string CardHolderTaxId { get; set; } 
    public string IdPlano { get; set; } 

    public string Titulo { get; set; }
    public int Quantidade { get; set; }
    
}