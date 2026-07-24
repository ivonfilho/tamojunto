using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;

namespace TamoJunto.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableCors("AllowAllPolicy")]
public class CnpjController : ControllerBase
{
    private const string CnpjWsUrl = "https://publica.cnpj.ws/cnpj";
    private readonly IHttpClientFactory _httpClientFactory;

    public CnpjController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Consulta CNPJ via API pública (proxy). Evita ERR_NAME_NOT_RESOLVED no cliente.
    /// </summary>
    [HttpGet("{cnpj}")]
    public async Task<IActionResult> Consultar(string cnpj, CancellationToken cancellationToken = default)
    {
        var cnpjNumeros = new string(cnpj.Where(char.IsDigit).ToArray());
        if (cnpjNumeros.Length != 14)
            return BadRequest(new { message = "CNPJ deve conter 14 dígitos." });

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        try
        {
            var response = await client.GetAsync($"{CnpjWsUrl}/{cnpjNumeros}", cancellationToken);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { message = "CNPJ não encontrado ou serviço indisponível." });

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            return Content(json, "application/json");
        }
        catch (TaskCanceledException)
        {
            return StatusCode(408, new { message = "Consulta ao CNPJ expirou. Tente novamente." });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = "Não foi possível consultar o CNPJ. Tente novamente.", detail = ex.Message });
        }
    }
}
