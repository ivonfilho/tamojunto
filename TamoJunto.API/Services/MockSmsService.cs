namespace TamoJunto.API.Services;

/// <summary>
/// Implementação mock do ISmsService (não envia SMS; usado apenas para satisfazer a injeção de dependência).
/// </summary>
public class MockSmsService : ISmsService
{
    public Task<bool> EnviarCodigoSms(string telefone, string codigo)
    {
        return Task.FromResult(false);
    }
}
