using Npgsql;

namespace ST_finance.Domain;

public static class PostgresConnectionString
{
    public static string Normalize(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DbConnection is required.");
        }

        if (!connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) &&
            !connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
        {
            return connectionString;
        }

        var uri = new Uri(connectionString);
        var userInfoSeparator = uri.UserInfo.IndexOf(':');
        if (userInfoSeparator < 1)
        {
            throw new InvalidOperationException(
                "The PostgreSQL URI must include both a username and password.");
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(uri.UserInfo[..userInfoSeparator]),
            Password = Uri.UnescapeDataString(uri.UserInfo[(userInfoSeparator + 1)..]),
            SslMode = SslMode.Require
        };

        return builder.ConnectionString;
    }
}
