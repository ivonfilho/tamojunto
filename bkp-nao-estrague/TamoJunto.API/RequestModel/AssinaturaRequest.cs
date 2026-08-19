using System;

namespace TamoJunto.API.RequestModel;

public class AssinaturaRequest
{
    public Guid IdCliente { get; set; }
    public Guid IdPlano { get; set; }
}