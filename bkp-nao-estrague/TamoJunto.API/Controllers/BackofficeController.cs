using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;

namespace TamoJunto.API.Controllers;

[Route("[controller]")]
public class BackofficeController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<Backoffice> _repository;

    public BackofficeController(IMapper mapper, IRepository<Backoffice> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }

    [HttpPost("Criar")]
    public async Task<JsonResult> Criar([FromBody] BackofficeRequest requestModel)
    {
        var model = _mapper.Map<Backoffice>(requestModel);
        model.Id = Guid.NewGuid();
        await _repository.AddAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpPut("Alterar")]
    public async Task<JsonResult> Alterar([FromBody] BackofficeRequest requestModel)
    {
        var model = _mapper.Map<Backoffice>(requestModel);
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpGet("Listar")]
    public async Task<JsonResult> Listar()
    {
        var result = await _repository.ListAsync(new GenericAllSpec<Backoffice>());
        return Json(result);
    }

    [HttpDelete("Deletar")]
    public async Task<JsonResult> Deletar(Guid id)
    {
        var result = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<Backoffice>(id));
        if (result == null)
        {
            return Json(false);
        }
        await _repository.DeleteAsync(result);
        await _repository.SaveChangesAsync();
        return Json(true);
    }
}