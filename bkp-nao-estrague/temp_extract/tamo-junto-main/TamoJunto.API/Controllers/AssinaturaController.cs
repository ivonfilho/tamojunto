using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using PagBank;
using PagBank.Model;
using System;
using System.Threading.Tasks;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using AutoMapper;
using TamoJunto.Domain.Specifications;
using System.Linq;

namespace TamoJunto.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssinaturaController : Controller
    {
        private readonly IMapper _mapper;
        private readonly IRepository<Assinatura> _repository;
        private readonly IRepository<Cliente> _clienteRepository;
        private readonly IRepository<Usuario> _usuarioRepository;
        private readonly IRepository<Plano> _planoRepository;
        private readonly IRepository<Parceiro> _parceiroRepository;
        private readonly IRepository<Pagamento> _pagamentoRepository;

        public AssinaturaController(
            IMapper mapper, 
            IRepository<Assinatura> repository, 
            IRepository<Cliente> clienteRepository, 
            IRepository<Usuario> usuarioRepository,
            IRepository<Plano> planoRepository,
            IRepository<Parceiro> parceiroRepository,
            IRepository<Pagamento> pagamentoRepository)
        {
            _mapper = mapper;
            _repository = repository;
            _clienteRepository = clienteRepository;
            _usuarioRepository = usuarioRepository;
            _planoRepository = planoRepository;
            _parceiroRepository = parceiroRepository;
            _pagamentoRepository = pagamentoRepository;
        }

        [HttpPost("CriarAssinaturaCliente")]
        public async Task<JsonResult> CriarAssinaturaCliente([FromBody] AssinaturaRequest requestModel)
{
    try
    {
                Console.WriteLine($"[AssinaturaController] Iniciando criação de assinatura para cliente: {requestModel.IdCliente}");
                
    var cliente = await _clienteRepository.FirstOrDefaultAsync(new GenericByIdSpec<Cliente>(requestModel.IdCliente));
    if (cliente == null)
    {
                    Console.WriteLine($"[AssinaturaController] Cliente não encontrado: {requestModel.IdCliente}");
        return Json(new { sucesso = false, erro = "Cliente não encontrado." });
    }
                Console.WriteLine($"[AssinaturaController] Cliente encontrado: {cliente.Id}");

    var usuario = await _usuarioRepository.FirstOrDefaultAsync(new GenericByIdSpec<Usuario>(cliente.IdUsuario));
    if (usuario == null)
    {
                    Console.WriteLine($"[AssinaturaController] Usuário não encontrado: {cliente.IdUsuario}");
        return Json(new { sucesso = false, erro = "Usuário não encontrado." });
    }
                Console.WriteLine($"[AssinaturaController] Usuário encontrado: {usuario.Id}");

                var plano = await _planoRepository.FirstOrDefaultAsync(new GenericByIdSpec<Plano>(requestModel.IdPlano));
                if (plano == null)
                {
                    Console.WriteLine($"[AssinaturaController] Plano não encontrado: {requestModel.IdPlano}");
                    return Json(new { sucesso = false, erro = "Plano não encontrado." });
                }
                Console.WriteLine($"[AssinaturaController] Plano encontrado: {plano.Id} - {plano.Titulo}");

    // Verifica se o cliente já possui uma assinatura ativa
    var assinaturasAtivas = await _repository.ListAsync(new GenericAllSpec<Assinatura>());
    var assinaturasAtivasFiltradas = assinaturasAtivas
        .Where(a => a.IdCliente == cliente.Id && a.DataRenovacao > DateTime.Now)
        .ToList();

    if (assinaturasAtivasFiltradas.Any())
    {
        var assinaturaAtiva = assinaturasAtivasFiltradas.First();
                    Console.WriteLine($"[AssinaturaController] Cliente já possui assinatura ativa: {assinaturaAtiva.Id}");
        return Json(new { 
            sucesso = false, 
            erro = $"Você já possui uma assinatura ativa que é válida até {assinaturaAtiva.DataRenovacao:dd/MM/yyyy}. Não é possível criar uma nova assinatura.",
            hasActiveSubscription = true,
            activeSubscription = new
            {
                assinaturaAtiva.Id,
                assinaturaAtiva.DataRenovacao
            }
        });
    }

                // Verifica se é um plano gratuito (FREE_TRIAL)
                if (plano.Tipo == "FREE_TRIAL")
                {
                    Console.WriteLine($"[AssinaturaController] Criando assinatura gratuita para cliente: {cliente.Id}");
                    
                    // Para planos gratuitos, não precisa gerar link de pagamento
                    var assinatura = new Assinatura
                    {
                        Id = Guid.NewGuid(),
                        IdCliente = cliente.Id,
                        IdPlano = plano.Id,
                        DataCompra = DateTime.Now,
                        DataRenovacao = DateTime.Now.AddDays(30), // 30 dias grátis
                        IdPagamento = null,
                        IdParceiro = null
                    };

                    Console.WriteLine($"[AssinaturaController] Assinatura criada: {assinatura.Id}");
                    Console.WriteLine($"[AssinaturaController] Salvando no banco...");

                    await _repository.AddAsync(assinatura);
                    await _repository.SaveChangesAsync();

                    Console.WriteLine($"[AssinaturaController] Assinatura salva com sucesso!");

                    return Json(new { 
                        sucesso = true, 
                        mensagem = "Assinatura gratuita criada com sucesso!",
                        assinatura = new
                        {
                            assinatura.Id,
                            assinatura.DataRenovacao,
                            plano = plano.Titulo,
                            tipo = "GRATUITA"
                        }
                    });
                }
                else
                {
                    // Para planos pagos, gera link do Mercado Pago
                    var assinatura = new Assinatura
                    {
                        Id = Guid.NewGuid(),
                        IdCliente = cliente.Id,
                        IdPlano = plano.Id,
                        DataCompra = DateTime.Now,
                        DataRenovacao = DateTime.Now.AddDays(30), // Será atualizada após pagamento
                        IdPagamento = null,
                        IdParceiro = null
                    };

                    // Gera link do Mercado Pago
                    var linkPagamento = await GerarLinkMercadoPago(assinatura, plano, usuario, cliente);
                    
                    if (linkPagamento.sucesso)
                    {
                        await _repository.AddAsync(assinatura);
        await _repository.SaveChangesAsync();

                        return Json(new { 
                            sucesso = true, 
                            mensagem = "Assinatura criada. Acesse o link para realizar o pagamento.",
                            linkPagamento = linkPagamento.link,
                            assinatura = new
                            {
                                assinatura.Id,
                                plano = plano.Titulo,
                                valor = plano.Valor,
                                tipo = "PAGA"
                            }
                        });
                    }
     else
        {
                        return Json(new { sucesso = false, erro = linkPagamento.erro });
                    }
        }
    }
    catch (Exception ex)
    {
        return Json(new { sucesso = false, erro = $"Erro interno: {ex.Message}" });
    }
        }

        [HttpPost("CriarAssinaturaParceiro")]
        public async Task<JsonResult> CriarAssinaturaParceiro([FromBody] AssinaturaParceiroRequest requestModel)
        {
            try
            {
                Console.WriteLine($"[AssinaturaController] Iniciando criação de assinatura para parceiro: {requestModel.IdParceiro}");
                
                var parceiro = await _parceiroRepository.FirstOrDefaultAsync(new GenericByIdSpec<Parceiro>(requestModel.IdParceiro));
                if (parceiro == null)
                {
                    Console.WriteLine($"[AssinaturaController] Parceiro não encontrado: {requestModel.IdParceiro}");
                    return Json(new { sucesso = false, erro = "Parceiro não encontrado." });
                }
                Console.WriteLine($"[AssinaturaController] Parceiro encontrado: {parceiro.Id}");

                var usuario = await _usuarioRepository.FirstOrDefaultAsync(new GenericByIdSpec<Usuario>(parceiro.IdUsuario));
                if (usuario == null)
                {
                    Console.WriteLine($"[AssinaturaController] Usuário não encontrado: {parceiro.IdUsuario}");
                    return Json(new { sucesso = false, erro = "Usuário não encontrado." });
                }
                Console.WriteLine($"[AssinaturaController] Usuário encontrado: {usuario.Id}");

                var plano = await _planoRepository.FirstOrDefaultAsync(new GenericByIdSpec<Plano>(requestModel.IdPlano));
                if (plano == null)
                {
                    Console.WriteLine($"[AssinaturaController] Plano não encontrado: {requestModel.IdPlano}");
                    return Json(new { sucesso = false, erro = "Plano não encontrado." });
                }
                Console.WriteLine($"[AssinaturaController] Plano encontrado: {plano.Id} - {plano.Titulo}");

                // Verifica se é um plano de parceiro
                if (plano.Tipo != "PARCEIRO_GRATIS")
                {
                    Console.WriteLine($"[AssinaturaController] Plano não é válido para parceiros: {plano.Tipo}");
                    return Json(new { sucesso = false, erro = "Este plano não é válido para parceiros." });
                }

                // Verifica se o parceiro já possui uma assinatura ativa
                var assinaturasAtivas = await _repository.ListAsync(new GenericAllSpec<Assinatura>());
                var assinaturasAtivasFiltradas = assinaturasAtivas
                    .Where(a => a.IdParceiro == parceiro.Id && a.DataRenovacao > DateTime.Now)
                    .ToList();

                if (assinaturasAtivasFiltradas.Any())
                {
                    var assinaturaAtiva = assinaturasAtivasFiltradas.First();
                    Console.WriteLine($"[AssinaturaController] Parceiro já possui assinatura ativa: {assinaturaAtiva.Id}");
                    return Json(new { 
                        sucesso = false, 
                        erro = $"Você já possui uma assinatura ativa que é válida até {assinaturaAtiva.DataRenovacao:dd/MM/yyyy}. Não é possível criar uma nova assinatura.",
                        hasActiveSubscription = true,
                        activeSubscription = new
                        {
                            assinaturaAtiva.Id,
                            assinaturaAtiva.DataRenovacao
                        }
                    });
                }

                Console.WriteLine($"[AssinaturaController] Criando assinatura gratuita para parceiro: {parceiro.Id}");
                
                // Cria a assinatura gratuita para parceiros
                var assinatura = new Assinatura
                {
                    Id = Guid.NewGuid(),
                    IdParceiro = parceiro.Id,
                    IdPlano = plano.Id,
                    DataCompra = DateTime.Now,
                    DataRenovacao = DateTime.Now.AddYears(10), // Assinatura "permanente" para parceiros
                    IdPagamento = null,
                    IdCliente = null
                };

                Console.WriteLine($"[AssinaturaController] Assinatura criada: {assinatura.Id}");
                Console.WriteLine($"[AssinaturaController] Salvando no banco...");

                await _repository.AddAsync(assinatura);
                await _repository.SaveChangesAsync();

                Console.WriteLine($"[AssinaturaController] Assinatura de parceiro salva com sucesso!");

                return Json(new { 
                    sucesso = true, 
                    mensagem = "Assinatura de parceiro criada com sucesso!",
                    assinatura = new
                    {
                        assinatura.Id,
                        assinatura.DataRenovacao,
                        plano = plano.Titulo,
                        tipo = "PARCEIRO_GRATIS"
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AssinaturaController] Erro ao criar assinatura de parceiro: {ex.Message}");
                Console.WriteLine($"[AssinaturaController] Stack trace: {ex.StackTrace}");
                return Json(new { sucesso = false, erro = $"Erro interno: {ex.Message}" });
            }
        }

        [HttpGet("VerificarAssinatura/{idUsuario}")]
        public async Task<JsonResult> VerificarAssinatura(Guid idUsuario)
        {
            try
            {
                var usuario = await _usuarioRepository.FirstOrDefaultAsync(new GenericByIdSpec<Usuario>(idUsuario));
                if (usuario == null)
                {
                    return Json(new { sucesso = false, erro = "Usuário não encontrado." });
                }

                // Verifica se é parceiro
                var parceiros = await _parceiroRepository.ListAsync(new GenericAllSpec<Parceiro>());
                var parceiro = parceiros.FirstOrDefault(p => p.IdUsuario == usuario.Id);

                if (parceiro != null)
                {
                    // Verifica assinatura de parceiro
                    var assinaturasParceiro = await _repository.ListAsync(new GenericAllSpec<Assinatura>());
                    var assinaturaAtiva = assinaturasParceiro
                        .Where(a => a.IdParceiro == parceiro.Id && a.DataRenovacao > DateTime.Now)
                        .FirstOrDefault();

                    if (assinaturaAtiva != null)
                    {
                        var plano = await _planoRepository.FirstOrDefaultAsync(new GenericByIdSpec<Plano>(assinaturaAtiva.IdPlano));
                        return Json(new { 
                            sucesso = true, 
                            temAssinatura = true,
                            tipo = "PARCEIRO",
                            assinatura = new
                            {
                                assinaturaAtiva.Id,
                                assinaturaAtiva.DataRenovacao,
                                plano = plano?.Titulo,
                                tipo = plano?.Tipo
                            }
                        });
                    }
                    else
                    {
                        return Json(new { 
                            sucesso = true, 
                            temAssinatura = false,
                            tipo = "PARCEIRO",
                            mensagem = "Parceiro sem assinatura ativa"
                        });
                    }
                }
                else
                {
                    // Verifica se é cliente
                    var clientes = await _clienteRepository.ListAsync(new GenericAllSpec<Cliente>());
                    var cliente = clientes.FirstOrDefault(c => c.IdUsuario == usuario.Id);

                    if (cliente != null)
                    {
                        var assinaturasCliente = await _repository.ListAsync(new GenericAllSpec<Assinatura>());
                        var assinaturaAtiva = assinaturasCliente
                            .Where(a => a.IdCliente == cliente.Id && a.DataRenovacao > DateTime.Now)
                            .FirstOrDefault();

                        if (assinaturaAtiva != null)
                        {
                            var plano = await _planoRepository.FirstOrDefaultAsync(new GenericByIdSpec<Plano>(assinaturaAtiva.IdPlano));
                            return Json(new { 
                                sucesso = true, 
                                temAssinatura = true,
                                tipo = "CLIENTE",
                                assinatura = new
                                {
                                    assinaturaAtiva.Id,
                                    assinaturaAtiva.DataRenovacao,
                                    plano = plano?.Titulo,
                                    tipo = plano?.Tipo,
                                    valor = plano?.Valor
                                }
                            });
                        }
                        else
                        {
                            return Json(new { 
                                sucesso = true, 
                                temAssinatura = false,
                                tipo = "CLIENTE",
                                mensagem = "Cliente sem assinatura ativa"
                            });
                        }
                    }
                }

                return Json(new { sucesso = false, erro = "Tipo de usuário não identificado." });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, erro = $"Erro interno: {ex.Message}" });
            }
        }

        private async Task<dynamic> GerarLinkMercadoPago(Assinatura assinatura, Plano plano, Usuario usuario, Cliente cliente)
        {
            try
            {
                // Aqui você implementaria a integração com o Mercado Pago
                // Por enquanto, retornamos um link fictício para teste
                var link = $"https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=TEST_{assinatura.Id}";
                
                return new { sucesso = true, link = link };
            }
            catch (Exception ex)
            {
                return new { sucesso = false, erro = ex.Message };
            }
        }
    }
}
