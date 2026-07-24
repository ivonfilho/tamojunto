using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using Microsoft.AspNetCore.Authorization;

namespace TamoJunto.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ParceiroController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly IRepository<Parceiro> _repository;

    public ParceiroController(IMapper mapper, IRepository<Parceiro> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }

    [HttpPost("criar")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Criar([FromBody] ParceiroRequest requestModel)
    {
        var model = _mapper.Map<Parceiro>(requestModel);
        model.Id = Guid.NewGuid();
        model.DataCriacao = DateTime.UtcNow; 
        await _repository.AddAsync(model);
        await _repository.SaveChangesAsync();
        return Ok(true);
    }

    [HttpPut("alterar")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Alterar([FromBody] ParceiroRequest requestModel)
    {
        var model = _mapper.Map<Parceiro>(requestModel);
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("listar")]
// [Authorize(Roles = "Parceiro,Admin")]
public async Task<IActionResult> Listar()
{
    var includes = new[] { "IdEmpresaNavigation" };
    var parceiros = await _repository.ListAsync(new GenericAllSpec<Parceiro>(includes));

    var result = parceiros
        .Select(p => new
        {
            p.Id,
            p.Nome,
            p.Website,
            p.Contato,
            p.Status,
            p.DataCriacao,
            p.IdUsuario,
            IdEmpresaNavigation = new
            {
                p.IdEmpresaNavigation.Id,
                p.IdEmpresaNavigation?.Nome,
                p.IdEmpresaNavigation?.Cnpj
            }
        })
        .ToList();

    return Ok(result);
}



[HttpGet("parceiroPorUsuario/{idUsuario}")]
public async Task<IActionResult> ParceiroPorUsuario(Guid idUsuario)
{
    Console.WriteLine($"[DEBUG] Buscando parceiro para usuário: {idUsuario}");
    var parceiro = await _repository.FirstOrDefaultAsync(new GenericByUsuarioSpec<Parceiro>(idUsuario));

    if (parceiro == null)
    {
        Console.WriteLine($"[DEBUG] Parceiro não encontrado para usuário: {idUsuario}");
        return Ok(false); 
    }

    Console.WriteLine($"[DEBUG] Parceiro encontrado - ID: {parceiro.Id}, Nome: {parceiro.Nome}");
    return Ok(new { idParceiro = parceiro.Id, id = parceiro.Id, nome = parceiro.Nome });
}



    [HttpDelete("deletar")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var result = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<Parceiro>(id));
        if (result == null)
        {
            return Ok(false);
        }

        await _repository.DeleteAsync(result);
        await _repository.SaveChangesAsync();
        return Ok(true);
    }
}