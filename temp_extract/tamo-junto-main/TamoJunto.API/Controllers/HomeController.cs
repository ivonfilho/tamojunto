using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TamoJunto.API.Controllers
{
    [AllowAnonymous]
    public class HomeController : Controller
    {
        [HttpGet("/")]
        public void Index()
        {
            Response.Redirect("/index.html");
        }
    }
}
