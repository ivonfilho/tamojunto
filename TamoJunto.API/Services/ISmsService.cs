namespace TamoJunto.API.Services;

public interface ISmsService
{
    Task<bool> EnviarCodigoSms(string telefone, string codigo);
}
