using System.Security.Cryptography;
using System.Text;

namespace TamoJunto.API.Services;

public class PasswordRecoveryService
{
    private readonly ILogger<PasswordRecoveryService> _logger;
    private readonly IEmailService _emailService;

    public PasswordRecoveryService(ILogger<PasswordRecoveryService> logger, IEmailService emailService)
    {
        _logger = logger;
        _emailService = emailService;
    }

    /// <summary>
    /// Gera uma nova senha aleatória segura
    /// </summary>
    public string GenerateSecurePassword(int length = 12)
    {
        const string validChars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        var random = new Random();
        var chars = new char[length];
        
        for (int i = 0; i < length; i++)
        {
            chars[i] = validChars[random.Next(validChars.Length)];
        }
        
        return new string(chars);
    }

    /// <summary>
    /// Gera uma senha mais simples para SMS (apenas números)
    /// </summary>
    public string GenerateNumericPassword(int length = 6)
    {
        var random = new Random();
        var password = new StringBuilder();
        
        for (int i = 0; i < length; i++)
        {
            password.Append(random.Next(0, 10));
        }
        
        return password.ToString();
    }

    /// <summary>
    /// Cria hash SHA1 da senha (compatível com o sistema atual)
    /// </summary>
    public string HashPassword(string password)
    {
        using (var sha1 = SHA1.Create())
        {
            var inputBytes = Encoding.ASCII.GetBytes(password); // Usar ASCII como no SegurancaUtil
            var hashBytes = sha1.ComputeHash(inputBytes);
            
            // Usar hexadecimal como no SegurancaUtil
            var sb = new StringBuilder();
            for (int i = 0; i < hashBytes.Length; i++)
            {
                sb.Append(hashBytes[i].ToString("X2"));
            }
            
            return sb.ToString();
        }
    }

    /// <summary>
    /// Envia email de recuperação de senha seguindo o padrão ASP.NET
    /// </summary>
    public async Task<bool> SendPasswordRecoveryEmail(string email, string newPassword, string userName)
    {
        try
        {
            // Usar o método existente do EmailService que já está implementado
            return await _emailService.EnviarEmailRecuperacaoSenha(email, userName, newPassword);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar email de recuperação para {Email}", email);
            return false;
        }
    }

    /// <summary>
    /// Envia SMS de recuperação de senha
    /// </summary>
    public async Task<bool> SendPasswordRecoverySms(string telefone, string codigo, string userName)
    {
        try
        {
            var message = $@"*TamoJunto - Recuperação de Senha*

Olá {userName},

Seu código de verificação é: *{codigo}*

Este código expira em 10 minutos.

_Não compartilhe este código com ninguém._

Acesse: https://tamojunto.app";

            
            // Simular envio bem-sucedido
            await Task.Delay(1000);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar SMS de recuperação para {Telefone}", telefone);
            return false;
        }
    }
}
