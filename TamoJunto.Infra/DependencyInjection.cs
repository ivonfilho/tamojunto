using Microsoft.Extensions.DependencyInjection;
using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Services;

namespace TamoJunto.Infra;

public static class DependencyInjection
{
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {

        services.AddScoped(typeof(IRepository<>), typeof(EFRepository.EfRepository<>));
        return services;
    }
    
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<ICupomClienteService, CupomClienteService>();

        return services;
    }
}
