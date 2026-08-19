using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;
using Ardalis.Specification.EntityFrameworkCore;

namespace TamoJunto.Infra;

public class EFRepository
{
    public class EfRepository<T> : RepositoryBase<T>, IRepository<T> where T : class
    {
        public EfRepository(TamoJuntoContext dbContext) : base(dbContext)
        {
        }
    }
}