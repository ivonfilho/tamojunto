using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Interfaces;

public interface IUsuarioService
{
    Task<Usuario?> Login(string email, string password);
    
    Task<Usuario?> ListarPorEmail(string email);
}
