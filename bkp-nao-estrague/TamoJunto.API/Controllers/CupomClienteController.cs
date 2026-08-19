using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QRCoder;
using TamoJunto.API.RequestModel;
using TamoJunto.API.ViewModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;

namespace TamoJunto.API.Controllers;

    [Route("api/[controller]")]
public class CupomClienteController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<CupomCliente> _repository;
    private readonly IRepository<Notificacao> _notificacaoRepository;
    private readonly ICupomClienteService _cupomClienteService;
    private readonly IConfiguration _configuration;

    public CupomClienteController(IMapper mapper, IRepository<CupomCliente> repository, IRepository<Notificacao> notificacaoRepository, ICupomClienteService cupomClienteService, IConfiguration configuration)
    {
        _repository = repository;
        _mapper = mapper;
        _notificacaoRepository = notificacaoRepository;
        _cupomClienteService = cupomClienteService;
        _configuration = configuration;
    }

    [HttpPost("Criar")]
    public async Task<JsonResult> Criar([FromBody] CupomClienteRequest requestModel)
    {
        try
        {
            Console.WriteLine($"[DEBUG] Iniciando criação de cupom");
            Console.WriteLine($"[DEBUG] RequestModel: IdOfertaParceiro={requestModel.IdOfertaParceiro}, IdCliente={requestModel.IdCliente}");

            // Resgate só se a oferta estiver ativa e dentro do prazo de validade
            var ofertaRepository = HttpContext.RequestServices.GetService<IRepository<OfertaParceiro>>();
            var oferta = ofertaRepository != null ? await ofertaRepository.GetByIdAsync(requestModel.IdOfertaParceiro) : null;
            if (oferta == null)
                return Json(new { success = false, message = "Oferta não encontrada." });
            if (!oferta.Status)
                return Json(new { success = false, message = "Esta oferta não está ativa para resgate." });
            var hojeUtc = DateTime.UtcNow.Date;
            var validadeDate = oferta.Validade.Date;
            if (validadeDate < hojeUtc)
                return Json(new { success = false, message = "Esta oferta está fora do prazo de validade para resgate." });

            // Preferir cupom já existente deste cliente + oferta (vários registros legados podem existir para a mesma oferta).
            var cupomDoCliente = await _repository.FirstOrDefaultAsync(
                new CupomClientePorClienteEOfertaSpec(requestModel.IdCliente, requestModel.IdOfertaParceiro));
            if (cupomDoCliente != null)
            {
                return Json(new
                {
                    success = true,
                    id = cupomDoCliente.Id,
                    reused = true,
                    message = "Você já possui cupom desta oferta. Abrindo o cupom existente."
                });
            }

            // Modelo legado / índice: no máximo um cupom por oferta. Se já existe para outro cliente, não insere outro.
            var cupomOutroCliente = await _repository.FirstOrDefaultAsync(
                new CupomClientePorIdOfertaParceiroSpec(requestModel.IdOfertaParceiro));
            if (cupomOutroCliente != null)
            {
                return Json(new
                {
                    success = false,
                    message = "Esta oferta já possui um resgate vinculado a outro cliente."
                });
            }

            var model = _mapper.Map<CupomCliente>(requestModel);
            model.Id = Guid.NewGuid();
            model.DataResgate = DateTime.Now;

            Console.WriteLine($"[DEBUG] Model mapeado: Id={model.Id}, IdOfertaParceiro={model.IdOfertaParceiro}, IdCliente={model.IdCliente}");

            await _repository.AddAsync(model);
            await _repository.SaveChangesAsync();

            Console.WriteLine($"[DEBUG] Cupom salvo no banco com sucesso");

            var cupom = await _repository.ListAsync(new CupomComOfertaSpec());

            var ofertaParceiro = cupom
                .Where(c => c.IdOfertaParceiro == model.IdOfertaParceiro)
                .Select(c => new
                {
                    c.OfertaParceiro.NomeProduto,
                    c.OfertaParceiro.Desconto,
                    c.OfertaParceiro.Validade,
                    c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation.Nome
                })
                .FirstOrDefault();

            if (ofertaParceiro == null)
            {
                Console.WriteLine($"[DEBUG] Oferta não encontrada");
                return Json(new { success = false, message = "Oferta não encontrada" });
            }

            var descricao = $"Ganhe {ofertaParceiro.Desconto}% de desconto na loja {ofertaParceiro.Nome} " +
                            $"usando o cupom {ofertaParceiro.NomeProduto} até {ofertaParceiro.Validade.ToString("dd/MM/yyyy")}.";

            var clienteRepository = HttpContext.RequestServices.GetService<IRepository<Cliente>>();
            var clienteNotificacao = clienteRepository != null
                ? await clienteRepository.GetByIdAsync(model.IdCliente)
                : null;
            var idUsuarioNotificacao = clienteNotificacao?.IdUsuario ?? model.IdCliente;

            await _notificacaoRepository.AddAsync(new Notificacao
            {
                Id = Guid.NewGuid(),
                Titulo = "Novo cupom disponível!",
                SubTitulo = descricao,
                DataCriacao = DateTime.Now,
                IdUsuario = idUsuarioNotificacao
            });

            await _notificacaoRepository.SaveChangesAsync();

            Console.WriteLine($"[DEBUG] Cupom criado com sucesso, retornando ID: {model.Id}");
            return Json(new { success = true, id = model.Id });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Erro ao criar cupom: {ex.Message}");
            Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
            return Json(new { success = false, message = ex.Message });
        }
    }



    [HttpPost("Resgatar")]
    [AllowAnonymous]
    public async Task<JsonResult> Resgatar(Guid idCupom)
    {
        try
        {
            await _cupomClienteService.Resgatar(idCupom);
            var cupom = await _repository.GetByIdAsync(idCupom);
            return Json(cupom);
        }
        catch (Exception ex)
        {
            return Json(ex.Message);
        }

    }

    [HttpPut("Alterar")]
    public async Task<JsonResult> Alterar([FromBody] CupomClienteRequest requestModel)
    {
        var model = _mapper.Map<CupomCliente>(requestModel);
        model.DataResgate = DateTime.Now;
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpGet("Listar")]
    [AllowAnonymous]
    public async Task<JsonResult> Listar(Guid idCliente)
    {
        try
        {
            var cuponsDoCliente = await _repository.ListAsync(new CupomClientePorClienteSpec(idCliente));

            if (cuponsDoCliente.Count == 0)
            {
                return Json(new List<object>());
            }

            var result = cuponsDoCliente
                .Where(c => c.OfertaParceiro != null)
                .Select(cupom =>
                {
                    var oferta = cupom.OfertaParceiro!;
                    var parceiro = oferta.IdParceiroNavigation;
                    var empresa = parceiro?.IdEmpresaNavigation;

                    return (object)new
                    {
                        cupom.Id,
                        cupom.DataResgate,
                        cupom.DataUtilizacao,
                        cupom.IdOfertaParceiro,
                        cupom.IdCliente,
                        QrCode = GetQrCode(cupom.Id),
                        OfertaParceiro = new
                        {
                            oferta.Id,
                            oferta.NomeProduto,
                            oferta.Descricao,
                            oferta.Preco,
                            oferta.Desconto,
                            oferta.Validade,
                            oferta.Categoria,
                            IdParceiroNavigation = parceiro != null
                                ? new
                                {
                                    parceiro.Id,
                                    Nome = empresa?.Nome ?? parceiro.Nome ?? "Parceiro Desconhecido",
                                    IdEmpresaNavigation = empresa != null
                                        ? new { empresa.Id, nome = empresa.Nome }
                                        : null
                                }
                                : null
                        }
                    };
                })
                .ToList();

            return Json(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Erro ao listar cupons: {ex.Message}");
            return Json(new { error = ex.Message });
        }
    }

    [HttpGet("ListarPorParceiro/{idOfertaParceiro}")]
    public async Task<IActionResult> ListarPorParceiro(string idOfertaParceiro)
    {
        Console.WriteLine($"[DEBUG] Iniciando ListarPorParceiro para oferta: {idOfertaParceiro}");
        if (!Guid.TryParse(idOfertaParceiro, out Guid idOfertaParceiroGuid))
        {
            return BadRequest("ID da oferta parceira inválido.");
        }
        var cupoms = await _repository.ListAsync(new CupomComOfertaSpec());
        Console.WriteLine($"[DEBUG] Total de cupons carregados em ListarPorParceiro: {cupoms.Count()}");
        var cuponsDaOferta = cupoms.Where(c => c.IdOfertaParceiro == idOfertaParceiroGuid).ToList();
        Console.WriteLine($"[DEBUG] Cupons da oferta específica: {cuponsDaOferta.Count}");
        foreach (var c in cuponsDaOferta)
        {
            Console.WriteLine($"[DEBUG] Processando cupom ID: {c.Id} em ListarPorParceiro");
            Console.WriteLine($"[DEBUG] OfertaParceiro é null? {c.OfertaParceiro == null}");
            if (c.OfertaParceiro != null)
            {
                Console.WriteLine($"[DEBUG] Oferta ID: {c.OfertaParceiro.Id}");
                Console.WriteLine($"[DEBUG] Nome Produto: {c.OfertaParceiro.NomeProduto}");
                Console.WriteLine($"[DEBUG] IdParceiroNavigation é null? {c.OfertaParceiro.IdParceiroNavigation == null}");
                if (c.OfertaParceiro.IdParceiroNavigation != null)
                {
                    Console.WriteLine($"[DEBUG] Parceiro ID: {c.OfertaParceiro.IdParceiroNavigation.Id}");
                    Console.WriteLine($"[DEBUG] Parceiro Nome: '{c.OfertaParceiro.IdParceiroNavigation.Nome}'");
                    Console.WriteLine($"[DEBUG] Parceiro Nome é null ou vazio? {string.IsNullOrEmpty(c.OfertaParceiro.IdParceiroNavigation.Nome)}");
                    Console.WriteLine($"[DEBUG] IdEmpresaNavigation é null? {c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation == null}");
                    if (c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation != null)
                    {
                        Console.WriteLine($"[DEBUG] Empresa ID: {c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation.Id}");
                        Console.WriteLine($"[DEBUG] Empresa Nome: '{c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation.Nome}'");
                    }
                }
            }
        }
        var result = cuponsDaOferta.Select(c => new
        {
            c.Id,
            c.DataResgate,
            c.IdOfertaParceiro,
            QrCode = GetQrCode(c.Id),
            OfertaParceiro = c.OfertaParceiro != null ? new
            {
                c.OfertaParceiro.Id,
                c.OfertaParceiro.NomeProduto,
                c.OfertaParceiro.Descricao,
                c.OfertaParceiro.Preco,
                c.OfertaParceiro.Desconto,
                c.OfertaParceiro.Validade,
                c.OfertaParceiro.Categoria,
                IdParceiroNavigation = c.OfertaParceiro.IdParceiroNavigation != null ? new
                {
                    c.OfertaParceiro.IdParceiroNavigation.Id,
                    Nome = c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation?.Nome ?? "Parceiro Desconhecido",
                    IdEmpresaNavigation = c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation != null ? new
                    {
                        c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation.Id,
                        nome = c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation.Nome
                    } : null
                } : null
            } : null
        })
        .ToList();
        Console.WriteLine($"[DEBUG] Resultado final em ListarPorParceiro com {result.Count} cupons");
        return Ok(result);
    }


    // ...

    [HttpGet("QrCode")]
    [AllowAnonymous]
    public async Task<JsonResult> QrCode(Guid id)
    {
        return Json(GetQrCode(id));
    }
    private string GetQrCode(Guid id)
    {
        QRCodeGenerator qrGenerator = new QRCodeGenerator();
        string frontendUrl = _configuration["FrontendUrl"] ?? "https://app.tamojunto.net";
        QRCodeData qrCodeData = qrGenerator.CreateQrCode($"{frontendUrl}/#/resgatar-cupom/{id.ToString()}", QRCodeGenerator.ECCLevel.Q);
        Base64QRCode qrCode = new Base64QRCode(qrCodeData);
        string qrCodeImageAsBase64 = qrCode.GetGraphic(20);
        return qrCodeImageAsBase64;
    }

    [HttpDelete("Deletar")]
    //[Authorize(Roles = "Parceiro,Admin")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        try
    {
            var cupom = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<CupomCliente>(id));
            if (cupom == null)
        {
                return NotFound(new { success = false, message = "Cupom não encontrado." });
        }

            await _repository.DeleteAsync(cupom);
        await _repository.SaveChangesAsync();

            return Ok(new { success = true, message = "Cupom deletado com sucesso!" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao deletar cupom: {ex.Message}");
            return StatusCode(500, new { success = false, message = "Erro interno do servidor.", error = ex.Message });
        }
    }

    [HttpGet("ListarPorCategoria")]
public async Task<IActionResult> ListarPorCategoria([FromQuery] string categoria)
{
    var cupons = await _repository.ListAsync(new CupomComOfertaSpec());

    var resultado = cupons
        .Where(c => c.OfertaParceiro != null && 
                    string.Equals(c.OfertaParceiro.Categoria, categoria, StringComparison.OrdinalIgnoreCase))
        .Select(c => new
        {
            c.Id,
            c.DataResgate,
            c.DataUtilizacao,
            QrCode = GetQrCode(c.Id),
            Cliente = new
            {
                c.IdCliente 
            },
            OfertaParceiro = new
            {
                c.OfertaParceiro.NomeProduto,
                c.OfertaParceiro.Validade,
                c.OfertaParceiro.Desconto,
                IdParceiroNavigation = new
                {
                    c.OfertaParceiro.IdParceiroNavigation.IdEmpresaNavigation.Nome
                }
            }
        })
        .ToList();

    return Ok(resultado);
}
[HttpGet("ListarCuponsComStatus")]
public async Task<IActionResult> ListarCuponsComStatus(Guid? idCliente = null)
{
    try
    {
        Console.WriteLine($"Iniciando ListarCuponsComStatus para cliente: {idCliente}");
        
        // Usar uma abordagem mais simples sem includes problemáticos
        var cupons = await _repository.ListAsync(new GenericAllSpec<CupomCliente>());
        Console.WriteLine($"Total de cupons encontrados: {cupons.Count}");

        // Filtrar apenas os cupons do cliente específico se o ID foi fornecido
        if (idCliente.HasValue)
        {
            cupons = cupons.Where(c => c.IdCliente == idCliente.Value).ToList();
            Console.WriteLine($"Cupons filtrados para o cliente {idCliente}: {cupons.Count}");
        }

        // Buscar as ofertas e parceiros separadamente
        var ofertaRepository = HttpContext.RequestServices.GetService<IRepository<OfertaParceiro>>();
        var parceiroRepository = HttpContext.RequestServices.GetService<IRepository<Parceiro>>();
        var empresaRepository = HttpContext.RequestServices.GetService<IRepository<Empresa>>();
        
        var resultado = new List<object>();
        
        foreach (var cupom in cupons)
        {
            try
            {
                // Buscar a oferta
                var oferta = await ofertaRepository.GetByIdAsync(cupom.IdOfertaParceiro);
                if (oferta == null)
                {
                    Console.WriteLine($"Oferta não encontrada para cupom {cupom.Id}");
                    continue;
                }
                
                // Buscar o parceiro e empresa
                var parceiro = await parceiroRepository.GetByIdAsync(oferta.IdParceiro);
                var empresa = parceiro != null ? await empresaRepository.GetByIdAsync(parceiro.IdEmpresa) : null;
                
                var cupomComStatus = new
                {
                    Estabelecimento = empresa?.Nome ?? "Estabelecimento não encontrado",
                    CodigoCupom = cupom.Id,
                    Produto = oferta.NomeProduto ?? "Produto não encontrado",
                    ValorOriginal = oferta.Preco,
                    Desconto = oferta.Desconto,
                    ValorComDesconto = Math.Round(oferta.Preco * (1 - oferta.Desconto / 100), 2),
                    Status = cupom.DataUtilizacao.HasValue ? "concluído" : "pendente",
                    DataResgate = cupom.DataResgate,
                    DataUtilizacao = cupom.DataUtilizacao,
                    OfertaParceiro = new
                    {
                        Validade = oferta.Validade
                    }
                };
                
                resultado.Add(cupomComStatus);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao processar cupom {cupom.Id}: {ex.Message}");
            }
        }

        var resultadoFinal = resultado.OrderByDescending(x => ((dynamic)x).DataResgate).ToList();
        Console.WriteLine($"Resultado processado: {resultadoFinal.Count} cupons");
        return Ok(resultadoFinal);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro em ListarCuponsComStatus: {ex.Message}");
        return StatusCode(500, new { error = ex.Message });
    }
}

}