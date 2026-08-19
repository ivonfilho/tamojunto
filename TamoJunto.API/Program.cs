using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using TamoJunto.API.Mappings;
using TamoJunto.API.Utils;
using TamoJunto.Domain.Models;
using TamoJunto.Infra;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure; 
using Microsoft.AspNetCore.Server.IIS;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;
using TamoJunto.API.Utils;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddTransient<TokenUtil>();
builder.Services.AddHttpClient();
// PagamentoController usa IHttpClientFactory.CreateClient("MercadoPago") para a API REST do MP
builder.Services.AddHttpClient("MercadoPago");
builder.Services.AddScoped<TamoJunto.API.Services.IEmailService, TamoJunto.API.Services.EmailService>();
builder.Services.AddScoped<TamoJunto.API.Services.PasswordRecoveryService>();
builder.Services.AddScoped<TamoJunto.API.Services.ISmsService, TamoJunto.API.Services.MockSmsService>();

builder.Services.AddAuthentication(x =>
    {
        x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(x =>
    {
        var key = Encoding.ASCII.GetBytes(Settings.Secret);
        x.RequireHttpsMetadata = false;
        x.SaveToken = true;
        x.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });


builder.Services.AddControllers(options =>
    {
        // var policy = new AuthorizationPolicyBuilder()
        //     .RequireAuthenticatedUser()
        //     .Build();
        // options.Filters.Add(new AuthorizeFilter(policy));
    }
).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
}).AddNewtonsoftJson(opt => { opt.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore; });

// Configurar limites de upload
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 52428800; // 50MB
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 52428800; // 50MB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50MB
});

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddRepositories();
builder.Services.AddServices();
builder.Services.AddAutoMapper(typeof(Mapping).Assembly);

// Cache distribuído: Redis na Railway (REDIS_URL / REDIS_PRIVATE_URL) ou memória (instância única)
var redisConnection = RedisConnectionHelper.ToStackExchangeConfiguration(
    Environment.GetEnvironmentVariable("REDIS_URL")
    ?? Environment.GetEnvironmentVariable("REDIS_PRIVATE_URL"));
if (!string.IsNullOrEmpty(redisConnection))
{
    Console.WriteLine("Distributed cache: Redis configurado.");
    builder.Services.AddStackExchangeRedisCache(o => { o.Configuration = redisConnection; });
}
else
{
    Console.WriteLine(
        "Distributed cache: memória do processo. Defina REDIS_URL (Railway Redis) para cache entre réplicas e menor carga no Postgres.");
    builder.Services.AddDistributedMemoryCache();
}

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        new[] { "application/json" });
});

// Configuração do banco de dados
if (builder.Environment.IsDevelopment())
{
    var dbServer = "104.196.117.15";
    builder.Services.AddDbContext<TamoJuntoContext>(opt =>
    {
        //opt.UseNpgsql($"Server={dbServer};Database=tamo-junto;User Id=luar;Password=;TrustServerCertificate=True", sqlServerOptions =>
            {
                sqlServerOptions.CommandTimeout(60);
                sqlServerOptions.MigrationsAssembly("TamoJunto.Domain");
            });
        opt.EnableSensitiveDataLogging();
        opt.UseCamelCaseNamingConvention();
    }, ServiceLifetime.Scoped);
    AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
}
else
{
    // Configuração para produção (PostgreSQL no Railway / Coolify)
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    var connectionString = "";

    if (string.IsNullOrEmpty(databaseUrl))
    {
        throw new InvalidOperationException("DATABASE_URL environment variable is not set");
    }

    if (databaseUrl.StartsWith("postgres://") || databaseUrl.StartsWith("postgresql://"))
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        var user = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        // Usando User Id e Password para ser compatível com Npgsql 8.0+
        connectionString = $"Server={host};Port={port};Database={database};User Id={user};Password={password};SslMode=Prefer;TrustServerCertificate=True;";
    }
    else
    {
        connectionString = databaseUrl;
    }
    
    Console.WriteLine("Using DATABASE_URL from environment (connection string redacted in logs)");
    
    builder.Services.AddDbContext<TamoJuntoContext>(opt =>
    {
        opt.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly("TamoJunto.Domain");
                npgsqlOptions.EnableRetryOnFailure();
                npgsqlOptions.CommandTimeout(60);
            });
        opt.UseCamelCaseNamingConvention();
    }, ServiceLifetime.Scoped);
    AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
}

// Configurar porta para Railway em produção
if (!builder.Environment.IsDevelopment())
{
    // Railway suporta HTTPS nativamente, não precisamos configurar porta específica
    // O Railway automaticamente redireciona para HTTPS
    builder.WebHost.UseUrls("http://0.0.0.0:8080");
}

builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo() { Title = "Tamo Junto API", Version = "1.0" });
    option.SchemaGeneratorOptions.UseAllOfForInheritance = true;
    
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});

// Uma única política: reflete a origem (localhost, app, Capacitor) — evita respostas sem ACAO em cenários com credenciais.
builder.Services.AddCors(o => o.AddPolicy("AllowAllPolicy", builder =>
{
    builder.SetIsOriginAllowed(_ => true)
        .AllowAnyHeader()
        .AllowAnyMethod();
}));

var app = builder.Build();

// Aplicar migrações automaticamente em produção
if (!app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<TamoJuntoContext>();
        try
        {
            Console.WriteLine("Aplicando migrações do banco de dados...");
            context.Database.Migrate();
            Console.WriteLine("Migrações aplicadas com sucesso!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao aplicar migrações: {ex.Message}");
            Console.WriteLine($"StackTrace: {ex.StackTrace}");
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Adicionar suporte a arquivos estáticos
// Configurar para servir arquivos da pasta wwwroot (incluindo uploads)
var staticFileOptions = new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Permitir cache de imagens por 1 hora
        ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=3600");
    }
};
app.UseStaticFiles(staticFileOptions);

// Desabilitar redirecionamento HTTPS em produção
if (!app.Environment.IsDevelopment())
{
    // Não usar UseHttpsRedirection em produção no Railway
}
else
{
    app.UseHttpsRedirection();
}

app.UseRouting();
app.UseCors("AllowAllPolicy");
app.UseResponseCompression();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine($"Aplicação iniciada em: {app.Environment.EnvironmentName}");
Console.WriteLine($"URLs configuradas: {string.Join(", ", app.Urls)}");

app.Run();
