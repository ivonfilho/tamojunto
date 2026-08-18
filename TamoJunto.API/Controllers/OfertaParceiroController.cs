using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.API.Utils;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using TamoJunto.Infra;
using Microsoft.AspNetCore.Cors;
using TamoJunto.API.Dtos;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace TamoJunto.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableCors("AllowAllPolicy")] // Habilitar CORS para todas as origens
public class OfertaParceiroController : ControllerBase
{
    private const string CacheKeyOfertasListar = "tj:ofertas:listar:v1";
    private static readonly JsonSerializerOptions JsonCacheOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IMapper _mapper;
    private readonly IRepository<OfertaParceiro> _repository;
    private readonly IRepository<CupomCliente> _repositoryCupom;
    private readonly IRepository<Notificacao> _notificacaoRepository;
    private readonly IRepository<Parceiro> _repositoryParceiro;
    private readonly IRepository<Usuario> _repositoryUsuario;
    private readonly IRepository<Cliente> _repositoryCliente;
    private readonly IRepository<Imagem> _repositoryImagem;
    private readonly IRepository<Empresa> _repositoryEmpresa;
    private readonly IDistributedCache _distributedCache;


    public OfertaParceiroController(
        IMapper mapper,
        IRepository<OfertaParceiro> repository,
        IRepository<CupomCliente> repositoryCupom,
        IRepository<Notificacao> notificacaoRepository,
        IRepository<Parceiro> repositoryParceiro,
        IRepository<Usuario> repositoryUsuario,
        IRepository<Cliente> repositoryCliente,
        IRepository<Imagem> repositoryImagem,
        IRepository<Empresa> repositoryEmpresa,
        IDistributedCache distributedCache)
    {
        _repository = repository;
        _repositoryCupom = repositoryCupom;
        _notificacaoRepository = notificacaoRepository;
        _repositoryParceiro = repositoryParceiro;
        _repositoryUsuario = repositoryUsuario;
        _repositoryCliente = repositoryCliente;
        _repositoryImagem = repositoryImagem;
        _repositoryEmpresa = repositoryEmpresa;
        _distributedCache = distributedCache;
        _mapper = mapper;
    }


   [HttpPost("Criar")]
public async Task<IActionResult> Criar([FromBody] OfertaParceiroRequest requestModel)
{
    var errors = new List<string>();

    if (requestModel == null)
        return Ok(new { success = false, message = "Corpo da requisição está nulo." });

    if (requestModel.IdParceiro == Guid.Empty)
        errors.Add("ID do parceiro é obrigatório.");

    if (string.IsNullOrWhiteSpace(requestModel.Descricao))
        errors.Add("Descrição é obrigatória.");

    if (requestModel.Preco <= 0)
        errors.Add("O preço deve ser maior que zero.");

    if (errors.Any())
    {
        return BadRequest(new { success = false, errors });
    }

    try
    {
        // Validação adicional
        var parceiro = await _repositoryParceiro.FirstOrDefaultAsync(
            new GenericByIdSpec<Parceiro>(requestModel.IdParceiro));

        if (parceiro == null)
            return BadRequest(new { success = false, message = "Parceiro não encontrado." });

        if (parceiro.IdUsuario == Guid.Empty)
            return BadRequest(new { success = false, message = "Parceiro não possui um IdUsuario associado." });

        var usuario = await _repositoryUsuario.FirstOrDefaultAsync(
            new GenericByIdSpec<Usuario>(parceiro.IdUsuario));

        if (usuario == null)
            return Ok(new { success = false, message = "Usuário associado ao parceiro não encontrado." });

        // Verificar se o usuário é um parceiro
        var parceiroDoUsuario = await _repositoryParceiro.FirstOrDefaultAsync(
            new GenericByUsuarioSpec<Parceiro>(usuario.Id));

        if (parceiroDoUsuario == null)
            return Ok(new { success = false, message = "Usuário não é um parceiro válido." });

        // Para notificações, vamos buscar todos os clientes (opcional)
        var clientes = await _repositoryCliente.ListAsync(new GenericAllSpec<Cliente>());
        var clienteParaNotificacao = clientes.FirstOrDefault(); // Usar o primeiro cliente para notificação

        var model = _mapper.Map<OfertaParceiro>(requestModel);
        model.Id = Guid.NewGuid();
        model.DataCriacao = DateTime.UtcNow;
        model.CategoriaCupom = requestModel.Categoria; 
        model.Status = true;

        await _repository.AddAsync(model);
        await _repository.SaveChangesAsync();

        await _distributedCache.RemoveAsync(CacheKeyOfertasListar);

        var descricaoNotificacao = $"Nova oferta: {model.NomeProduto} com {model.Desconto}% de desconto até {model.Validade:dd/MM/yyyy}!";
        var tituloNotificacao = model.TipoOferta == "relampago"
            ? $"Oferta relâmpago: Desconto exclusivo!"
            : "Nova Oferta Disponível!";

        var notificacao = new Notificacao
        {
            Id = Guid.NewGuid(),
            Titulo = tituloNotificacao,
            SubTitulo = descricaoNotificacao,
            DataCriacao = DateTime.UtcNow,
            IdUsuario = clienteParaNotificacao?.Id ?? Guid.Empty
        };

        await _notificacaoRepository.AddAsync(notificacao);
        await _notificacaoRepository.SaveChangesAsync();

        return Ok(new { success = true, message = "Oferta criada com sucesso e notificação enviada!", id = model.Id });
    }
    catch (Exception ex)
    {
        return Ok(new
        {
            success = false,
            message = "Erro ao criar a oferta.",
            error = ex.Message,
            stackTrace = ex.StackTrace 
        });
    }
}


