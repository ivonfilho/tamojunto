using System;
using System.Linq.Expressions;
using TamoJunto.Domain.Models;
using Ardalis.Specification;

namespace TamoJunto.Domain.Specifications
{
    // Implementação da especificação
    public class GenericBySpecification<T> : Specification<T> where T : class
    {
        public GenericBySpecification(Expression<Func<T, bool>> criteria)
        {
            Query.Where(criteria);
        }
    }
}
