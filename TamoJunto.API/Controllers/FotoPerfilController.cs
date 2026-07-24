using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using System.ComponentModel.DataAnnotations;
using TamoJunto.API.Dtos;
using Microsoft.EntityFrameworkCore;

namespace TamoJunto.API.Controllers;

    [Route("api/[controller]")]
public class FotoPerfilController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<Imagem> _repository;
    private readonly IRepository<Usuario> _repositoryUsuario;
    private readonly TamoJuntoContext _context;

    private readonly string _imagemDiretorio = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagens");

    public FotoPerfilController(IMapper mapper, IRepository<Imagem> repository,  IRepository<Usuario> repositoryUsuario, TamoJuntoContext context)
    {
        _repository = repository;
        _repositoryUsuario = repositoryUsuario;
        _mapper = mapper;
        _context = context;
    }

    [HttpDelete("Deletar")]
    public async Task<IActionResult> Deletar(Guid usuarioId)
    {
        try
        {
            var usuario = await _repositoryUsuario.GetByIdAsync(usuarioId);
            if (usuario == null)
            {
                return NotFound(new { message = "Usuário não encontrado!" });
            }

            // Se o usuário não tem imagem, retornar sucesso
            if (string.IsNullOrEmpty(usuario.UrlImagem))
            {
                return Ok(new { message = "Usuário não possui foto de perfil.", success = true });
            }

            // Se a imagem está em formato base64 (data URL), não precisa deletar arquivo físico
            // Apenas limpar o campo UrlImagem do usuário
            var imageUrl = usuario.UrlImagem;
            
            // Se for formato antigo (/uploads/), tentar deletar arquivo físico (compatibilidade)
            if (!string.IsNullOrEmpty(imageUrl) && imageUrl.StartsWith("/uploads/"))
            {
                var fileName = imageUrl.Replace("/uploads/", "");
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads", fileName);
                
                if (System.IO.File.Exists(filePath))
                {
                    try
                    {
                        System.IO.File.Delete(filePath);
                        Console.WriteLine($"Arquivo físico deletado: {filePath}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erro ao deletar arquivo físico: {ex.Message}");
                        // Continuar mesmo se não conseguir deletar o arquivo físico
                    }
                }
            }

            // Limpar a URL da imagem do usuário (funciona tanto para base64 quanto para /uploads/)
            usuario.UrlImagem = null;
            await _repositoryUsuario.UpdateAsync(usuario);
            await _repositoryUsuario.SaveChangesAsync();

            Console.WriteLine($"Foto de perfil removida com sucesso para usuário {usuarioId}");
            return Ok(new { message = "Foto de perfil removida com sucesso!", success = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao deletar foto de perfil: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { message = "Erro ao remover foto de perfil.", success = false });
        }
    }

   [HttpGet("RecuperarImagemPerfil")]
public async Task<JsonResult> RecuperarImagemPerfil(Guid usuarioId)
{
    try
    {
        var usuario = await _repositoryUsuario.GetByIdAsync(usuarioId);
        if (usuario == null)
        {
            return Json(new { imagemUrl = "" });
        }

        // Retornar a URL da imagem do usuário
        var imageUrl = usuario.UrlImagem ?? "";
        
        // Se a URL começar com /uploads, construir a URL completa
        if (!string.IsNullOrEmpty(imageUrl) && imageUrl.StartsWith("/uploads"))
        {
            // Em produção, a URL deve ser relativa ou absoluta dependendo da configuração
            // Por enquanto, retornamos como está salvo no banco
        }

        return Json(new { imagemUrl = imageUrl });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro ao recuperar imagem de perfil: {ex.Message}");
        return Json(new { imagemUrl = "" });
    }
}


    [HttpPost("{id}/UploadImagem")]
        public async Task<IActionResult> UploadImagem(Guid id, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("Nenhuma imagem foi enviada.");

                var usuario = await _repositoryUsuario.GetByIdAsync(id);
                if (usuario == null)
                    return NotFound("Usuário não encontrado.");

                Console.WriteLine($"=== UPLOAD DE FOTO DE PERFIL INICIADO ===");
                Console.WriteLine($"Usuário ID: {id}");
                Console.WriteLine($"Arquivo recebido: {file.FileName}, Tamanho: {file.Length}, ContentType: {file.ContentType}");

                // Converter imagem para base64 (igual às ofertas)
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();
                var base64String = Convert.ToBase64String(fileBytes);
                var dataUrl = $"data:{file.ContentType};base64,{base64String}";

                Console.WriteLine($"Imagem convertida para base64. Tamanho do base64: {base64String.Length}");

                // Criar registro de imagem no banco (opcional, para manter consistência)
                var imagem = new Imagem
                {
                    Id = Guid.NewGuid(),
                    Path = dataUrl
                };

                await _repository.AddAsync(imagem);
                await _repository.SaveChangesAsync();

                // Salvar data URL no campo UrlImagem do usuário (igual às ofertas)
                Console.WriteLine($"Antes de salvar - UrlImagem atual: {usuario.UrlImagem ?? "NULL"}");
                Console.WriteLine($"Tamanho do dataUrl a ser salvo: {dataUrl.Length} caracteres");
                
                // Usar o contexto diretamente para garantir que a atualização seja salva
                var usuarioNoContexto = await _context.Usuario.FindAsync(id);
                if (usuarioNoContexto == null)
                {
                    Console.WriteLine($"ERRO: Usuário não encontrado no contexto!");
                    return NotFound("Usuário não encontrado.");
                }
                
                usuarioNoContexto.UrlImagem = dataUrl;
                Console.WriteLine($"Após atribuir no contexto - UrlImagem: {(usuarioNoContexto.UrlImagem != null ? usuarioNoContexto.UrlImagem.Substring(0, Math.Min(50, usuarioNoContexto.UrlImagem.Length)) : "NULL")}...");
                
                // Marcar como modificado explicitamente
                _context.Entry(usuarioNoContexto).Property(u => u.UrlImagem).IsModified = true;
                
                var rowsAffected = await _context.SaveChangesAsync();
                Console.WriteLine($"SaveChangesAsync retornou: {rowsAffected} linhas afetadas");
                
                // Verificar se foi salvo corretamente
                var usuarioVerificado = await _repositoryUsuario.GetByIdAsync(id);
                if (usuarioVerificado != null)
                {
                    Console.WriteLine($"Verificação pós-salvamento - UrlImagem salva: {!string.IsNullOrEmpty(usuarioVerificado.UrlImagem)}");
                    Console.WriteLine($"Tamanho da UrlImagem salva: {usuarioVerificado.UrlImagem?.Length ?? 0} caracteres");
                    if (!string.IsNullOrEmpty(usuarioVerificado.UrlImagem))
                    {
                        Console.WriteLine($"Primeiros 50 caracteres: {usuarioVerificado.UrlImagem.Substring(0, Math.Min(50, usuarioVerificado.UrlImagem.Length))}...");
                    }
                    else
                    {
                        Console.WriteLine($"ERRO: UrlImagem está NULL após salvamento!");
                    }
                }
                else
                {
                    Console.WriteLine($"ERRO: Usuário não encontrado após salvamento!");
                }

                Console.WriteLine($"=== UPLOAD DE FOTO DE PERFIL CONCLUÍDO COM SUCESSO ===");

                return Ok(new { message = "Imagem enviada com sucesso!", imageUrl = dataUrl });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== ERRO NO UPLOAD DE FOTO DE PERFIL ===");
                Console.WriteLine($"Erro detalhado: {ex}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException}");
                }
                return StatusCode(500, new { 
                    error = "Erro interno do servidor", 
                    details = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }



}