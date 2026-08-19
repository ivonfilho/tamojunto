using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using MercadoPago.Client.Preference;
using MercadoPago.Config;
using MercadoPago.Resource.Preference;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using TamoJunto.Domain.Specifications;
using Newtonsoft.Json.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using TamoJunto.Infra;

namespace TamoJunto.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentoController : ControllerBase
    {
        private readonly IRepository<Pagamento> _repository;
        private readonly IRepository<Plano> _planoRepository;
        private readonly IRepository<Usuario> _usuarioRepository;
        private readonly IRepository<Parceiro> _parceiroRepository;
        private readonly IRepository<Assinatura> _assinaturaRepository;
        private readonly IRepository<Cliente> _clienteRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PagamentoController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public PagamentoController(
            IRepository<Pagamento> repository,
            IRepository<Plano> planoRepository,
            IRepository<Usuario> usuarioRepository,
            IRepository<Parceiro> parceiroRepository,
            IRepository<Assinatura> assinaturaRepository,
            IRepository<Cliente> clienteRepository,
            IConfiguration configuration,
            ILogger<PagamentoController> logger,
            IHttpClientFactory httpClientFactory)
        {
            _repository = repository;
            _planoRepository = planoRepository;
            _usuarioRepository = usuarioRepository;
            _parceiroRepository = parceiroRepository;
            _assinaturaRepository = assinaturaRepository;
            _clienteRepository = clienteRepository;
            _configuration = configuration;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        private HttpClient CreateMercadoPagoClient()
        {
            var accessToken = _configuration["MercadoPago:AccessToken"];
            if (string.IsNullOrWhiteSpace(accessToken))
            {
                throw new InvalidOperationException("Configuração 'MercadoPago:AccessToken' não encontrada. Configure o token de acesso do Mercado Pago antes de gerar pagamentos.");
            }

            var client = _httpClientFactory.CreateClient("MercadoPago");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            return client;
        }

        private string? ResolverBaseUrlAplicacao()
        {
            var baseUrlConfigurada = _configuration["MercadoPago:BaseUrl"];
            if (!string.IsNullOrWhiteSpace(baseUrlConfigurada))
            {
                return baseUrlConfigurada.TrimEnd('/');
            }

            var request = HttpContext?.Request;
            if (request == null)
            {
                return null;
            }

            var scheme = request.Headers["X-Forwarded-Proto"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(scheme))
            {
                scheme = request.Scheme;
            }

            var host = request.Headers["X-Forwarded-Host"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(host))
            {
                host = request.Host.Value;
            }

            if (string.IsNullOrWhiteSpace(host))
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(scheme))
            {
                scheme = "https";
            }
            else if (string.Equals(scheme, "http", StringComparison.OrdinalIgnoreCase) && host.EndsWith("railway.app", StringComparison.OrdinalIgnoreCase))
            {
                scheme = "https";
            }

            return $"{scheme}://{host}".TrimEnd('/');
        }

        /// <summary>
        /// Checkout Pro: URL de redirecionamento — produção em init_point; testes em sandbox_init_point.
        /// </summary>
        private static string? ExtrairInitPointCheckoutProPreference(JsonElement preferenceResponse)
        {
            if (preferenceResponse.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            if (preferenceResponse.TryGetProperty("init_point", out var ip) && ip.ValueKind == JsonValueKind.String)
            {
                var s = ip.GetString();
                if (!string.IsNullOrWhiteSpace(s))
                {
                    return s;
                }
            }

            if (preferenceResponse.TryGetProperty("sandbox_init_point", out var sb)
                && sb.ValueKind == JsonValueKind.String)
            {
                var s = sb.GetString();
                if (!string.IsNullOrWhiteSpace(s))
                {
                    return s;
                }
            }

            return null;
        }

        private async Task<JObject?> ObterPagamentoMercadoPagoAsync(string paymentId)
        {
            try
            {
                var client = CreateMercadoPagoClient();
                var response = await client.GetAsync($"https://api.mercadopago.com/v1/payments/{paymentId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Mercado Pago retornou status {response.StatusCode} ao consultar o pagamento {paymentId}");
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(content))
                {
                    return null;
                }

                return JObject.Parse(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao consultar detalhes do pagamento {paymentId} no Mercado Pago");
                return null;
            }
        }

        private static JObject ConvertNotificationToJObject(object notification)
        {
            switch (notification)
            {
                case JObject jObject:
                    return jObject;
                case string json when !string.IsNullOrWhiteSpace(json):
                    return JObject.Parse(json);
                case JsonElement jsonElement:
                    var rawText = jsonElement.GetRawText();
                    return string.IsNullOrWhiteSpace(rawText) ? new JObject() : JObject.Parse(rawText);
                default:
                    return new JObject();
            }
        }

        private async Task<Usuario?> GetCurrentUser()
        {
            var authorizationHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            {
                return null;
            }

            var token = authorizationHeader.Substring("Bearer ".Length).Trim();
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

            var usuarioIdStr = jwtToken?.Claims.FirstOrDefault(c => c.Type == "Id")?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !Guid.TryParse(usuarioIdStr, out var usuarioId))
            {
                return null;
            }

            return await _usuarioRepository.GetByIdAsync(usuarioId);
        }

        private async Task<bool> IsParceiro(Guid usuarioId)
        {
            try
            {
                // Busca todos os parceiros e filtra localmente para debug
                var todosParceiros = await _parceiroRepository.ListAsync(new GenericAllSpec<Parceiro>());
                var parceiro = todosParceiros.FirstOrDefault(p => p.IdUsuario == usuarioId);
                
                _logger.LogInformation($"Buscando parceiro para usuário {usuarioId}. Total de parceiros: {todosParceiros.Count}. Encontrado: {parceiro != null}");
                
                return parceiro != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao verificar se usuário {usuarioId} é parceiro");
                return false;
            }
        }


        [HttpGet("ListarPlanos")]
        [Authorize]
        public async Task<IActionResult> ListarPlanos()
        {
            try
            {
                var planos = await _planoRepository.ListAsync(new GenericAllSpec<Plano>());
                var planosAtivos = planos.Where(p => p.Ativo).ToList();
                var resultado = planosAtivos.Select(p => new
                {
                    p.Id,
                    p.Titulo,
                    p.Valor,
                    p.Descricao,
                    p.Tipo,
                    p.DataCriacao
                }).ToList();
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao listar planos: {ex.Message}");
                return StatusCode(500, $"Erro ao listar planos: {ex.Message}");
            }
        }

        [HttpPost("GerarLinkPagamento")]
        [Authorize]
        public async Task<IActionResult> GerarLinkPagamento([FromQuery] Guid idPlano)
        {
            try
            {
                _logger.LogInformation($"Iniciando geração de link de pagamento para o plano: {idPlano}");

                // Obtém o usuário atual
                var usuario = await GetCurrentUser();
                if (usuario == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Obtém o plano selecionado
                var plano = await _planoRepository.GetByIdAsync(idPlano);
                if (plano == null)
                {
                    _logger.LogWarning($"Plano não encontrado: {idPlano}");
                    return NotFound("Plano não encontrado");
                }

                _logger.LogInformation($"Plano encontrado: {plano.Titulo} - Valor: {plano.Valor} - Tipo: {plano.Tipo}");

                // Verifica se é parceiro
                var parceiros = await _parceiroRepository.ListAsync(new GenericAllSpec<Parceiro>());
                var parceiro = parceiros.FirstOrDefault(p => p.IdUsuario == usuario.Id);
                
                // Se é parceiro e o plano é de parceiro, retorna erro
                if (parceiro != null && plano.Tipo == "PARCEIRO_GRATIS")
                {
                    // Para parceiros com plano gratuito, processa normalmente
                    _logger.LogInformation($"Parceiro {usuario.Id} ativando plano gratuito {plano.Tipo}");
                }

                // Se é parceiro, não precisa procurar por cliente
                if (parceiro != null)
                {
                    _logger.LogInformation($"Usuário {usuario.Id} é parceiro, processando plano {plano.Tipo}");
                    
                    // Para parceiros, verifica se é um plano gratuito
                    if (plano.Valor == 0)
                    {
                        // Cria um pagamento fictício para planos gratuitos
                        var pagamentoGratuito = new Pagamento
                        {
                            Id = Guid.NewGuid(),
                            Valor = 0,
                            Status = "approved",
                            Data = DateTime.Now,
                            Descricao = "Plano gratuito para parceiros",
                            UrlPagamento = ""
                        };
                        await _repository.AddAsync(pagamentoGratuito);
                        await _repository.SaveChangesAsync();

                        // Cria a assinatura para parceiros
                        var assinatura = new Assinatura
                        {
                            Id = Guid.NewGuid(),
                            IdParceiro = parceiro.Id, // Para parceiros, usa IdParceiro
                            IdPlano = plano.Id,
                            IdPagamento = pagamentoGratuito.Id,
                            DataCompra = DateTime.Now,
                            DataRenovacao = DateTime.Now.AddYears(10) // Assinatura "permanente" para parceiros
                        };
                        await _assinaturaRepository.AddAsync(assinatura);
                        await _assinaturaRepository.SaveChangesAsync();

                        return Ok(new
                        {
                            message = "Plano ativado com sucesso!",
                            isFreePlan = true,
                            planTitle = plano.Titulo,
                            expirationDate = assinatura.DataRenovacao
                        });
                    }
                }

                // Obtém o cliente do usuário (apenas para usuários que não são parceiros)
                var clientes = await _clienteRepository.ListAsync(new GenericAllSpec<Cliente>());
                var cliente = clientes.FirstOrDefault(c => c.IdUsuario == usuario.Id);
                
                if (cliente == null)
                {
                    _logger.LogWarning($"Cliente não encontrado para usuário: {usuario.Id}");
                    return NotFound("Cliente não encontrado");
                }

                _logger.LogInformation($"Cliente encontrado: {cliente.Id}");

                // Verifica se o usuário já possui uma assinatura ativa
                var assinaturasAtivas = await _assinaturaRepository.ListAsync(new GenericAllSpec<Assinatura>());
                var assinaturasAtivasFiltradas = assinaturasAtivas
                    .Where(a => a.IdCliente == cliente.Id && a.DataRenovacao > DateTime.Now)
                    .ToList();

                if (assinaturasAtivasFiltradas.Any())
                {
                    var assinaturaAtiva = assinaturasAtivasFiltradas.First();
                    var planoAtivo = await _planoRepository.GetByIdAsync(assinaturaAtiva.IdPlano);
                    
                    _logger.LogWarning($"Usuário já possui assinatura ativa: {assinaturaAtiva.Id} - Plano: {planoAtivo?.Titulo} - Renovação: {assinaturaAtiva.DataRenovacao}");
                    
                    return BadRequest(new { 
                        message = $"Você já possui uma assinatura ativa: {planoAtivo?.Titulo}. A assinatura é válida até {assinaturaAtiva.DataRenovacao:dd/MM/yyyy}.",
                        hasActiveSubscription = true,
                        activeSubscription = new
                        {
                            assinaturaAtiva.Id,
                            assinaturaAtiva.DataRenovacao,
                            plano = new
                            {
                                planoAtivo?.Id,
                                planoAtivo?.Titulo,
                                planoAtivo?.Tipo
                            }
                        }
                    });
                }

                // Verifica se é um plano gratuito (valor 0)
                if (plano.Valor == 0)
                {
                    _logger.LogInformation("Plano gratuito detectado, processando...");
                    
                    // Verifica se é o plano gratuito para parceiros
                    if (plano.Tipo == "PARCEIRO_GRATIS")
                    {
                        _logger.LogInformation("Plano de parceiro detectado, verificando se usuário é parceiro...");
                        // Verifica se o usuário é parceiro
                        var isParceiro = await IsParceiro(usuario.Id);
                        _logger.LogInformation($"Usuário {usuario.Id} é parceiro: {isParceiro}");
                        
                        if (!isParceiro)
                        {
                            return BadRequest(new { 
                                message = "Este plano é exclusivo para parceiros. Faça o cadastro como parceiro para acessar este plano gratuito.",
                                requiresPartnerRegistration = true
                            });
                        }
                    }

                    // Cria um pagamento fictício para planos gratuitos (necessário pois IdPagamento é PK)
                    var pagamentoGratuito = new Pagamento
                    {
                        Id = Guid.NewGuid(),
                        Data = DateTime.Now,
                        Descricao = $"Pagamento gratuito - {plano.Titulo}",
                        Valor = 0,
                        Status = "PAGO",
                        UrlPagamento = ""
                    };

                    _logger.LogInformation($"Criando pagamento fictício: {pagamentoGratuito.Id}");

                    await _repository.AddAsync(pagamentoGratuito);
                    await _repository.SaveChangesAsync();

                    _logger.LogInformation("Pagamento fictício criado com sucesso");

                    // Cria a assinatura gratuita
                    var assinatura = new Assinatura
                    {
                        Id = Guid.NewGuid(),
                        IdCliente = cliente.Id,
                        IdPlano = plano.Id,
                        DataCompra = DateTime.Now,
                        DataRenovacao = plano.Valor == 0 ? DateTime.Now.AddDays(30) : DateTime.Now.AddMonths(1),
                        IdPagamento = pagamentoGratuito.Id // Usa o pagamento fictício
                    };

                    _logger.LogInformation($"Criando assinatura: {assinatura.Id} - Cliente: {assinatura.IdCliente} - Plano: {assinatura.IdPlano} - Pagamento: {assinatura.IdPagamento}");

                    await _assinaturaRepository.AddAsync(assinatura);
                    await _assinaturaRepository.SaveChangesAsync();

                    _logger.LogInformation("Assinatura criada com sucesso");

                    return Ok(new { 
                        message = "Plano ativado com sucesso!",
                        isFreePlan = true,
                        planTitle = plano.Titulo,
                        expirationDate = assinatura.DataRenovacao
                    });
                }

                // Para planos pagos, gera o link de pagamento
                _logger.LogInformation("Plano pago detectado, gerando link de pagamento...");

                // Cria uma assinatura pendente primeiro
                var assinaturaPendente = new Assinatura
                {
                    Id = Guid.NewGuid(),
                    IdCliente = cliente.Id,
                    IdPlano = plano.Id,
                    DataCompra = DateTime.Now,
                    // Para planos pagos, a assinatura só será ativada após a confirmação do pagamento
                    DataRenovacao = DateTime.Now,
                    IdPagamento = null // Atualizado após criar o registro de pagamento
                };

                _logger.LogInformation($"Criando assinatura pendente: {assinaturaPendente.Id}");

                await _assinaturaRepository.AddAsync(assinaturaPendente);
                await _assinaturaRepository.SaveChangesAsync();

                // Cria o pagamento pendente
                var pagamento = new Pagamento
                {
                    Id = Guid.NewGuid(),
                    Data = DateTime.Now,
                    Descricao = $"Pagamento - {plano.Titulo}",
                    Valor = plano.Valor,
                    Status = "PENDENTE",
                    UrlPagamento = ""
                };

                await _repository.AddAsync(pagamento);
                await _repository.SaveChangesAsync();

                _logger.LogInformation($"Pagamento pendente criado: {pagamento.Id}");

                // Atualiza a assinatura com a referência do pagamento pendente
                assinaturaPendente.IdPagamento = pagamento.Id;
                await _assinaturaRepository.UpdateAsync(assinaturaPendente);
                await _assinaturaRepository.SaveChangesAsync();

                var baseUrl = ResolverBaseUrlAplicacao();

                var notificationUrl = _configuration["MercadoPago:NotificationUrl"];
                if (string.IsNullOrWhiteSpace(notificationUrl))
                {
                    if (!string.IsNullOrWhiteSpace(baseUrl))
                    {
                        notificationUrl = $"{baseUrl}/api/pagamento/webhookmercadopago";
                        _logger.LogWarning($"Usando URL padrão gerada automaticamente para notificações do Mercado Pago: {notificationUrl}");
                    }
                    else
                    {
                        _logger.LogError("Configuração 'MercadoPago:NotificationUrl' não definida e não foi possível gerar URL padrão.");
                        return StatusCode(500, "Configuração de webhook do Mercado Pago ausente.");
                    }
                }

                var successUrl = _configuration["MercadoPago:BackUrls:Success"];
                var failureUrl = _configuration["MercadoPago:BackUrls:Failure"];
                var pendingUrl = _configuration["MercadoPago:BackUrls:Pending"];

                if (string.IsNullOrWhiteSpace(successUrl) && !string.IsNullOrWhiteSpace(baseUrl))
                {
                    successUrl = $"{baseUrl}/pagamentos/sucesso";
                    _logger.LogWarning($"Configuração 'MercadoPago:BackUrls:Success' não encontrada. Utilizando fallback: {successUrl}");
                }

                if (string.IsNullOrWhiteSpace(failureUrl) && !string.IsNullOrWhiteSpace(baseUrl))
                {
                    failureUrl = $"{baseUrl}/pagamentos/erro";
                    _logger.LogWarning($"Configuração 'MercadoPago:BackUrls:Failure' não encontrada. Utilizando fallback: {failureUrl}");
                }

                if (string.IsNullOrWhiteSpace(pendingUrl) && !string.IsNullOrWhiteSpace(baseUrl))
                {
                    pendingUrl = $"{baseUrl}/pagamentos/pendente";
                    _logger.LogWarning($"Configuração 'MercadoPago:BackUrls:Pending' não encontrada. Utilizando fallback: {pendingUrl}");
                }

                var autoReturn = _configuration["MercadoPago:AutoReturn"] ?? "approved";
                var statementDescriptor = _configuration["MercadoPago:StatementDescriptor"];
                if (string.IsNullOrWhiteSpace(statementDescriptor))
                {
                    statementDescriptor = "TAMO JUNTO";
                }

                // Não enviar payment_methods com listas vazias: o MP pode normalizar para entradas inválidas
                // (ex.: id vazio) e restringir o checkout. Sem o bloco, o MP aplica o padrão (cartão, boleto, PIX etc.).

                var preference = new
                {
                    items = new[]
                    {
                        new
                        {
                            title = plano.Titulo,
                            quantity = 1,
                            unit_price = (double)plano.Valor
                        }
                    },
                    external_reference = assinaturaPendente.Id.ToString(),
                    metadata = new
                    {
                        assinaturaId = assinaturaPendente.Id.ToString(),
                        pagamentoId = pagamento.Id.ToString(),
                        usuarioId = usuario.Id.ToString(),
                        planoId = plano.Id.ToString()
                    },
                    payer = new
                    {
                        email = usuario.Email,
                        name = usuario.Nome,
                        identification = !string.IsNullOrWhiteSpace(cliente.Cpf) ? new { type = "CPF", number = cliente.Cpf } : null
                    },
                    back_urls = new
                    {
                        success = successUrl,
                        failure = failureUrl,
                        pending = pendingUrl
                    },
                    auto_return = autoReturn,
                    notification_url = notificationUrl,
                    // binary_mode = false permite pagamentos pendentes (boleto e PIX)
                    // Quando true, só aceita pagamentos aprovados ou rejeitados imediatamente
                    binary_mode = false,
                    statement_descriptor = statementDescriptor
                };

                _logger.LogInformation("Tentando criar preferência no Mercado Pago...");

                HttpClient client;
                try
                {
                    client = CreateMercadoPagoClient();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao configurar cliente HTTP para Mercado Pago");
                    return StatusCode(500, "Configuração do Mercado Pago inválida.");
                }

                var jsonContent = System.Text.Json.JsonSerializer.Serialize(preference, new System.Text.Json.JsonSerializerOptions
                {
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
                });
                var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                var response = await client.PostAsync("https://api.mercadopago.com/checkout/preferences", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var preferenceResponse = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(responseContent);

                    // Produção: init_point; credenciais de teste: costuma vir sandbox_init_point
                    var initPoint = ExtrairInitPointCheckoutProPreference(preferenceResponse);
                    if (string.IsNullOrWhiteSpace(initPoint))
                    {
                        _logger.LogError(
                            "Mercado Pago retornou preferência sem init_point/sandbox_init_point. Corpo: {Body}",
                            responseContent);
                        return StatusCode(502, new
                        {
                            message = "Resposta inválida do Mercado Pago (sem URL de checkout).",
                            details = responseContent
                        });
                    }

                    // Atualiza o pagamento com a URL
                    pagamento.UrlPagamento = initPoint;
                    await _repository.UpdateAsync(pagamento);
                    await _repository.SaveChangesAsync();

                    _logger.LogInformation("Preferência criada com sucesso!");

                    return Ok(new { 
                        urlPagamento = initPoint,
                        assinaturaId = assinaturaPendente.Id,
                        pagamentoId = pagamento.Id
                    });
                }
                else
                {
                    var erroBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Erro ao criar preferência: {StatusCode}. Corpo: {Body}", response.StatusCode, erroBody);

                    return StatusCode((int)response.StatusCode, new
                    {
                        message = "Erro ao gerar link de pagamento no Mercado Pago.",
                        status = response.StatusCode,
                        details = erroBody
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao gerar link de pagamento. Detalhes: {ex.Message}");
                return StatusCode(500, "Erro ao gerar link de pagamento");
            }
        }

        [HttpGet("MinhasAssinaturas")]
        [Authorize]
        public async Task<IActionResult> MinhasAssinaturas()
        {
            try
            {
                _logger.LogInformation("Iniciando MinhasAssinaturas");
                
                var usuario = await GetCurrentUser();
                if (usuario == null)
                {
                    _logger.LogWarning("Usuário não autenticado");
                    return Unauthorized("Usuário não autenticado");
                }

                _logger.LogInformation($"Buscando assinaturas para usuário {usuario.Id}");

                // Parceiro comercial = Role Parceiro (evita tratar cliente/MEI que tenha registro órfão em Parceiros)
                if (usuario.Role == UserRole.Parceiro)
                {
                    var parceiro = await _parceiroRepository.FirstOrDefaultAsync(new GenericByUsuarioSpec<Parceiro>(usuario.Id));
                    if (parceiro == null)
                    {
                        _logger.LogWarning($"Role Parceiro sem registro em Parceiros para usuário {usuario.Id}");
                        return Ok(new List<object>());
                    }

                    _logger.LogInformation($"Usuário {usuario.Id} é parceiro comercial. Retornando plano gratuito.");
                    
                    // Para parceiros, retorna uma assinatura fictícia
                    return Ok(new List<object>
                    {
                        new
                        {
                            Id = Guid.NewGuid(),
                            DataCompra = DateTime.Now,
                            DataRenovacao = DateTime.Now.AddYears(10), // Assinatura "permanente" para parceiros
                            IdPagamento = (Guid?)null,
                            plano = new
                            {
                                Id = Guid.NewGuid(),
                                Titulo = "Plano Parceiro",
                                Valor = 0,
                                Tipo = "PARCEIRO_GRATIS"
                            },
                            ativa = true
                        }
                    });
                }

                _logger.LogInformation($"Usuário {usuario.Id} é cliente. Buscando assinaturas...");

                var cliente = await _clienteRepository.FirstOrDefaultAsync(new ClientePorIdUsuarioSpec(usuario.Id));

                if (cliente == null)
                {
                    _logger.LogWarning($"Cliente não encontrado para usuário {usuario.Id}");
                    return Ok(new List<object>());
                }

                _logger.LogInformation($"Cliente {cliente.Id} encontrado para usuário {usuario.Id}");

                try
                {
                    var assinaturasCliente = await _assinaturaRepository.ListAsync(new AssinaturaPorIdClienteSpec(cliente.Id));
                    _logger.LogInformation($"Encontradas {assinaturasCliente.Count} assinaturas para cliente {cliente.Id}");

                    var planosIds = assinaturasCliente.Select(a => a.IdPlano).Distinct().ToList();
                    var planos = planosIds.Count == 0
                        ? new List<Plano>()
                        : (await _planoRepository.ListAsync(new GenericAllSpec<Plano>()))
                            .Where(p => planosIds.Contains(p.Id))
                            .ToList();

                    var resultado = new List<object>();
                    var agora = DateTime.Now;

                    foreach (var assinatura in assinaturasCliente)
                    {
                        var plano = planos.FirstOrDefault(p => p.Id == assinatura.IdPlano);

                        var status = "EXPIRADA";
                        if (plano != null)
                        {
                            if (plano.Tipo == "FREE_TRIAL")
                            {
                                status = assinatura.DataRenovacao > agora ? "ATIVA" : "EXPIRADA";
                            }
                            else
                            {
                                if (assinatura.IdPagamento.HasValue)
                                {
                                    status = assinatura.DataRenovacao > agora ? "ATIVA" : "EXPIRADA";
                                }
                                else
                                {
                                    status = "PENDENTE_PAGAMENTO";
                                }
                            }
                        }
                        else
                        {
                            status = assinatura.DataRenovacao > agora ? "ATIVA" : "EXPIRADA";
                        }

                        var ativa = status == "ATIVA";

                        resultado.Add(new
                        {
                            assinatura.Id,
                            assinatura.DataCompra,
                            assinatura.DataRenovacao,
                            assinatura.IdPagamento,
                            plano = new
                            {
                                plano?.Id,
                                plano?.Titulo,
                                plano?.Valor,
                                plano?.Tipo
                            },
                            ativa,
                            status
                        });
                    }

                    _logger.LogInformation($"Retornando {resultado.Count} assinaturas processadas");
                    return Ok(resultado);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Erro ao buscar assinaturas específicas, retornando lista vazia: {ex.Message}");
                    return Ok(new List<object>());
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao listar assinaturas: {ex.Message}");
                return StatusCode(500, new { message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpGet("VerificarAssinaturaAtiva")]
        [Authorize]
        public async Task<IActionResult> VerificarAssinaturaAtiva()
        {
            try
            {
                _logger.LogInformation("Iniciando verificação de assinatura ativa");
                
                // Obtém o usuário atual
                var usuario = await GetCurrentUser();
                if (usuario == null)
                {
                    _logger.LogWarning("Usuário não autenticado");
                    return Unauthorized("Usuário não autenticado");
                }

                _logger.LogInformation($"Verificando assinatura para usuário {usuario.Id}");

                if (usuario.Role == UserRole.Parceiro)
                {
                    var parceiro = await _parceiroRepository.FirstOrDefaultAsync(new GenericByUsuarioSpec<Parceiro>(usuario.Id));
                    if (parceiro == null)
                    {
                        _logger.LogWarning($"Role Parceiro sem registro em Parceiros: {usuario.Id}");
                        return Ok(new { hasActiveSubscription = false });
                    }

                    _logger.LogInformation($"Usuário {usuario.Id} é parceiro comercial. Acesso gratuito.");
                    
                    // Para parceiros, sempre retorna que têm assinatura ativa (acesso gratuito)
                            return Ok(new {
                                hasActiveSubscription = true,
                                activeSubscription = new
                                {
                            Id = Guid.NewGuid(),
                            DataCompra = DateTime.Now,
                            DataRenovacao = DateTime.Now.AddYears(10), // Assinatura "permanente" para parceiros
                                    plano = new
                                    {
                                id = Guid.Parse("bbe0e608-afb2-48b8-93bc-7cb4b5e82dce"), // ID do plano PARCEIRO_GRATIS
                                titulo = "Plano Parceiro Grátis",
                                tipo = "PARCEIRO_GRATIS",
                                valor = 0
                                    },
                            diasRestantes = 3650 // 10 anos em dias
                        }
                    });
                }

                _logger.LogInformation($"Usuário {usuario.Id} é cliente. Verificando assinatura...");

                var cliente = await _clienteRepository.FirstOrDefaultAsync(new ClientePorIdUsuarioSpec(usuario.Id));

                if (cliente == null)
                {
                    _logger.LogWarning($"Cliente não encontrado para usuário {usuario.Id}");
                    return Ok(new { hasActiveSubscription = false });
                }

                _logger.LogInformation($"Cliente {cliente.Id} encontrado para usuário {usuario.Id}");

                var assinaturasCliente = await _assinaturaRepository.ListAsync(new AssinaturaPorIdClienteSpec(cliente.Id));

                var agora = DateTime.Now;
                var planosIds = assinaturasCliente.Select(a => a.IdPlano).Distinct().ToList();
                var planosCliente = planosIds.Count == 0
                    ? new List<Plano>()
                    : (await _planoRepository.ListAsync(new GenericAllSpec<Plano>()))
                        .Where(p => planosIds.Contains(p.Id))
                        .ToList();

                var assinaturaAtiva = assinaturasCliente
                    .Where(a => a.DataRenovacao > agora)
                    .OrderByDescending(a => a.DataRenovacao)
                    .FirstOrDefault(a =>
                    {
                        var planoAssinatura = planosCliente.FirstOrDefault(p => p.Id == a.IdPlano);
                        if (planoAssinatura == null)
                        {
                            return false;
                        }

                        if (planoAssinatura.Tipo == "FREE_TRIAL")
                        {
                            return true;
                        }

                        return a.IdPagamento.HasValue;
                    });

                if (assinaturaAtiva != null)
                {
                    var planoAtivo = planosCliente.FirstOrDefault(p => p.Id == assinaturaAtiva.IdPlano);
                    
                    _logger.LogInformation($"Cliente {cliente.Id} possui assinatura ativa {assinaturaAtiva.Id}");
                    
                    return Ok(new { 
                        hasActiveSubscription = true,
                        activeSubscription = new
                        {
                            assinaturaAtiva.Id,
                            assinaturaAtiva.DataCompra,
                            assinaturaAtiva.DataRenovacao,
                            plano = new
                            {
                                id = planoAtivo?.Id,
                                titulo = planoAtivo?.Titulo,
                                tipo = planoAtivo?.Tipo,
                                valor = planoAtivo?.Valor
                            },
                            diasRestantes = (assinaturaAtiva.DataRenovacao - DateTime.Now).Days
                        }
                    });
                }

                _logger.LogInformation($"Cliente {cliente.Id} não possui assinatura ativa válida");
                return Ok(new { hasActiveSubscription = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao verificar assinatura ativa: {ex.Message}");
                _logger.LogError($"StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpPost("WebhookMercadoPago")]
        public async Task<IActionResult> WebhookMercadoPago([FromBody] object notification)
        {
            try
            {
                var notificationObj = ConvertNotificationToJObject(notification);
                _logger.LogInformation($"Webhook recebido do Mercado Pago: {notificationObj.ToString(Newtonsoft.Json.Formatting.None)}");

                var type = notificationObj["type"]?.ToString() ?? notificationObj["topic"]?.ToString();
                var data = notificationObj["data"];

                if (type != null && type.Equals("payment", StringComparison.OrdinalIgnoreCase))
                {
                    var paymentId = data?["id"]?.ToString();
                    var externalReference = data?["external_reference"]?.ToString();
                    var status = data?["status"]?.ToString();

                    if (string.IsNullOrWhiteSpace(paymentId))
                    {
                        var resource = notificationObj["resource"]?.ToString();
                        if (!string.IsNullOrWhiteSpace(resource))
                        {
                            paymentId = resource.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();
                        }
                    }

                    JObject? detalhesPagamento = null;
                    if (!string.IsNullOrWhiteSpace(paymentId))
                    {
                        detalhesPagamento = await ObterPagamentoMercadoPagoAsync(paymentId);
                        if (detalhesPagamento != null)
                        {
                            status = detalhesPagamento["status"]?.ToString() ?? status;
                            externalReference ??= detalhesPagamento["external_reference"]?.ToString();
                        }
                    }

                    _logger.LogInformation($"Webhook - Pagamento ID: {paymentId}, Status: {status}, External Reference: {externalReference}");

                    if (!string.Equals(status, "approved", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogInformation("Pagamento ainda não aprovado. Nenhuma alteração aplicada.");
                        return Ok(new { message = "Notificação recebida, aguardando aprovação." });
                    }

                    if (string.IsNullOrWhiteSpace(externalReference) || !Guid.TryParse(externalReference, out var assinaturaId))
                    {
                        _logger.LogWarning($"External reference inválida recebida no webhook: {externalReference}");
                        return Ok(new { message = "Notificação ignorada - referência inválida." });
                    }

                    var assinaturaEncontrada = await _assinaturaRepository.FirstOrDefaultAsync(new GenericByIdSpec<Assinatura>(assinaturaId));
                    if (assinaturaEncontrada == null)
                    {
                        _logger.LogWarning($"Assinatura não encontrada para external_reference {externalReference}");
                        return Ok(new { message = "Assinatura não encontrada." });
                    }

                    Pagamento? pagamentoEncontrado = null;
                    if (assinaturaEncontrada.IdPagamento.HasValue)
                    {
                        pagamentoEncontrado = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<Pagamento>(assinaturaEncontrada.IdPagamento.Value));
                    }

                    if (pagamentoEncontrado != null)
                    {
                        pagamentoEncontrado.Status = "PAGO";
                        pagamentoEncontrado.Data = DateTime.Now;
                        if (!string.IsNullOrEmpty(paymentId))
                        {
                            pagamentoEncontrado.Descricao = $"Pagamento aprovado Mercado Pago ({paymentId})";
                        }

                        if (detalhesPagamento != null)
                        {
                            pagamentoEncontrado.UrlPagamento = detalhesPagamento["transaction_details"]?["external_resource_url"]?.ToString() ?? pagamentoEncontrado.UrlPagamento;
                        }

                        await _repository.UpdateAsync(pagamentoEncontrado);
                    }

                    var planoAssinatura = await _planoRepository.GetByIdAsync(assinaturaEncontrada.IdPlano);

                    if (detalhesPagamento != null && DateTime.TryParse(detalhesPagamento["date_approved"]?.ToString(), out var dataAprovacao))
                    {
                        assinaturaEncontrada.DataCompra = dataAprovacao;
                    }
                    else
                    {
                        assinaturaEncontrada.DataCompra = DateTime.Now;
                    }

                    if (planoAssinatura != null)
                    {
                        assinaturaEncontrada.DataRenovacao = planoAssinatura.Tipo == "ANUAL"
                            ? assinaturaEncontrada.DataCompra.AddYears(1)
                            : assinaturaEncontrada.DataCompra.AddDays(1); // TESTE: 1 dia para plano mensal
                    }
                    else
                    {
                        assinaturaEncontrada.DataRenovacao = assinaturaEncontrada.DataCompra.AddDays(1); // TESTE: 1 dia para plano mensal
                    }

                    if (!assinaturaEncontrada.IdPagamento.HasValue && pagamentoEncontrado != null)
                    {
                        assinaturaEncontrada.IdPagamento = pagamentoEncontrado.Id;
                    }

                    await _assinaturaRepository.UpdateAsync(assinaturaEncontrada);

                    await _repository.SaveChangesAsync();
                    await _assinaturaRepository.SaveChangesAsync();

                    _logger.LogInformation($"Assinatura {assinaturaEncontrada.Id} liberada após confirmação do pagamento {paymentId}");
                }

                return Ok(new { message = "Webhook processado com sucesso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar webhook do Mercado Pago");
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}