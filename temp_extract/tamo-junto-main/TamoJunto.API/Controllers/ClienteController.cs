using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;

namespace TamoJunto.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClienteController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly IRepository<Cliente> _repository;

    public ClienteController(IMapper mapper, IRepository<Cliente> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }

    [HttpPost("criar")]
    public async Task<IActionResult> Criar([FromBody] ClienteRequest requestModel)
    {
        var model = _mapper.Map<Cliente>(requestModel);
        model.Id = Guid.NewGuid();
        await _repository.AddAsync(model);
        await _repository.SaveChangesAsync();
        return Ok(true);
    }

    [HttpPut("alterar")]
    public async Task<IActionResult> Alterar([FromBody] ClienteRequest requestModel)
    {
        var model = _mapper.Map<Cliente>(requestModel);
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("obterPorUsuario")]
    public async Task<IActionResult> ObterPorUsuario(Guid idUsuario)
    {
        var result = await _repository.FirstOrDefaultAsync(new ClientePorIdUsuarioSpec(idUsuario));
        return Ok(result);
    }

    [HttpDelete("deletar")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var result = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<Cliente>(id));
        if (result == null)
        {
            return Ok(false);
        }

        await _repository.DeleteAsync(result);
        await _repository.SaveChangesAsync();
        return Ok(true);
    }
}