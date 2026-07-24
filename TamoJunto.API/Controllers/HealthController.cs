using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TamoJunto.Domain.Models;
using Microsoft.AspNetCore.Cors;

namespace TamoJunto.API.Controllers;

[ApiController]
    [Route("[controller]")]
[EnableCors("AllowAllPolicy")] // Habilitar CORS para todas as origens
    public class HealthController : ControllerBase
{
    private readonly TamoJuntoContext _context;

    public HealthController(TamoJuntoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            // Verificar conexão com o banco
            var canConnect = await _context.Database.CanConnectAsync();
            
            if (!canConnect)
            {
                return StatusCode(503, new
                {
                    status = "unhealthy",
                    timestamp = DateTime.UtcNow,
                    database = "disconnected"
                });
            }

            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                database = "connected",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "unknown"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "unhealthy",
                timestamp = DateTime.UtcNow,
                error = ex.Message,
                database = "error"
            });
        }
    }
} 