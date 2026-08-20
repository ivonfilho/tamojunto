using System.Data;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TamoJunto.API.RequestModel;
using TamoJunto.API.Utils;
using TamoJunto.API.ViewModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using TamoJunto.Infra;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Cors;
using TamoJunto.API.Services;
using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;

namespace TamoJunto.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableCors("AllowAllPolicy")] // Habilitar CORS para todas as origens
public class UsuarioController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly IRepository<Usuario> _repository;
    private readonly IRepository<Empresa> _repositoryEmpresa;
    private readonly IRepository<Cliente> _repositoryCliente;
    private readonly IRepository<Parceiro> _repositoryParceiro;
    private readonly IUsuarioService _usuarioService;
    private readonly TokenUtil _tokenUtil;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;
    private readonly IConfiguration _configuration;
    private readonly PasswordRecoveryService _passwordRecoveryService;
    private readonly ILogger<UsuarioController> _logger;
    private readonly TamoJuntoContext _db;

    public UsuarioController(IMapper mapper, IRepository<Cliente> repositoryCliente, IRepository<Empresa> repositoryEmpresa, IRepository<Usuario> repository, IRepository<Parceiro> repositoryParceiro, IUsuarioService usuarioService, TokenUtil tokenUtil, IEmailService emailService, ISmsService smsService, IConfiguration configuration, PasswordRecoveryService passwordRecoveryService, ILogger<UsuarioController> logger, TamoJuntoContext db)
    {
        _tokenUtil = tokenUtil;
        _repository = repository;
        _repositoryEmpresa = repositoryEmpresa;
        _repositoryParceiro = repositoryParceiro;
        _mapper = mapper;
        _usuarioService = usuarioService;
        _repositoryCliente = repositoryCliente;
        _emailService = emailService;
        _smsService = smsService;
        _configuration = configuration;
        _passwordRecoveryService = passwordRecoveryService;
        _logger = logger;
        _db = db;
    }

    /// <summary>
    /// Alguns bancos PostgreSQL têm colunas camelCase da migration (emailConfirmed) e colunas PascalCase do EF (EmailConfirmed).
    /// A confirmação pode atualizar só um lado; o login lê o outro e devolve 403. Esta rotina unifica no par canônico mapeado pelo EF.
    /// </summary>
    private async Task TryNormalizeUsuarioEmailConfirmationLegacyPostgresAsync(Guid usuarioId, CancellationToken cancellationToken = default)
    {
        const string npgsql = "Npgsql.EntityFrameworkCore.PostgreSQL";
        if (!string.Equals(_db.Database.ProviderName, npgsql, StringComparison.Ordinal))
            return;

        try
        {
            var conn = _db.Database.GetDbConnection();
            var openedHere = conn.State != ConnectionState.Open;
            if (openedHere)
                await _db.Database.OpenConnectionAsync(cancellationToken);

            try
            {
                await using (var check = conn.CreateCommand())
                {
                    check.CommandText = """
                        SELECT CASE WHEN
                          EXISTS (
                            SELECT 1 FROM information_schema.columns c
                            WHERE c.table_schema = 'public' AND lower(c.table_name) = 'usuario' AND c.column_name = 'emailconfirmed')
                          AND EXISTS (
                            SELECT 1 FROM information_schema.columns c
                            WHERE c.table_schema = 'public' AND lower(c.table_name) = 'usuario' AND c.column_name = 'emailconfirmationtoken')
                        THEN 1 ELSE 0 END
                        """;
                    var hasLegacy = Convert.ToInt32(await check.ExecuteScalarAsync(cancellationToken) ?? 0);
                    if (hasLegacy == 0)
                        return;
                }

                await using (var upd = conn.CreateCommand())
                {
                    upd.CommandText = """
                        UPDATE "Usuario" AS u
                        SET
                          "EmailConfirmed" = (COALESCE(u."EmailConfirmed", false) OR COALESCE(u.emailconfirmed, false)),
                          "EmailConfirmationToken" = CASE
                            WHEN (COALESCE(u."EmailConfirmed", false) OR COALESCE(u.emailconfirmed, false)) THEN NULL
                            ELSE COALESCE(u."EmailConfirmationToken", u.emailconfirmationtoken)
                          END,
                          emailconfirmed = (COALESCE(u."EmailConfirmed", false) OR COALESCE(u.emailconfirmed, false)),
                          emailconfirmationtoken = CASE
                            WHEN (COALESCE(u."EmailConfirmed", false) OR COALESCE(u.emailconfirmed, false)) THEN NULL
                            ELSE COALESCE(u."EmailConfirmationToken", u.emailconfirmationtoken)
                          END
                        WHERE u."Id" = @id
                        """;
                    var p = upd.CreateParameter();
                    p.ParameterName = "id";
                    p.Value = usuarioId;
                    upd.Parameters.Add(p);
                    await upd.ExecuteNonQueryAsync(cancellationToken);
                }
            }
            finally
            {
                if (openedHere)
                    await _db.Database.CloseConnectionAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao normalizar colunas legadas de confirmação de e-mail para usuário {UserId}", usuarioId);
        }
    }

    /// <summary>
    /// Aplica confirmação de e-mail (persistência). Usado pelo POST e pelo GET do link do e-mail.
    /// </summary>
    private async Task<(Usuario? usuario, string? errorMessage)> TryApplyEmailConfirmationAsync(string? tokenRaw, CancellationToken cancellationToken = default)
    {
        var tokenNormalizado = (tokenRaw ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(tokenNormalizado))
            return (null, "Token é obrigatório");

        var usuario = await _repository.FirstOrDefaultAsync(
            new UsuarioByEmailConfirmationTokenSpec(tokenNormalizado),
            cancellationToken);

        if (usuario == null)
            return (null, "Token inválido ou expirado");

        usuario.EmailConfirmed = true;
        usuario.EmailConfirmationToken = null;

        await _repository.UpdateAsync(usuario);
        await _repository.SaveChangesAsync();

        await TryNormalizeUsuarioEmailConfirmationLegacyPostgresAsync(usuario.Id, cancellationToken);

        return (usuario, null);
    }

    [HttpPost("cadastrar")]
    [AllowAnonymous]
    public async Task<ActionResult<dynamic>> Criar([FromBody] UsuarioRequest requestModel)
    {
        // Log para debug
        Console.WriteLine($"Dados recebidos: {System.Text.Json.JsonSerializer.Serialize(requestModel)}");

        if (requestModel == null)
        {
            return BadRequest(new { message = "Dados do usuário não fornecidos" });
        }

        if (string.IsNullOrEmpty(requestModel.Email) || string.IsNullOrEmpty(requestModel.Senha) || string.IsNullOrEmpty(requestModel.Nome))
        {
            return BadRequest(new { message = "Email, senha e nome são obrigatórios" });
        }

        requestModel.Email = requestModel.Email.Trim();

        var usuarioTask = _usuarioService.ListarPorEmail(requestModel.Email);
        var usuario = usuarioTask.Result;

        if (!string.IsNullOrEmpty(usuario?.Email))
        {
            return BadRequest(new { message = "Usuário já cadastrado com email informado! " });
        }

        var usuarioModel = new Usuario
        {
            Id = Guid.NewGuid(),
            Role = requestModel.TipoCadastro == "PJ" ? TamoJunto.Domain.Models.UserRole.Parceiro : TamoJunto.Domain.Models.UserRole.Cliente
        };
        usuarioModel.Nome = requestModel.Nome;
        usuarioModel.Email = requestModel.Email;
        usuarioModel.Senha = SegurancaUtil.SHA1Hash(requestModel.Senha);
        usuarioModel.DataCadastro = DateTime.Now;
        // usuarioModel.Contato = requestModel.Contato;
        usuarioModel.EmailConfirmed = false;
        usuarioModel.EmailConfirmationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        await _repository.AddAsync(usuarioModel);
        await _repository.SaveChangesAsync();

        if (requestModel.TipoCadastro == "PJ")
        {
            if (string.IsNullOrEmpty(requestModel.CNPJ) || string.IsNullOrEmpty(requestModel.NomeEmpresa) || string.IsNullOrEmpty(requestModel.Atividade))
            {
                return BadRequest(new { message = "Para cadastro PJ, CNPJ, nome da empresa e atividade são obrigatórios" });
            }

            // Validação adicional: Verificar se o CNPJ é válido para Parceiro
            // Esta validação deve ser feita no frontend, mas mantemos aqui como backup
            Console.WriteLine($"[UsuarioController] Cadastrando Parceiro (PJ) para: {requestModel.Email}");

            var empresa = new Empresa
            {
                Id = Guid.NewGuid(),
                Cnpj = requestModel.CNPJ.Replace(".", "").Replace("-", ""),
                Nome = requestModel.NomeEmpresa,
                Atividade = requestModel.Atividade
            };
            await _repositoryEmpresa.AddAsync(empresa);
            await _repositoryEmpresa.SaveChangesAsync();

            var parceiro = new Parceiro
            {
                Id = Guid.NewGuid(),
                IdUsuario = usuarioModel.Id,
                IdEmpresa = empresa.Id,
                Nome = requestModel.Nome,
                Website = requestModel.Website ?? string.Empty,
                // Contato = requestModel.Contato ?? string.Empty,
                DataCriacao = DateTime.Now,
                Status = true
            };
            await _repositoryParceiro.AddAsync(parceiro);
            await _repositoryParceiro.SaveChangesAsync();
        }
        else if (requestModel.TipoCadastro == "MEI")
        {
            Console.WriteLine($"[UsuarioController] Iniciando cadastro MEI para: {requestModel.Email}");
            
            if (string.IsNullOrEmpty(requestModel.CNPJ) || string.IsNullOrEmpty(requestModel.NomeEmpresa) /* || string.IsNullOrEmpty(requestModel.Contato) */)
            {
                Console.WriteLine($"[UsuarioController] Validação falhou para MEI: CNPJ={requestModel.CNPJ}, NomeEmpresa={requestModel.NomeEmpresa}");
                return BadRequest(new { message = "Para cadastro MEI, CNPJ, e nome da empresa são obrigatórios" });
            }

            Console.WriteLine($"[UsuarioController] Criando empresa para MEI: {requestModel.NomeEmpresa}");
            
            var empresa = new Empresa
            {
                Id = Guid.NewGuid(),
                Cnpj = requestModel.CNPJ.Replace(".", "").Replace("-", ""),
                Nome = requestModel.NomeEmpresa,
                Atividade = "MEI - Microempreendedor Individual"
            };
            
            Console.WriteLine($"[UsuarioController] Empresa criada com ID: {empresa.Id}");
            Console.WriteLine($"[UsuarioController] Salvando empresa no banco...");
            
            try
            {
                await _repositoryEmpresa.AddAsync(empresa);
                await _repositoryEmpresa.SaveChangesAsync();
                Console.WriteLine($"[UsuarioController] Empresa salva com sucesso!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UsuarioController] Erro ao salvar empresa: {ex.Message}");
                Console.WriteLine($"[UsuarioController] Stack trace: {ex.StackTrace}");
                return BadRequest(new { message = $"Erro ao criar empresa: {ex.Message}" });
            }

            Console.WriteLine($"[UsuarioController] Criando cliente para MEI...");
            
            var cliente = new Cliente
            {
                Id = Guid.NewGuid(),
                Cpf = null, // MEI não tem CPF individual
                IdUsuario = usuarioModel.Id,
                IdEmpresa = empresa.Id
            };
            
            Console.WriteLine($"[UsuarioController] Cliente criado com ID: {cliente.Id}");
            Console.WriteLine($"[UsuarioController] Salvando cliente no banco...");
            
            try
            {
                await _repositoryCliente.AddAsync(cliente);
                await _repositoryCliente.SaveChangesAsync();
                Console.WriteLine($"[UsuarioController] Cliente salvo com sucesso!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UsuarioController] Erro ao salvar cliente: {ex.Message}");
                Console.WriteLine($"[UsuarioController] Stack trace: {ex.StackTrace}");
                return BadRequest(new { message = $"Erro ao criar cliente: {ex.Message}" });
            }
            
            Console.WriteLine($"[UsuarioController] Cadastro MEI concluído com sucesso!");
        }
        else
        {
            if (string.IsNullOrEmpty(requestModel.CPF))
            {
                return BadRequest(new { message = "CPF é obrigatório para cadastro PF" });
            }

            var cliente = new Cliente
            {
                Id = Guid.NewGuid(),
                Cpf = requestModel.CPF?.Replace(".", "").Replace("-", "") ?? string.Empty,
                IdUsuario = usuarioModel.Id,
            };
            await _repositoryCliente.AddAsync(cliente);
            await _repositoryCliente.SaveChangesAsync();
        }

        var emailConfirmacaoEnviado = await _emailService.EnviarEmailConfirmacao(
            usuarioModel.Email,
            usuarioModel.Nome,
            usuarioModel.EmailConfirmationToken!);

        if (!emailConfirmacaoEnviado)
        {
            _logger.LogWarning(
                "Cadastro concluído mas falha ao enviar e-mail de confirmação para {Email}",
                usuarioModel.Email);
        }

        return Ok(new
        {
            message = "Usuário cadastrado com sucesso! Confirme seu e-mail pelo link que enviamos para ativar o acesso.",
            emailConfirmacaoEnviado
        });
    }

    [HttpPost("Entrar")]
    [AllowAnonymous]
    public async Task<ActionResult<UsuarioVm>> Entrar([FromBody] UsuarioLoginRequest model)
    {
        var emailLogin = (model.Email ?? string.Empty).Trim();
        var usuario = await _usuarioService.Login(emailLogin, SegurancaUtil.SHA1Hash(model.Senha));

        if (string.IsNullOrEmpty(usuario?.Email))
        {
            return Unauthorized(new { message = "Email ou senha incorretos!" });
        }

        // Postgres: unifica EmailConfirmed (Pascal) com colunas legadas camelCase da migration, se existirem.
        await TryNormalizeUsuarioEmailConfirmationLegacyPostgresAsync(usuario.Id, HttpContext.RequestAborted);
        usuario = await _usuarioService.Login(emailLogin, SegurancaUtil.SHA1Hash(model.Senha));
        if (string.IsNullOrEmpty(usuario?.Email))
        {
            return Unauthorized(new { message = "Email ou senha incorretos!" });
        }

        // Contas novas: exige confirmação de e-mail. Contas antigas (sem token pendente) continuam com acesso.
        /* if (!usuario.EmailConfirmed && !string.IsNullOrEmpty(usuario.EmailConfirmationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Confirme seu e-mail para acessar. Abra o link que enviamos no cadastro ou use \"Reenviar e-mail de confirmação\" na tela de login."
            });
        } */

        var token = _tokenUtil.GenerateToken(usuario, model.LembrarMe);

        return new UsuarioVm()
        {
            Nome = usuario?.Nome,
            Email = usuario?.Email,
            ImagemUrl = usuario?.UrlImagem,
            Token = token,
            Role = usuario?.Role.ToString()
        };
    }

    [HttpPut("alterar")]
    [Authorize]
    public async Task<ActionResult<dynamic>> Alterar([FromBody] UsuarioRequest requestModel)
    {
        try
        {
            var authorizationHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
            {
                return Unauthorized(new { message = "Usuário não autenticado!" });
            }

            var token = authorizationHeader.Substring("Bearer ".Length).Trim();
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

            var usuarioIdStr = jwtToken?.Claims.FirstOrDefault(c => c.Type == "Id")?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !Guid.TryParse(usuarioIdStr, out var usuarioId))
            {
                return BadRequest(new { message = "ID do usuário inválido!" });
            }

            // Validar dados obrigatórios
            if (string.IsNullOrEmpty(requestModel.Nome) || string.IsNullOrEmpty(requestModel.Email))
            {
                return BadRequest(new { message = "Nome e email são obrigatórios!" });
            }

            var usuario = await _repository.GetByIdAsync(usuarioId);
            if (usuario == null)
            {
                return NotFound(new { message = "Usuário não encontrado!" });
            }

            // Atualizar dados do usuário
            usuario.Nome = requestModel.Nome;
            usuario.Email = requestModel.Email;
            
            // Só atualizar senha se for fornecida
            if (!string.IsNullOrEmpty(requestModel.Senha))
            {
                usuario.Senha = SegurancaUtil.SHA1Hash(requestModel.Senha);
            }
            
            usuario.UrlImagem = requestModel.UrlImagem;

            string tipoCadastroOriginal = "PF";

            // Verifica se é parceiro ou cliente
            if (usuario.Role == TamoJunto.Domain.Models.UserRole.Parceiro)
            {
                // Busca dados do parceiro
                var parceiroSpec = new GenericByUsuarioSpec<Parceiro>(usuario.Id);
                var parceiro = await _repositoryParceiro.FirstOrDefaultAsync(parceiroSpec);

                if (parceiro == null)
                {
                    return NotFound(new { message = "Parceiro não encontrado!" });
                }

                var empresa = await _repositoryEmpresa.GetByIdAsync(parceiro.IdEmpresa);
                if (empresa == null)
                {
                    return NotFound(new { message = "Empresa do parceiro não encontrada!" });
                }

                tipoCadastroOriginal = "PJ";

                // Validar tipo de cadastro
                if (requestModel.TipoCadastro != tipoCadastroOriginal)
                {
                    return BadRequest(new { message = "Não é permitido alterar o tipo de cadastro." });
                }

                // Validar campos obrigatórios para PJ
                if (string.IsNullOrEmpty(requestModel.NomeEmpresa) || string.IsNullOrEmpty(requestModel.Atividade))
                {
                    return BadRequest(new { message = "Nome da empresa e atividade são obrigatórios para PJ!" });
                }

                // Atualizar dados da empresa
                empresa.Nome = requestModel.NomeEmpresa;
                empresa.Atividade = requestModel.Atividade;
                await _repositoryEmpresa.UpdateAsync(empresa);
                await _repositoryEmpresa.SaveChangesAsync();

                // Atualizar dados do parceiro (contato e website)
                //if (!string.IsNullOrEmpty(requestModel.Contato))
                //{
                //    parceiro.Contato = requestModel.Contato;
                //}
                if (!string.IsNullOrEmpty(requestModel.Website))
                {
                    parceiro.Website = requestModel.Website;
                }
                await _repositoryParceiro.UpdateAsync(parceiro);
                await _repositoryParceiro.SaveChangesAsync();
            }
            else
            {
                // Busca dados do cliente
                var clienteSpec = new ClientePorIdUsuarioSpec(usuario.Id);
                var cliente = await _repositoryCliente.FirstOrDefaultAsync(clienteSpec);
                
                if (cliente == null)
                {
                    return NotFound(new { message = "Cliente não encontrado!" });
                }

                // Verificar se o tipo de cadastro mudou
                // MEI e PJ ambos têm IdEmpresa, então verificamos se tem empresa
                tipoCadastroOriginal = cliente.IdEmpresa.HasValue ? (requestModel.TipoCadastro == "MEI" ? "MEI" : "PJ") : "PF";
                
                // Validar que o tipo não pode mudar de forma inconsistente
                if (cliente.IdEmpresa.HasValue && requestModel.TipoCadastro == "PF")
                {
                    return BadRequest(new { message = "Não é permitido alterar o tipo de cadastro de PJ/MEI para PF." });
                }
                if (!cliente.IdEmpresa.HasValue && (requestModel.TipoCadastro == "PJ" || requestModel.TipoCadastro == "MEI"))
                {
                    return BadRequest(new { message = "Não é permitido alterar o tipo de cadastro de PF para PJ/MEI." });
                }

                // Atualizar dados específicos baseado no tipo de cadastro (MEI ou PJ)
                if (tipoCadastroOriginal == "PJ" || tipoCadastroOriginal == "MEI")
                {
                    if (cliente.IdEmpresa.HasValue)
                    {
                        var empresa = await _repositoryEmpresa.GetByIdAsync(cliente.IdEmpresa.Value);
                        if (empresa != null)
                        {
                            // Para PJ, validar campos obrigatórios
                            if (tipoCadastroOriginal == "PJ")
                            {
                                if (string.IsNullOrEmpty(requestModel.NomeEmpresa) || string.IsNullOrEmpty(requestModel.Atividade))
                                {
                                    return BadRequest(new { message = "Nome da empresa e atividade são obrigatórios para PJ!" });
                                }
                                empresa.Atividade = requestModel.Atividade;
                            }
                            else if (tipoCadastroOriginal == "MEI")
                            {
                                // Para MEI, validar apenas nome da empresa
                                if (string.IsNullOrEmpty(requestModel.NomeEmpresa))
                                {
                                    return BadRequest(new { message = "Nome da empresa é obrigatório para MEI!" });
                                }
                            }

                            empresa.Nome = requestModel.NomeEmpresa;
                            await _repositoryEmpresa.UpdateAsync(empresa);
                            await _repositoryEmpresa.SaveChangesAsync();
                        }
                }
            }

            //if (requestModel.Contato != null)
            //{
            //    usuario.Contato = requestModel.Contato;
            //}
                // Para PF, não precisamos fazer alterações específicas além do usuário
            }

            // Salvar alterações do usuário
            await _repository.UpdateAsync(usuario);
            await _repository.SaveChangesAsync();

            // Retornar dados atualizados
            var usuarioAtualizado = new
            {
                message = "Usuário atualizado com sucesso!",
                usuario = new
                {
                    id = usuario.Id,
                    nome = usuario.Nome,
                    email = usuario.Email,
                    tipoCadastro = tipoCadastroOriginal
                }
            };

            return Ok(usuarioAtualizado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao alterar usuário: {Message}", ex.Message);
            return StatusCode(500, new { message = "Erro interno do servidor ao processar a alteração." });
        }
    }


    
    [HttpGet("Perfil")]
    [Authorize]
    public async Task<ActionResult<UsuarioVm>> GetUsuario()
    {
        var authorizationHeader = Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
        {
            return Unauthorized(new { message = "Usuário não autenticado!" });
        }

        var token = authorizationHeader.Substring("Bearer ".Length).Trim();
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

        var usuarioIdStr = jwtToken?.Claims.FirstOrDefault(c => c.Type == "Id")?.Value;
        if (string.IsNullOrEmpty(usuarioIdStr) || !Guid.TryParse(usuarioIdStr, out var usuarioId))
        {
            return BadRequest(new { message = "ID do usuário inválido!" });
        }

        var usuario = await _repository.GetByIdAsync(usuarioId);
        if (usuario == null)
        {
            return NotFound(new { message = "Usuário não encontrado!" });
        }

        // Verifica se é parceiro ou cliente
        if (usuario.Role == TamoJunto.Domain.Models.UserRole.Parceiro)
        {
            // Busca dados do parceiro
            var parceiroSpec = new GenericByUsuarioSpec<Parceiro>(usuario.Id);
            var parceiro = await _repositoryParceiro.FirstOrDefaultAsync(parceiroSpec);

            if (parceiro == null)
            {
                return NotFound(new { message = "Parceiro não encontrado!" });
            }

            var empresa = await _repositoryEmpresa.GetByIdAsync(parceiro.IdEmpresa);
            if (empresa == null)
            {
                return NotFound(new { message = "Empresa do parceiro não encontrada!" });
            }

            var usuarioVm = new UsuarioVm()
            {
                Nome = usuario.Nome,
                Email = usuario.Email,
                ImagemUrl = usuario.UrlImagem,
            };

            return Ok(new
            {
                Usuario = usuarioVm,
                TipoCadastro = "PJ",
                Role = "Parceiro",
                Parceiro = new
                {
                    Id = parceiro.Id,
                    Nome = parceiro.Nome,
                    Website = parceiro.Website,
                    Contato = parceiro.Contato
                },
                Empresa = new
                {
                    Nome = empresa.Nome,
                    Cnpj = empresa.Cnpj,
                    Atividade = empresa.Atividade
                }
            });
        }
        else
        {
            // Busca dados do cliente
        var clienteSpec = new ClientePorIdUsuarioSpec(usuario.Id);
        var cliente = await _repositoryCliente.FirstOrDefaultAsync(clienteSpec);

        if (cliente == null)
        {
            return NotFound(new { message = "Cliente não encontrado!" });
        }

        var cpfCliente = cliente.Cpf;  
        var assinaturasCliente = cliente.Assinatura;  
        // Cliente com IdEmpresa = MEI (só MEI cria Cliente+Empresa); sem empresa = PF
        var tipoCadastro = cliente.IdEmpresa.HasValue ? "MEI" : "PF";

        var usuarioVm = new UsuarioVm()
        {
            Nome = usuario.Nome,
            Email = usuario.Email,
            ImagemUrl = usuario.UrlImagem,
        };

        if (cliente.IdEmpresa.HasValue)
        {
            var empresa = await _repositoryEmpresa.GetByIdAsync(cliente.IdEmpresa.Value);
            if (empresa != null)
            {
                return Ok(new
                {
                    Usuario = usuarioVm,
                    Cpf = cpfCliente, 
                    // Contato = usuario.Contato,
                    TipoCadastro = tipoCadastro,  
                        Role = "Cliente",
                    Assinaturas = assinaturasCliente.Select(a => new { a.Id }),  
                    Empresa = new
                    {
                        Nome = empresa.Nome,
                        Cnpj = empresa.Cnpj,
                        Atividade = empresa.Atividade
                    }
                });
            }
        }
    
        return Ok(new
        {
            Usuario = usuarioVm,
            Cpf = cpfCliente, 
            // Contato = usuario.Contato,
            TipoCadastro = tipoCadastro,  
                Role = "Cliente",
            Assinaturas = assinaturasCliente.Select(a => new { a.Id }) 
        });
        }
    }



    [HttpPost("confirmar-senha")]
    [AllowAnonymous]
    public async Task<ActionResult<dynamic>> ConfirmarSenha([FromBody] ConfirmarSenhaRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NovaSenha))
            {
                return BadRequest(new { message = "Token e nova senha são obrigatórios" });
            }

            if (request.NovaSenha.Length < 6)
            {
                return BadRequest(new { message = "A senha deve ter pelo menos 6 caracteres" });
            }

            var usuarios = await _repository.ListAsync();
            var usuario = usuarios.FirstOrDefault(u => 
                u.ResetPasswordToken == request.Token && 
                u.ResetPasswordTokenExpiry > DateTime.UtcNow);

            if (usuario == null)
            {
                return BadRequest(new { message = "Token inválido ou expirado" });
            }

            // Atualizar senha
            usuario.Senha = SegurancaUtil.SHA1Hash(request.NovaSenha);
            usuario.ResetPasswordToken = null;
            usuario.ResetPasswordTokenExpiry = null;
            usuario.EmailConfirmed = true; // Confirmar email ao redefinir senha

            await _repository.UpdateAsync(usuario);
            await _repository.SaveChangesAsync();

            await TryNormalizeUsuarioEmailConfirmationLegacyPostgresAsync(usuario.Id, HttpContext.RequestAborted);

            return Ok(new { message = "Senha redefinida com sucesso!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erro interno do servidor. Tente novamente mais tarde." });
        }
    }

    [HttpPost("confirmar-email")]
    [AllowAnonymous]
    public async Task<ActionResult<dynamic>> ConfirmarEmail([FromBody] ConfirmarSenhaRequest request)
    {
        try
        {
            var (usuario, err) = await TryApplyEmailConfirmationAsync(request?.Token, HttpContext.RequestAborted);
            if (err != null)
                return BadRequest(new { message = err });

            var token = _tokenUtil.GenerateToken(usuario!);

            return Ok(new
            {
                message = "Email confirmado com sucesso!",
                token,
                nome = usuario!.Nome,
                email = usuario.Email,
                imagemUrl = usuario.UrlImagem,
                role = usuario.Role.ToString()
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erro interno do servidor. Tente novamente mais tarde." });
        }
    }

    /// <summary>
    /// Aberto pelo link do e-mail (navegador). Confirma no servidor e redireciona para o front — evita
    /// bloqueio quando o app no e-mail usa outro apiUrl que o da API real.
    /// </summary>
    [HttpGet("confirmar-email-link")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmarEmailLink([FromQuery] string? token)
    {
        try
        {
            var fe = (_configuration["FRONTEND_URL"] ?? "https://app.tamojunto.net").TrimEnd('/');
            var (usuario, err) = await TryApplyEmailConfirmationAsync(token, HttpContext.RequestAborted);
            if (err != null)
            {
                _logger.LogWarning("Confirmação via link falhou: {Erro}", err);
                var q = err.Contains("obrigatório", StringComparison.OrdinalIgnoreCase) ? "missing" : "invalid";
                return Redirect($"{fe}/#/?confirmEmail={Uri.EscapeDataString(q)}");
            }

            _logger.LogInformation("E-mail confirmado via link para usuário {UserId}", usuario!.Id);
            return Redirect($"{fe}/#/?confirmEmail={Uri.EscapeDataString("ok")}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar confirmar-email-link");
            var fe = (_configuration["FRONTEND_URL"] ?? "https://app.tamojunto.net").TrimEnd('/');
            return Redirect($"{fe}/#/?confirmEmail={Uri.EscapeDataString("error")}");
        }
    }

    /// <summary>
    /// Reenvia o link de confirmação para contas com e-mail ainda não confirmado (resposta genérica por segurança).
    /// </summary>
    [HttpPost("reenviar-confirmacao-email")]
    [AllowAnonymous]
    public async Task<ActionResult<dynamic>> ReenviarConfirmacaoEmail([FromBody] RecuperarSenhaEmailRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        const string mensagemGenerica =
            "Se o e-mail estiver cadastrado e pendente de confirmação, enviaremos um novo link.";

        var emailSolicitado = (request.Email ?? string.Empty).Trim();
        var usuario = await _repository.FirstOrDefaultAsync(new UsuarioEmailSpec(emailSolicitado));

        if (usuario == null || usuario.EmailConfirmed || string.IsNullOrEmpty(usuario.EmailConfirmationToken))
            return Ok(new { message = mensagemGenerica });

        var enviado = await _emailService.EnviarEmailConfirmacao(
            usuario.Email,
            usuario.Nome,
            usuario.EmailConfirmationToken);

        if (!enviado)
        {
            _logger.LogWarning("Falha ao reenviar e-mail de confirmação para {Email}", usuario.Email);
        }

        return Ok(new { message = mensagemGenerica });
    }

    /// <summary>
    /// Diagnóstico do estado de confirmação de e-mail para suporte operacional.
    /// NÃO expõe token completo; retorna apenas metadados e um preview mascarado.
    /// </summary>
    [HttpPost("diagnostico-confirmacao-email")]
    [AllowAnonymous]
    public async Task<ActionResult<dynamic>> DiagnosticoConfirmacaoEmail([FromBody] RecuperarSenhaEmailRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var email = (request.Email ?? string.Empty).Trim();
        var usuario = await _repository.FirstOrDefaultAsync(new UsuarioEmailSpec(email));

        if (usuario == null)
        {
            return NotFound(new
            {
                message = "Usuário não encontrado para o e-mail informado."
            });
        }

        var token = usuario.EmailConfirmationToken;
        var hasToken = !string.IsNullOrEmpty(token);
        var tokenPreview = hasToken
            ? $"{token!.Substring(0, Math.Min(8, token.Length))}...{token.Substring(Math.Max(0, token.Length - 6))}"
            : null;

        var frontendUrl = (_configuration["FRONTEND_URL"] ?? "https://app.tamojunto.net").TrimEnd('/');
        var publicApi = _configuration["PUBLIC_API_URL"]?.Trim().TrimEnd('/');
        if (string.IsNullOrEmpty(publicApi))
        {
            var railwayPublicDomain = _configuration["RAILWAY_PUBLIC_DOMAIN"]?.Trim();
            if (!string.IsNullOrEmpty(railwayPublicDomain))
                publicApi = $"https://{railwayPublicDomain.TrimEnd('/')}";
        }

        var apiLink = hasToken
            ? (!string.IsNullOrEmpty(publicApi)
                ? $"{publicApi}/api/usuario/confirmar-email-link?token={Uri.EscapeDataString(token!)}"
                : null)
            : null;

        var frontLink = hasToken
            ? $"{frontendUrl}/#/confirmar-email?token={Uri.EscapeDataString(token!)}"
            : null;

        return Ok(new
        {
            email = usuario.Email,
            emailConfirmed = usuario.EmailConfirmed,
            hasConfirmationToken = hasToken,
            tokenPreview,
            dataCadastro = usuario.DataCadastro,
            apiConfirmationLink = apiLink,
            frontendConfirmationLink = frontLink,
            publicApiUrlConfigurada = publicApi,
            frontendUrlConfigurada = frontendUrl
        });
    }

    [HttpPost("recuperar-senha-email")]
    [AllowAnonymous]
    public async Task<ActionResult<dynamic>> RecuperarSenhaEmail([FromBody] RecuperarSenhaEmailRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var emailBuscado = (request.Email ?? "").Trim();
            var usuarios = await _repository.ListAsync(new GenericAllSpec<Usuario>());
            var usuario = usuarios.FirstOrDefault(u => string.Equals(u.Email, emailBuscado, StringComparison.OrdinalIgnoreCase));

            if (usuario == null)
            {
                return BadRequest(new { message = "Email não encontrado em nossa base de dados" });
            }

            // Gerar nova senha temporária
            var novaSenha = _passwordRecoveryService.GenerateSecurePassword(12);
            var senhaHash = _passwordRecoveryService.HashPassword(novaSenha);

            // Atualizar senha do usuário
            usuario.Senha = senhaHash;
            await _repository.UpdateAsync(usuario);

            // Enviar email com nova senha
            var emailEnviado = await _passwordRecoveryService.SendPasswordRecoveryEmail(
                usuario.Email, 
                novaSenha, 
                usuario.Nome
            );

            if (emailEnviado)
            {
                _logger.LogInformation("Senha recuperada com sucesso para {Email}", request.Email);
                return Ok(new { 
                    message = "Nova senha enviada por email com sucesso!",
                    success = true
                });
            }
            else
            {
                // Se falhou o email, fornecer link direto
                var resetLink = $"{_configuration["FRONTEND_URL"]}/reset-password?token={Guid.NewGuid()}";
                
                _logger.LogWarning("Falha ao enviar email para {Email}, fornecendo link direto", request.Email);
                return Ok(new { 
                    message = "Falha ao enviar email. Use este link para redefinir sua senha:",
                    resetLink = resetLink,
                    success = false
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao recuperar senha por email para {Email}", request.Email);
            return BadRequest(new { message = "Erro interno do servidor" });
        }
    }
}