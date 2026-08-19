using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;

namespace TamoJunto.API.Controllers;

    [Route("api/[controller]")]
public class EnderecoController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<Endereco> _repository;

    public EnderecoController(IMapper mapper, IRepository<Endereco> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }

    [HttpPost("Criar")]
    public async Task<JsonResult> Criar([FromBody] EnderecoRequest requestModel)
    {
        
        var model = _mapper.Map<Endereco>(requestModel);

        
        model.Id = Guid.NewGuid();

       
        await _repository.AddAsync(model);

        
        await _repository.SaveChangesAsync();


        return Json(new { id = model.Id });
    }


    [HttpPut("Alterar")]
    public async Task<JsonResult> Alterar([FromBody] EnderecoRequest requestModel)
    {
        var model = _mapper.Map<Endereco>(requestModel);
        await _repository.UpdateAsync(model);
        await _repository.SaveChangesAsync();
        return Json(true);
    }

    [HttpGet("Listar")]
    public async Task<JsonResult> Listar()
    {
        var result = await _repository.ListAsync(new GenericAllSpec<Endereco>());
        return Json(result);
    }

    [HttpDelete("Deletar")]
    public async Task<JsonResult> Deletar(Guid id)
    {
        var result = await _repository.FirstOrDefaultAsync(new GenericByIdSpec<Endereco>(id));
        if (result == null)
        {
            return Json(false);
        }
        await _repository.DeleteAsync(result);
        await _repository.SaveChangesAsync();
        return Json(true);
    }
}