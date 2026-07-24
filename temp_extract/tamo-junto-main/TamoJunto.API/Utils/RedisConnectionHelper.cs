namespace TamoJunto.API.Utils;

/// <summary>
/// Converte REDIS_URL (ex.: Railway redis://default:pass@host:6379) para formato StackExchange.Redis.
/// </summary>
public static class RedisConnectionHelper
{
    public static string? ToStackExchangeConfiguration(string? redisUrl)
    {
        if (string.IsNullOrWhiteSpace(redisUrl))
            return null;

        var trimmed = redisUrl.Trim();
        if (!trimmed.StartsWith("redis://", StringComparison.OrdinalIgnoreCase)
            && !trimmed.StartsWith("rediss://", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        var uri = new Uri(trimmed);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 6379;
        var ssl = uri.Scheme.Equals("rediss", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrEmpty(uri.UserInfo))
            return $"{host}:{port},ssl={(ssl ? "true" : "false")}";

        var idx = uri.UserInfo.IndexOf(':');
        var password = idx >= 0
            ? uri.UserInfo[(idx + 1)..]
            : uri.UserInfo;

        password = Uri.UnescapeDataString(password);
        return $"{host}:{port},password={password},ssl={(ssl ? "true" : "false")}";
    }
}
