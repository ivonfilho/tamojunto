using System;
using System.Collections.Generic;
namespace TamoJunto.API.Dtos
{
public class RelatorioCupomDTO
{
    public string CodigoCupom { get; set; }
    public string DescricaoOferta { get; set; }
    public int QuantidadeUsos { get; set; }
    public decimal ValorTotalVendido { get; set; }
    public decimal TicketMedio { get; set; }
    public DateTime DataExpiracao { get; set; }
}}
