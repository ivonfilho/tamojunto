using Ardalis.Specification;

namespace TamoJunto.Domain.Interfaces;

public interface IRepository<T> : IRepositoryBase<T> where T : class
{
    
}