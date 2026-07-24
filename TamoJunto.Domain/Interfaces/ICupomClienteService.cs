using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TamoJunto.Domain.Interfaces
{
    public interface ICupomClienteService
    {
        Task Resgatar(Guid idCupom);
    }
}
