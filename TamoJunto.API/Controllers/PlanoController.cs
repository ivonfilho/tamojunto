using Microsoft.AspNetCore.Mvc;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using TamoJunto.API.RequestModel;
using Microsoft.AspNetCore.Authorization;

namespace TamoJunto.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlanoController : ControllerBase
    {
        private readonly IRepository<Plano> _repository;
        private readonly IRepository<Parceiro> _parceiroRepository;
        private readonly IRepository<Usuario> _usuarioRepository;
        private readonly IRepository<Cliente> _clienteRepository;

        public PlanoController(IRepository<Plano> repository, IRepository<Parceiro> parceiroRepository, IRepository<Usuario> usuarioRepository, IRepository<Cliente> clienteRepository)
        {
            _repository = repository;
            _parceiroRepository = parceiroRepository;
            _usuarioRepository = usuarioRepository;
            _clienteRepository = clienteRepository;
        }

        private async Task<Usuario?> GetCurrentUser()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "Id");
            if (userIdClaim == null) return null;
            var userId = Guid.Parse(userIdClaim.Value);
            return await _usuarioRepository.GetByIdAsync(userId);
        }

        [HttpPost("Criar")]
        public async Task<IActionResult> Criar([FromBody] PlanoRequest request)
        {
            try
            {
                var plano = new Plano
                {
                    Id = Guid.NewGuid(),
                    Titulo = request.Titulo,
                    Valor = request.Valor,
                    Descricao = request.Descricao,
                    Tipo = request.Tipo,
                    Ativo = true,
                    DataCriacao = DateTime.Now
                };

                await _repository.AddAsync(plano);
                await _repository.SaveChangesAsync();

                return Ok(new { 
                    id = plano.Id,
                    titulo = plano.Titulo,
                    valor = plano.Valor,
                    descricao = plano.Descricao,
                    tipo = plano.Tipo
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro ao criar plano");
            }
        }

        [HttpGet("Listar")]
        [Authorize]
        public async Task<IActionResult> Listar()
        {
            var usuario = await GetCurrentUser();
            if (usuario == null)
                return Unauthorized();

            var parceiros = await _parceiroRepository.ListAsync(new GenericAllSpec<Parceiro>());
            var parceiro = parceiros.FirstOrDefault(p => p.IdUsuario == usuario.Id);
            var clientes = await _clienteRepository.ListAsync(new GenericAllSpec<Cliente>());
            var cliente = clientes.FirstOrDefault(c => c.IdUsuario == usuario.Id);
                var planos = await _repository.ListAsync(new GenericAllSpec<Plano>());

            if (parceiro != null)
            {
                planos = planos.Where(p => p.Tipo == "PARCEIRO_GRATIS").ToList();
            }
            else if (cliente != null)
            {
                planos = planos.Where(p => p.Tipo == "MENSAL" || p.Tipo == "ANUAL").ToList();
            }
            else
            {
                planos = planos.Where(p => p.Tipo == "FREE_TRIAL").ToList();
            }

            return Ok(planos);
        }

        [HttpGet("ListarPorTipoUsuario")]
        [Authorize]
        public async Task<IActionResult> ListarPorTipoUsuario()
        {
            try
            {
                var usuario = await GetCurrentUser();
                if (usuario == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                var parceiros = await _parceiroRepository.ListAsync(new GenericAllSpec<Parceiro>());
                var parceiro = parceiros.FirstOrDefault(p => p.IdUsuario == usuario.Id);
                var clientes = await _clienteRepository.ListAsync(new GenericAllSpec<Cliente>());
                var cliente = clientes.FirstOrDefault(c => c.IdUsuario == usuario.Id);
                var planos = await _repository.ListAsync(new GenericAllSpec<Plano>());
                var planosAtivos = planos.Where(p => p.Ativo);

                IEnumerable<Plano> planosFiltrados;
                if (parceiro != null)
                {
                    planosFiltrados = planosAtivos.Where(p => p.Tipo == "PARCEIRO_GRATIS");
                }
                else if (cliente != null)
                {
                    planosFiltrados = planosAtivos.Where(p => p.Tipo == "MENSAL" || p.Tipo == "ANUAL" || p.Tipo == "FREE_TRIAL");
                }
                else
                {
                    planosFiltrados = planosAtivos.Where(p => p.Tipo == "FREE_TRIAL");
                }

                var resultado = planosFiltrados.Select(p => new
                {
                    p.Id,
                    p.Titulo,
                    p.Valor,
                    p.Descricao,
                    p.Tipo
                });

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro ao listar planos");
            }
        }

        [HttpDelete("Excluir/{id}")]
        public async Task<IActionResult> Excluir(Guid id)
        {
            try
            {
                // Busca o plano
                var plano = await _repository.GetByIdAsync(id);
                if (plano == null)
                {
                    return NotFound("Plano não encontrado");
                }

                // Exclui o plano
                await _repository.DeleteAsync(plano);
                await _repository.SaveChangesAsync();

                return Ok(new { 
                    message = "Plano excluído com sucesso",
                    planoExcluido = new
                    {
                        plano.Id,
                        plano.Titulo,
                        plano.Valor,
                        plano.Descricao,
                        plano.Tipo
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro ao excluir plano");
            }
        }

        [HttpPut("Desativar/{id}")]
        public async Task<IActionResult> Desativar(Guid id)
        {
            try
            {
                // Busca o plano
                var plano = await _repository.GetByIdAsync(id);
                if (plano == null)
                {
                    return NotFound("Plano não encontrado");
                }

                // Desativa o plano (soft delete)
                plano.Ativo = false;
                await _repository.UpdateAsync(plano);
                await _repository.SaveChangesAsync();

                return Ok(new { 
                    message = "Plano desativado com sucesso",
                    planoDesativado = new
                    {
                        plano.Id,
                        plano.Titulo,
                        plano.Valor,
                        plano.Descricao,
                        plano.Tipo
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro ao desativar plano");
            }
        }
    }
} 