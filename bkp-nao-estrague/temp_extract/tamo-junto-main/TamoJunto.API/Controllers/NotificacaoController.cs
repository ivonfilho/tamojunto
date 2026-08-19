using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using TamoJunto.API.RequestModel;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;

namespace TamoJunto.API.Controllers;

    [Route("api/[controller]")]
public class NotificacaoController : Controller
{
    private readonly IMapper _mapper;
    private readonly IRepository<Notificacao> _repository;

    public NotificacaoController(IMapper mapper, IRepository<Notificacao> repository)
    {
        _repository = repository;
        _mapper = mapper;
    }


    /// <param name="idUsuario">Id do usuário logado (claim Id do JWT).</param>
    [HttpGet("ListarPorIdCliente")]
    public async Task<IActionResult> ListarPorIdCliente(Guid idUsuario)
    {
        var notificacoes = await _repository.ListAsync(new NotificacaoPorIdUsuarioSpec(idUsuario));

        if (notificacoes == null || !notificacoes.Any())
        {
            return Ok(new List<Notificacao>());
        }

        return Ok(notificacoes);
    }
}