    [HttpPut("Alterar")]
   // [Authorize(Roles = "Parceiro,Admin")]
    public async Task<IActionResult> Alterar([FromBody] OfertaParceiroRequest requestModel)
    {
        try
        {
            if (requestModel == null)
                return Ok(new { success = false, message = "Corpo da requisição está nulo." });

            var existente = await _repository.GetByIdAsync(requestModel.Id);
            if (existente == null)
                return Ok(new { success = false, message = "Oferta não encontrada." });

            // Mapear sobre a entidade rastreada. Não usar Map + Update(): DbContext.Update()
            // zera navegações não carregadas (ex.: CupomCliente) e quebra o 1:1 obrigatório no dependente.
            _mapper.Map(requestModel, existente);
            await _repository.SaveChangesAsync();

            await _distributedCache.RemoveAsync(CacheKeyOfertasListar);

            return Ok(new { success = true, message = "Oferta alterada com sucesso!" });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                success = false,
                message = "Erro ao alterar a oferta.",
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

   

[HttpGet("ListarComDescontoECategoria")]
public async Task<IActionResult> ListarComDescontoECategoria()
{
    var result = await _repository.ListAsync(new GenericAllSpec<OfertaParceiro>());

    var ofertas = result.Select(oferta => new
    {
        oferta.Id,
        oferta.Categoria,
        oferta.Desconto
    }).ToList();

    return Ok(ofertas);
}

    /// <summary>
    /// Marca ofertas expiradas (Validade &lt; agora) como inativas. Chamar antes de listar/retornar ofertas.
    /// </summary>
    /// <returns>true se alguma oferta foi atualizada (cache da listagem deve ser invalidado).</returns>
    private async Task<bool> SincronizarOfertasExpiradas()
    {
        var agora = DateTime.UtcNow;
        var dbContext = HttpContext.RequestServices.GetService<TamoJuntoContext>();
        if (dbContext == null)
            return false;

        // Atualização em massa só na coluna Status — evita DbContext.Update() em OfertaParceiro
        // com navegação 1:1 (CupomCliente) não carregada, o que dispara "association has been severed".
        var hojeUtc = agora.Date;
        var affected = await dbContext.OfertaParceiro
            .Where(o => o.Status && o.Validade < hojeUtc)
            .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, false));

        return affected > 0;
    }

    private Task InvalidarCacheListagemOfertasAsync() =>
        _distributedCache.RemoveAsync(CacheKeyOfertasListar);

    private static bool OfertaExpiradaUtc(OfertaParceiro oferta) =>
        oferta.Validade.Date < DateTime.UtcNow.Date;

    private async Task DesativarOfertaSeExpiradaAsync(Guid id, OfertaParceiro oferta)
    {
        if (!oferta.Status || !OfertaExpiradaUtc(oferta))
            return;

        var dbContext = HttpContext.RequestServices.GetService<TamoJuntoContext>();
        if (dbContext != null)
        {
            await dbContext.OfertaParceiro
                .Where(o => o.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, false));
        }

