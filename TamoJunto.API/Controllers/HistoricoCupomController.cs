using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;
using Microsoft.AspNetCore.Authorization;

namespace TamoJunto.API.Controllers;

[Route("[controller]")]
public class HistoricoCupomController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<HistoricoCupom> _repository;

    public HistoricoCupomController(IMapper mapper, IRepository<HistoricoCupom> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }

    [HttpPost("Criar")]
    public async Task<JsonResult> Criar([FromBody] HistoricoCupomRequest requestModel)
    {
        var model = _mapper.Map<HistoricoCupom>(requestModel);
        model.Id = Guid.NewGuid();
        await _repository.AddAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpPut("Alterar")]
    //[Authorize(Roles = "Parceiro,Admin")]
    public async Task<JsonResult> Alterar([FromBody] HistoricoCupomRequest requestModel)
    {
        var model = _mapper.Map<HistoricoCupom>(requestModel);
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpGet("Listar")]
    //[Authorize(Roles = "Parceiro,Admin")]
    public async Task<JsonResult> Listar()
    {
        var result = await _repository.ListAsync(new GenericAllSpec<HistoricoCupom>());
        return Json(result);
    }

    [HttpGet("Relatorio/{idParceiro}")]
    //[Authorize(Roles = "Parceiro,Admin")]
    public async Task<JsonResult> Relatorio(Guid idParceiro)
    {
        var historicos = await _repository.ListAsync(new GenericAllSpec<HistoricoCupom>());
        var historicosFiltrados = historicos.Where(h => h.IdCupomClienteNavigation.OfertaParceiro.IdParceiro == idParceiro).ToList();
        return Json(historicosFiltrados);
    }

    [HttpDelete("Deletar")]
    [Authorize(Roles = "Parceiro,Admin")]
    public async Task<JsonResult> Deletar(Guid id)
    {
        var result = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<HistoricoCupom>(id));
        if (result == null)
        {
            return Json(false);
        }
        await _repository.DeleteAsync(result);
        await _repository.SaveChangesAsync();
        return Json(true);
    }
}
