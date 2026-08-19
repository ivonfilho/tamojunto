using System;

namespace TamoJunto.API.RequestModel;
 
public class AssinaturaParceiroRequest
{
    public Guid IdParceiro { get; set; }
    public Guid IdPlano { get; set; }
} 