        oferta.Status = false;
        await InvalidarCacheListagemOfertasAsync();
    }

    private async Task<(ILookup<Guid, Imagem> imagens, Dictionary<Guid, Parceiro> parceiros, Dictionary<Guid, Empresa> empresas, Dictionary<Guid, Usuario> usuarios)>
        CarregarDadosParaMontagemOfertasAsync()
    {
        var todasImagens = await _repositoryImagem.ListAsync(new GenericAllSpec<Imagem>());
        var imagens = todasImagens.ToLookup(i => i.IdOfertaParceiro ?? Guid.Empty);

        var todosParceiros = await _repositoryParceiro.ListAsync(new GenericAllSpec<Parceiro>());
        var parceiros = todosParceiros.ToDictionary(p => p.Id);

        var todasEmpresas = await _repositoryEmpresa.ListAsync(new GenericAllSpec<Empresa>());
        var empresas = todasEmpresas.ToDictionary(e => e.Id);

        var todosUsuarios = await _repositoryUsuario.ListAsync(new GenericAllSpec<Usuario>());
        var usuarios = todosUsuarios.ToDictionary(u => u.Id);

        return (imagens, parceiros, empresas, usuarios);
    }

    private object MontarOfertaResposta(
        OfertaParceiro oferta,
        ILookup<Guid, Imagem> imagensPorOferta,
        IReadOnlyDictionary<Guid, Parceiro> parceiros,
        IReadOnlyDictionary<Guid, Empresa> empresas,
        IReadOnlyDictionary<Guid, Usuario> usuarios)
    {
        parceiros.TryGetValue(oferta.IdParceiro, out var parceiro);
        Empresa? empresa = null;
        if (parceiro != null)
            empresas.TryGetValue(parceiro.IdEmpresa, out empresa);

        string? fotoPerfil = null;
        if (parceiro != null && parceiro.IdUsuario != Guid.Empty
            && usuarios.TryGetValue(parceiro.IdUsuario, out var usuario)
            && !string.IsNullOrEmpty(usuario.UrlImagem))
            fotoPerfil = usuario.UrlImagem;

        var imagensFiltradas = imagensPorOferta[oferta.Id].ToList();

        return new
        {
            oferta.Id,
            oferta.IdParceiro,
            oferta.DataCriacao,
            oferta.Validade,
            oferta.Descricao,
            oferta.Categoria,
            oferta.IdEndereco,
            oferta.NomeProduto,
            oferta.Preco,
            oferta.Desconto,
            oferta.TipoProduto,
            oferta.TipoOferta,
            oferta.IdUsuarioCadastrante,
            oferta.CategoriaCupom,
            oferta.Status,
            imagem = imagensFiltradas.Select(img => new
            {
                img.Id,
                img.Path,
                img.IdOfertaParceiro
            }).ToList(),
            IdParceiroNavigation = parceiro != null
                ? new
                {
                    Id = parceiro.Id,
                    IdUsuario = parceiro.IdUsuario,
                    IdEmpresa = parceiro.IdEmpresa,
                    Nome = parceiro.Nome,
                    Website = parceiro.Website,
                    DataCriacao = parceiro.DataCriacao,
                    Contato = parceiro.Contato,
                    Status = parceiro.Status,
                    FotoPerfil = fotoPerfil,
                    IdEmpresaNavigation = empresa != null
                        ? new
                        {
                            Id = empresa.Id,
                            Nome = empresa.Nome,
                            Cnpj = empresa.Cnpj,
                            Atividade = empresa.Atividade
                        }
                        : null
                }
                : null
        };
    }

    [HttpGet("ObterPorId/{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var oferta = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<OfertaParceiro>(id));
        if (oferta == null)
            return NotFound(new { success = false, message = "Oferta não encontrada." });

        await DesativarOfertaSeExpiradaAsync(id, oferta);

        var todasImagens = await _repositoryImagem.ListAsync(new GenericAllSpec<Imagem>());
        var imagensFiltradas = todasImagens.Where(img => img.IdOfertaParceiro == id).ToList();
        var parceiro = await _repositoryParceiro.GetByIdAsync(oferta.IdParceiro);
        var empresa = parceiro != null ? await _repositoryEmpresa.GetByIdAsync(parceiro.IdEmpresa) : null;
        string fotoPerfil = null;
        if (parceiro != null && parceiro.IdUsuario != Guid.Empty)
        {
            var usuario = await _repositoryUsuario.GetByIdAsync(parceiro.IdUsuario);
            if (usuario != null && !string.IsNullOrEmpty(usuario.UrlImagem))
                fotoPerfil = usuario.UrlImagem;
        }

        var payload = new
        {
            oferta.Id,
            oferta.IdParceiro,
            oferta.DataCriacao,
            oferta.Validade,
            oferta.Descricao,
            oferta.Categoria,
            oferta.IdEndereco,
            oferta.NomeProduto,
            oferta.Preco,
            oferta.Desconto,
            oferta.TipoProduto,
            oferta.TipoOferta,
            oferta.IdUsuarioCadastrante,
            oferta.CategoriaCupom,
            oferta.Status,
            imagem = imagensFiltradas.Select(img => new { img.Id, img.Path, img.IdOfertaParceiro }).ToList(),
            imagemPaths = imagensFiltradas.Select(img => img.Path).ToList(),
            IdParceiroNavigation = parceiro != null ? new
            {
                Id = parceiro.Id,
                IdUsuario = parceiro.IdUsuario,
                IdEmpresa = parceiro.IdEmpresa,
                Nome = parceiro.Nome,
                Website = parceiro.Website,
                DataCriacao = parceiro.DataCriacao,
                Contato = parceiro.Contato,
                Status = parceiro.Status,
                FotoPerfil = fotoPerfil,
                IdEmpresaNavigation = empresa != null ? new { Id = empresa.Id, Nome = empresa.Nome, Cnpj = empresa.Cnpj, Atividade = empresa.Atividade } : null
            } : null
        };
        return Ok(payload);
    }

    [HttpGet("Listar")]
    public async Task<IActionResult> Listar()
    {
        try
        {
            var houveMudancaExpiracao = await SincronizarOfertasExpiradas();
            if (houveMudancaExpiracao)
                await InvalidarCacheListagemOfertasAsync();

            if (!houveMudancaExpiracao)
            {
                var cached = await _distributedCache.GetAsync(CacheKeyOfertasListar);
                if (cached is { Length: > 0 })
                    return Content(Encoding.UTF8.GetString(cached), "application/json");
            }

            var result = await _repository.ListAsync(new GenericAllSpec<OfertaParceiro>());
            var (imagensLookup, parceiros, empresas, usuarios) = await CarregarDadosParaMontagemOfertasAsync();

            var ofertas = new List<object>();
            foreach (var oferta in result.OrderByDescending(x => x.DataCriacao))
                ofertas.Add(MontarOfertaResposta(oferta, imagensLookup, parceiros, empresas, usuarios));

            var json = JsonSerializer.Serialize(ofertas, JsonCacheOptions);
            await _distributedCache.SetAsync(
                CacheKeyOfertasListar,
                Encoding.UTF8.GetBytes(json),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(45) });

            return Content(json, "application/json");
        }
        catch (Exception ex)
        {
            return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpGet("ListarPorParceiro/{idParceiro}")]
    public async Task<IActionResult> ListarPorParceiro(Guid idParceiro)
    {
        try
        {
            Console.WriteLine($"[DEBUG] Iniciando ListarPorParceiro para parceiro: {idParceiro}");
            var houveMudancaExpiracao = await SincronizarOfertasExpiradas();
            if (houveMudancaExpiracao)
                await InvalidarCacheListagemOfertasAsync();

            var result = await _repository.ListAsync(new GenericAllSpec<OfertaParceiro>());
            var ofertasFiltradas = result.Where(o => o.IdParceiro == idParceiro).ToList();

            var (imagensLookup, parceiros, empresas, usuarios) = await CarregarDadosParaMontagemOfertasAsync();

            var ofertas = new List<object>();
            foreach (var oferta in ofertasFiltradas.OrderByDescending(x => x.DataCriacao))
                ofertas.Add(MontarOfertaResposta(oferta, imagensLookup, parceiros, empresas, usuarios));

            Console.WriteLine($"[DEBUG] Ofertas encontradas para parceiro {idParceiro}: {ofertas.Count}");
            return Ok(ofertas);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Erro ao listar ofertas por parceiro: {ex.Message}");
            return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpGet("ListarCuponsPorParceiro/{idParceiro}")]
    // [Authorize(Roles = "Parceiro,Admin")]
    public async Task<IActionResult> ListarCuponsPorParceiro(Guid idParceiro)
    {
        try
        {
            Console.WriteLine($"[DEBUG] Iniciando ListarCuponsPorParceiro para parceiro: {idParceiro}");
            
            // Usar DbContext diretamente para evitar problemas de navegação
            var dbContext = HttpContext.RequestServices.GetService<TamoJuntoContext>();
            if (dbContext == null)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor." });
            }

            // Buscar ofertas do parceiro
            var ofertas = await dbContext.OfertaParceiro
                .Where(o => o.IdParceiro == idParceiro)
                .Select(o => new { o.Id, o.NomeProduto, o.Descricao, o.Preco, o.Desconto, o.Validade, o.Categoria, o.TipoProduto, o.TipoOferta })
                .ToListAsync();

            if (!ofertas.Any())
            {
                Console.WriteLine($"[DEBUG] Nenhuma oferta encontrada para o parceiro {idParceiro}");
                return Ok(new List<object>());
            }

            var idOfertas = ofertas.Select(o => o.Id).ToList();

            // Buscar cupons dessas ofertas
            var cupons = await dbContext.CupomCliente
                .Where(c => idOfertas.Contains(c.IdOfertaParceiro))
                .Select(c => new { c.Id, c.IdCliente, c.DataResgate, c.DataUtilizacao, c.IdOfertaParceiro })
                .ToListAsync();

            Console.WriteLine($"[DEBUG] Cupons encontrados: {cupons?.Count() ?? 0}");

            // Transformar para o formato esperado pelo frontend
            var result = new List<object>();
            
            foreach (var cupom in cupons)
            {
                // Encontrar a oferta correspondente
                var oferta = ofertas.FirstOrDefault(o => o.Id == cupom.IdOfertaParceiro);
                if (oferta != null)
                {
                result.Add(new {
                        id = cupom.Id,
                        idCliente = cupom.IdCliente,
                        dataResgate = cupom.DataResgate,
                        dataUtilizacao = cupom.DataUtilizacao,
                        idOfertaParceiro = cupom.IdOfertaParceiro,
                        ofertaParceiro = new {
                            id = oferta.Id,
                            nomeProduto = oferta.NomeProduto,
                            descricao = oferta.Descricao,
                            preco = oferta.Preco,
                            desconto = oferta.Desconto,
                            validade = oferta.Validade,
                            categoria = oferta.Categoria,
                            tipoProduto = oferta.TipoProduto,
                            tipoOferta = oferta.TipoOferta
                        }
                    });
                }
            }

            Console.WriteLine($"[DEBUG] Resultado final com {result.Count} cupons");
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Erro ao listar cupons por parceiro: {ex.Message}");
            Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, message = "Erro interno do servidor.", error = ex.Message });
        }
    }

    [HttpPost("{id}/UploadImagem")]
    //[Authorize(Roles = "Parceiro,Admin")]
    public async Task<IActionResult> UploadImagem(Guid id, IFormFile file)
    {
        try
        {
            Console.WriteLine($"=== UPLOAD DE IMAGEM INICIADO ===");
            Console.WriteLine($"Oferta ID: {id}");
            
        if (file == null || file.Length == 0)
            {
                Console.WriteLine("ERRO: Arquivo não fornecido ou vazio");
            return BadRequest("Nenhuma imagem foi enviada.");
            }

            Console.WriteLine($"Arquivo recebido: {file.FileName}, Tamanho: {file.Length}, ContentType: {file.ContentType}");

        var oferta = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<OfertaParceiro>(id));
        if (oferta == null)
            {
                Console.WriteLine($"ERRO: Oferta não encontrada: {id}");
            return NotFound("Oferta não encontrada.");
            }

            Console.WriteLine($"Oferta encontrada: {oferta.NomeProduto}");

            // Deletar imagens antigas desta oferta antes de adicionar a nova
            var imagensAntigas = await _repositoryImagem.ListAsync(new GenericAllSpec<Imagem>());
            var imagensDaOferta = imagensAntigas.Where(img => img.IdOfertaParceiro == id).ToList();
            
            if (imagensDaOferta.Any())
            {
                Console.WriteLine($"Deletando {imagensDaOferta.Count} imagem(ns) antiga(s) da oferta {id}");
                foreach (var imagemAntiga in imagensDaOferta)
                {
                    await _repositoryImagem.DeleteAsync(imagemAntiga);
                }
                await _repositoryImagem.SaveChangesAsync();
                Console.WriteLine("Imagens antigas deletadas com sucesso");
            }

            // Converter imagem para base64
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();
            var base64String = Convert.ToBase64String(fileBytes);
            var dataUrl = $"data:{file.ContentType};base64,{base64String}";

            Console.WriteLine($"Imagem convertida para base64. Tamanho do base64: {base64String.Length}");

        var imagem = new Imagem
        {
            Id = Guid.NewGuid(),
                Path = dataUrl,
            IdOfertaParceiro = id
        };

            Console.WriteLine($"Criando imagem com ID: {imagem.Id}, IdOfertaParceiro: {imagem.IdOfertaParceiro}");

        await _repositoryImagem.AddAsync(imagem);
            Console.WriteLine("Imagem adicionada ao repositório");

        await _repositoryImagem.SaveChangesAsync();
            Console.WriteLine("SaveChanges executado com sucesso");
            Console.WriteLine($"=== UPLOAD CONCLUÍDO COM SUCESSO ===");

            return Ok(new { message = "Imagem enviada com sucesso!", imageUrl = dataUrl });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== ERRO NO UPLOAD ===");
            Console.WriteLine($"Erro detalhado no upload: {ex}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException}");
                Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
            }
            return StatusCode(500, new { 
                error = "Erro interno do servidor", 
                details = ex.Message,
                stackTrace = ex.StackTrace,
                innerException = ex.InnerException?.Message
            });
        }
    }

    [HttpDelete("Deletar")]
    //[Authorize(Roles = "Parceiro,Admin")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        try
    {
            var oferta = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<OfertaParceiro>(id));
            if (oferta == null)
        {
                return NotFound(new { success = false, message = "Oferta não encontrada." });
            }

            // Deletar imagens relacionadas primeiro
            var imagens = await _repositoryImagem.ListAsync(new GenericAllSpec<Imagem>());
            var imagensDaOferta = imagens.Where(img => img.IdOfertaParceiro == id).ToList();
            foreach (var imagem in imagensDaOferta)
            {
                await _repositoryImagem.DeleteAsync(imagem);
            }
            await _repositoryImagem.SaveChangesAsync();

            // Deletar cupons relacionados
            var cupons = await _repositoryCupom.ListAsync(new GenericAllSpec<CupomCliente>());
            var cuponsFiltrados = cupons.Where(x => x.IdOfertaParceiro == id).ToList();
            foreach (var cupom in cuponsFiltrados)
            {
                await _repositoryCupom.DeleteAsync(cupom);
            }
            await _repositoryCupom.SaveChangesAsync();

            // Deletar a oferta
            await _repository.DeleteAsync(oferta);
            await _repository.SaveChangesAsync();

            return Ok(new { success = true, message = "Oferta deletada com sucesso!" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao deletar oferta: {ex.Message}");
            return StatusCode(500, new { success = false, message = "Erro interno do servidor.", error = ex.Message });
        }
    }

    [HttpPut("AlterarStatus/{id}")]
    //[Authorize(Roles = "Parceiro,Admin")]
