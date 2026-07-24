using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;

namespace TamoJunto.API.Controllers;

[Route("[controller]")]
public class EmpresaController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<Empresa> _repository;

    public EmpresaController(IMapper mapper, IRepository<Empresa> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }


    [HttpPut("Alterar")]
    public async Task<JsonResult> Alterar([FromBody] EmpresaRequest requestModel)
    {
        var model = _mapper.Map<Empresa>(requestModel);
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpGet("Listar")]
    public async Task<JsonResult> Listar()
    {
        var result = await _repository.ListAsync(new GenericAllSpec<Empresa>());
        return Json(result);
    }

    [HttpDelete("Deletar")]
    public async Task<JsonResult> Deletar(Guid id)
    {
        var result = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<Empresa>(id));
        if (result == null)
        {
            return Json(false);
        }
        await _repository.DeleteAsync(result);
        await _repository.SaveChangesAsync();
        return Json(true);
    }
}