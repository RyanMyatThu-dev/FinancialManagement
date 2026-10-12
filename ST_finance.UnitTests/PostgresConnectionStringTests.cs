using Npgsql;
using ST_finance.Domain;

namespace ST_finance.UnitTests;

public sealed class PostgresConnectionStringTests
{
    [Fact]
    public void Normalize_PostgresUri_ProducesNpgsqlConnectionString()
    {
        var normalized = PostgresConnectionString.Normalize(
            "postgresql://postgres.project:password%40value@pooler.example.com:5432/postgres");
        var parsed = new NpgsqlConnectionStringBuilder(normalized);

        Assert.Equal("pooler.example.com", parsed.Host);
        Assert.Equal(5432, parsed.Port);
        Assert.Equal("postgres", parsed.Database);
        Assert.Equal("postgres.project", parsed.Username);
        Assert.Equal("password@value", parsed.Password);
        Assert.Equal(SslMode.Require, parsed.SslMode);
    }

    [Fact]
    public void Normalize_NpgsqlConnectionString_ReturnsOriginalValue()
    {
        const string connectionString = "Host=localhost;Database=postgres;Username=postgres;Password=secret";

        Assert.Equal(connectionString, PostgresConnectionString.Normalize(connectionString));
    }
}
