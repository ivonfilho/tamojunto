using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using TamoJunto.Domain.Specifications;

namespace TamoJunto.Domain.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IRepository<Usuario> _usuarioRepository;
    
    public UsuarioService(IRepository<Usuario> repository)
    {
        _usuarioRepository = repository;
    }
    
    public async Task<Usuario?> Login(string email, string password)
    {
        var user = await _usuarioRepository.FirstOrDefaultAsync(new UsuarioLoginSpec(email, password));
        return user;
    }
    
    public async Task<Usuario?> ListarPorEmail(string email)
    {
        var user = await _usuarioRepository.FirstOrDefaultAsync(new UsuarioEmailSpec(email));
        return user;
    }
}