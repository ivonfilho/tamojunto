using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using TamoJunto.Infra;
using Microsoft.AspNetCore.Cors;
using TamoJunto.Domain.Interfaces;

namespace TamoJunto.API.Controllers;

[Route("[controller]")]
[EnableCors("AllowAllPolicy")] // Habilitar CORS para todas as origens
public class HistoricoLoginController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<HistoricoLogin> _repository;

    public HistoricoLoginController(IMapper mapper, IRepository<HistoricoLogin> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }

    [HttpPost("Criar")]
    public async Task<JsonResult> Criar([FromBody] HistoricoLoginRequest requestModel)
    {
        var model = _mapper.Map<HistoricoLogin>(requestModel);
        model.Id = Guid.NewGuid();
        await _repository.AddAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpPut("Alterar")]
    public async Task<JsonResult> Alterar([FromBody] HistoricoLoginRequest requestModel)
    {
        var model = _mapper.Map<HistoricoLogin>(requestModel);
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpGet("Listar")]
    public async Task<JsonResult> Listar()
    {
        var result = await _repository.ListAsync(new GenericAllSpec<HistoricoLogin>());
        return Json(result);
    }

    [HttpDelete("Deletar")]
    public async Task<JsonResult> Deletar(Guid id)
    {
        var result = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<HistoricoLogin>(id));
        if (result == null)
        {
            return Json(false);
        }
        await _repository.DeleteAsync(result);
        await _repository.SaveChangesAsync();
        return Json(true);
    }
}