public async Task<IActionResult> AlterarStatus(Guid id, [FromBody] AlterarStatusDto dto)
{
    var oferta = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<OfertaParceiro>(id));

    if (oferta == null)
    {
        return NotFound(new { success = false, message = "Oferta não encontrada." });
    }

    if (dto.NovoStatus != "ativa" && dto.NovoStatus != "inativa")
    {
        return BadRequest(new { success = false, message = "Status inválido. Use 'ativa' ou 'inativa'." });
    }

    oferta.Status = dto.NovoStatus == "ativa";

    // Ao ativar, estender validade em 7 dias a partir de agora
    if (dto.NovoStatus == "ativa")
    {
        oferta.Validade = DateTime.UtcNow.AddDays(7);

        // Um cupom por oferta (índice único): ao reativar, zera utilização para o mesmo cupom poder
        // ser validado de novo na loja (Resgatar exige DataUtilizacao nula).
        var dbContext = HttpContext.RequestServices.GetService<TamoJuntoContext>();
        if (dbContext != null)
        {
            await dbContext.CupomCliente
                .Where(c => c.IdOfertaParceiro == id)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.DataUtilizacao, (DateTime?)null));
        }
    }

    // Entidade já rastreada: SaveChanges basta. Update() quebraria o vínculo 1:1 com CupomCliente.
    await _repository.SaveChangesAsync();
    await InvalidarCacheListagemOfertasAsync();

    return Ok(new 
    { 
        success = true, 
        message = dto.NovoStatus == "ativa" 
            ? $"Oferta ativada. Validade estendida por 7 dias (até {oferta.Validade:dd/MM/yyyy}). Cupom vinculado pode ser utilizado novamente na loja." 
            : $"Oferta {oferta.Id} agora está {dto.NovoStatus}.", 
        status = dto.NovoStatus,
        validade = oferta.Validade
    });
}

}