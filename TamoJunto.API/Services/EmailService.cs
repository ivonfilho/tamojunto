using System.Net;
using System.Net.Mail;
using System.Text;

namespace TamoJunto.API.Services;

public interface IEmailService
{
    Task<bool> EnviarEmailRecuperacaoSenha(string email, string nome, string token);
    Task<bool> EnviarEmailConfirmacao(string email, string nome, string token);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> EnviarEmailRecuperacaoSenha(string email, string nome, string novaSenha)
    {
        try
        {
            var subject = "Nova Senha - TamoJunto";
            var body = GerarTemplateNovaSenha(nome, novaSenha);

            return await EnviarEmail(email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar email de recuperação de senha para {Email}", email);
            return false;
        }
    }

    public async Task<bool> EnviarEmailConfirmacao(string email, string nome, string token)
    {
        try
        {
            var frontendUrl = (_configuration["FRONTEND_URL"] ?? "https://app.tamojunto.net").TrimEnd('/');
            // Preferir link que bate na API pública (PUBLIC_API_URL). Se não vier configurado,
            // usamos o domínio público do Railway como fallback.
            var publicApi = ResolvePublicApiBaseUrl();
            var confirmUrl = !string.IsNullOrEmpty(publicApi)
                ? $"{publicApi}/api/usuario/confirmar-email-link?token={Uri.EscapeDataString(token)}"
                : $"{frontendUrl}/#/confirmar-email?token={Uri.EscapeDataString(token)}";
            var fallbackFrontUrl = $"{frontendUrl}/#/confirmar-email?token={Uri.EscapeDataString(token)}";
            
            var subject = "Confirmação de Email - TamoJunto";
            var body = GerarTemplateConfirmacaoEmail(nome, confirmUrl, fallbackFrontUrl);

            _logger.LogInformation(
                "Link de confirmação gerado para {Email}. Primary: {PrimaryConfirmUrl} | Fallback: {FallbackConfirmUrl}",
                email, confirmUrl, fallbackFrontUrl);

            return await EnviarEmail(email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar email de confirmação para {Email}", email);
            return false;
        }
    }

    private async Task<bool> EnviarEmail(string email, string subject, string body)
    {
        try
        {
            var smtpHost = _configuration["SMTP_HOST"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["SMTP_PORT"] ?? "587");
            var smtpUser = _configuration["SMTP_USER"] ?? "tamojunto.app10@gmail.com";
            var smtpPassword = _configuration["SMTP_PASSWORD"] ?? "";
            var smtpFromEmail = _configuration["SMTP_FROM_EMAIL"] ?? "tamojunto.app10@gmail.com";
            var smtpFromName = _configuration["SMTP_FROM_NAME"] ?? "TamoJunto";

            _logger.LogInformation("Tentando enviar email para {Email} usando SMTP: {Host}:{Port}", email, smtpHost, smtpPort);
            _logger.LogInformation("SMTP User: {User}, From Email: {FromEmail}", smtpUser, smtpFromEmail);

            // Validar se as credenciais estão configuradas
            if (string.IsNullOrEmpty(smtpPassword) || smtpPassword == "your-app-password-here")
            {
                _logger.LogError("SMTP_PASSWORD não configurado ou usando valor padrão. Email não será enviado para {Email}. Configure a variável SMTP_PASSWORD no Railway.", email);
                return false;
            }

            // Validar se o email de origem está configurado
            if (string.IsNullOrEmpty(smtpFromEmail))
            {
                _logger.LogError("SMTP_FROM_EMAIL não configurado. Email não será enviado para {Email}", email);
                return false;
            }

            using var client = new SmtpClient(smtpHost, smtpPort);
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(smtpUser, smtpPassword);
            client.EnableSsl = true;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            client.Timeout = 30000; // 30 segundos de timeout

            using var message = new MailMessage();
            message.From = new MailAddress(smtpFromEmail, smtpFromName);
            message.To.Add(email);
            message.Subject = subject;
            message.Body = body;
            message.IsBodyHtml = true;
            message.BodyEncoding = Encoding.UTF8;
            message.SubjectEncoding = Encoding.UTF8;

            _logger.LogInformation("Enviando email para {Email} com assunto: {Subject}", email, subject);
            
            await client.SendMailAsync(message);
            _logger.LogInformation("Email enviado com sucesso para {Email}", email);
            return true;
        }
        catch (SmtpException smtpEx)
        {
            _logger.LogError(smtpEx, "Erro SMTP ao enviar email para {Email}. StatusCode: {StatusCode}", email, smtpEx.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro geral ao enviar email para {Email}: {Message}", email, ex.Message);
            return false;
        }
    }

    private string? ResolvePublicApiBaseUrl()
    {
        var configured = _configuration["PUBLIC_API_URL"]?.Trim().TrimEnd('/');
        if (!string.IsNullOrEmpty(configured))
            return configured;

        var railwayPublicDomain = _configuration["RAILWAY_PUBLIC_DOMAIN"]?.Trim();
        if (!string.IsNullOrEmpty(railwayPublicDomain))
            return $"https://{railwayPublicDomain.TrimEnd('/')}";

        return null;
    }

    private string GerarTemplateNovaSenha(string nome, string novaSenha)
    {
        return $@"
<!DOCTYPE html>
<html lang='pt-BR'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Nova Senha - TamoJunto</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            padding: 40px 30px;
            text-align: center;
        }}
        .header h1 {{
            color: #333333;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
        }}
        .message {{
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #666;
        }}
        .password-box {{
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 2em;
            margin: 20px 0;
            text-align: center;
        }}
        .password-label {{
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }}
        .password-value {{
            font-size: 24px;
            font-weight: bold;
            color: #666;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #6a00f4 0%, #8a2be2 100%);
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }}
        .button:hover {{
            transform: translateY(-2px);
        }}
        .warning {{
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning-text {{
            color: #92400e;
            font-size: 14px;
            margin: 0;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }}
        .footer-text {{
            color: #666;
            font-size: 14px;
            margin: 0;
        }}
        .link {{
            color: #6a00f4;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <img src='https://app.tamojunto.net/assets/tamo-junto-logo.png' 
                 alt='TamoJunto Logo' 
                 style='display:block;margin:0 auto 10px auto;max-width:200px;height:auto;' />
            <h1>Nova Senha</h1>
        </div>
        
        <div class='content'>
            <div class='greeting'>Olá, {nome}!</div>
            
            <div class='message'>
                Sua senha foi redefinida com sucesso! Use a senha temporária abaixo para fazer login:
            </div>
            
            <div class='password-box'>
                <div class='password-label'>Sua nova senha:</div>
                <div class='password-value'>{novaSenha}</div>
            </div>
            
            <div style='text-align: center;'>
                <a href='https://app.tamojunto.net' class='button'>Fazer Login</a>
            </div>
            
            <div class='warning'>
                <p class='warning-text'>
                    <strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere esta senha temporária 
                    após fazer login. Esta senha foi gerada automaticamente e deve ser mantida em segurança.
                </p>
            </div>
            
            <div class='message'>
                Se você não solicitou esta redefinição, entre em contato conosco imediatamente.
            </div>
        </div>
        
        <div class='footer'>
            <p class='footer-text'>
                Este email foi enviado automaticamente. Não responda a esta mensagem.<br>
                © 2025 TamoJunto. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string GerarTemplateRecuperacaoSenha(string nome, string resetUrl)
    {
        return $@"
<!DOCTYPE html>
<html lang='pt-BR'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Recuperação de Senha - TamoJunto</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #6a00f4 0%, #8a2be2 100%);
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            width: 80px;
            height: 80px;
            margin: 0 auto 20px auto;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjEiIGhlaWdodD0iNTEiIHZpZXdCb3g9IjAgMCA2MSA1MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIKICAgIGQ9Ik02MC4zNTEgMEw2MC4zNTEgNTAuMzAwNkgyMS42NzM3QzkuNzAzNjUgNTAuMzAwNiAwIDQwLjU5NyAwIDI4LjYyNjlWLTIuNjM4NDVlLTA2TDYwLjM1MSAwWk00OC43NDYgMTMuMTU1Nkw0OC43NDYgMzcuOTE5SDIzLjk5MTlDMTcuMTUxOCAzNy45MTkgMTEuNjA2OSAzMi4zNzQgMTEuNjA2OSAyNS41MzRWMTMuMTU1NkwyMy45ODQzIDEzLjE1NTZWMjUuNTM3M0gzNS41OTAzVjEzLjE1NTZMNDguNzQ2IDEzLjE1NTZaIgogICAgZmlsbD0iIzZhMDBmNCIgLz4KPC9zdmc+');
            background-size: 80px 60px;
            background-repeat: no-repeat;
            background-position: center;
        }}
        .header h1 {{
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
        }}
        .message {{
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #666;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #6a00f4 0%, #8a2be2 100%);
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }}
        .button:hover {{
            transform: translateY(-2px);
        }}
        .warning {{
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning-text {{
            color: #92400e;
            font-size: 14px;
            margin: 0;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }}
        .footer-text {{
            color: #666;
            font-size: 14px;
            margin: 0;
        }}
        .link {{
            color: #6a00f4;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'></div>
            <h1>Recuperação de Senha</h1>
        </div>
        
        <div class='content'>
            <div class='greeting'>Olá, {nome}!</div>
            
            <div class='message'>
                Recebemos uma solicitação para redefinir a senha da sua conta no TamoJunto. 
                Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha.
            </div>
            
            <div style='text-align: center;'>
                <a href='{resetUrl}' class='button'>Redefinir Minha Senha</a>
            </div>
            
            <div class='warning'>
                <p class='warning-text'>
                    <strong>⚠️ Importante:</strong> Este link é válido por apenas 1 hora. 
                    Se você não solicitou esta redefinição, ignore este email.
                </p>
            </div>
            
            <div class='message'>
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                <a href='{resetUrl}' class='link'>{resetUrl}</a>
            </div>
        </div>
        
        <div class='footer'>
            <p class='footer-text'>
                Este email foi enviado automaticamente. Não responda a esta mensagem.<br>
                © 2024 TamoJunto. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string GerarTemplateConfirmacaoEmail(string nome, string confirmUrl, string fallbackFrontUrl)
    {
        return $@"
<!DOCTYPE html>
<html lang='pt-BR'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Confirmação de Email - TamoJunto</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #6a00f4 0%, #8a2be2 100%);
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            width: 80px;
            height: 80px;
            margin: 0 auto 20px auto;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjEiIGhlaWdodD0iNTEiIHZpZXdCb3g9IjAgMCA2MSA1MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIKICAgIGQ9Ik02MC4zNTEgMEw2MC4zNTEgNTAuMzAwNkgyMS42NzM3QzkuNzAzNjUgNTAuMzAwNiAwIDQwLjU5NyAwIDI4LjYyNjlWLTIuNjM4NDVlLTA2TDYwLjM1MSAwWk00OC43NDYgMTMuMTU1Nkw0OC43NDYgMzcuOTE5SDIzLjk5MTlDMTcuMTUxOCAzNy45MTkgMTEuNjA2OSAzMi4zNzQgMTEuNjA2OSAyNS41MzRWMTMuMTU1NkwyMy45ODQzIDEzLjE1NTZWMjUuNTM3M0gzNS41OTAzVjEzLjE1NTZMNDguNzQ2IDEzLjE1NTZaIgogICAgZmlsbD0iIzZhMDBmNCIgLz4KPC9zdmc+');
            background-size: 80px 60px;
            background-repeat: no-repeat;
            background-position: center;
        }}
        .header h1 {{
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
        }}
        .message {{
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #666;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #6a00f4 0%, #8a2be2 100%);
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }}
        .button:hover {{
            transform: translateY(-2px);
        }}
        .success {{
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .success-text {{
            color: #065f46;
            font-size: 14px;
            margin: 0;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }}
        .footer-text {{
            color: #666;
            font-size: 14px;
            margin: 0;
        }}
        .link {{
            color: #6a00f4;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'></div>
            <h1>Confirmação de Email</h1>
        </div>
        
        <div class='content'>
            <div class='greeting'>Olá, {nome}!</div>
            
            <div class='message'>
                Bem-vindo ao TamoJunto! Para ativar sua conta e começar a aproveitar todas as ofertas incríveis, 
                confirme seu endereço de email clicando no botão abaixo.
            </div>
            
            <div style='text-align: center;'>
                <a href='{confirmUrl}' class='button'>Confirmar Meu Email</a>
            </div>
            
            <div class='success'>
                <p class='success-text'>
                    <strong>Parabéns!</strong> Você está prestes a fazer parte da nossa comunidade de descontos e ofertas exclusivas.
                </p>
            </div>
            
            <div class='message'>
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                <a href='{confirmUrl}' class='link'>{confirmUrl}</a>
            </div>
            <div class='message'>
                Link alternativo (abre direto na tela de confirmação do app):<br>
                <a href='{fallbackFrontUrl}' class='link'>{fallbackFrontUrl}</a>
            </div>
        </div>
        
        <div class='footer'>
            <p class='footer-text'>
                Este email foi enviado automaticamente. Não responda a esta mensagem.<br>
                © 2025 TamoJunto. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>";
    }
}
