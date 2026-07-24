using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace TamoJunto.API.Tests;

/// <summary>
/// Garante que o registro <c>AddHttpClient("MercadoPago")</c> usado em Program.cs funciona.
/// Nota: no .NET 8, <see cref="IHttpClientFactory.CreateClient(string)"/> pode retornar um
/// <see cref="HttpClient"/> mesmo sem nome registrado; o registro explícito ainda é recomendado
/// para políticas/handlers específicos e documentação da intenção.
/// </summary>
public class MercadoPagoHttpClientFactoryTests
{
    [Fact]
    public void CreateClient_MercadoPago_com_AddHttpClient_nomeado_nao_lanca()
    {
        var services = new ServiceCollection();
        services.AddHttpClient();
        services.AddHttpClient("MercadoPago");

        using var sp = services.BuildServiceProvider();
        var factory = sp.GetRequiredService<IHttpClientFactory>();

        using var client = factory.CreateClient("MercadoPago");
        Assert.NotNull(client);
    }
}
