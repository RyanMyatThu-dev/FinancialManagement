using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ST_finance.Shared;

public class ResultJsonConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
    {
        return typeToConvert == typeof(Result) ||
               (typeToConvert.IsGenericType && typeToConvert.GetGenericTypeDefinition() == typeof(Result<>));
    }

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        if (typeToConvert == typeof(Result))
        {
            return new ResultJsonConverter();
        }

        var valueType = typeToConvert.GetGenericArguments()[0];
        var converterType = typeof(ResultOfTJsonConverter<>).MakeGenericType(valueType);
        return (JsonConverter)Activator.CreateInstance(converterType)!;
    }
}

public class ResultJsonConverter : JsonConverter<Result>
{
    public override Result Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException("Deserialization of Result is not supported.");
    }

    public override void Write(Utf8JsonWriter writer, Result value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();

        var namingPolicy = options.PropertyNamingPolicy;
        writer.WriteBoolean(namingPolicy?.ConvertName(nameof(Result.IsSuccess)) ?? nameof(Result.IsSuccess), value.IsSuccess);
        writer.WriteBoolean(namingPolicy?.ConvertName(nameof(Result.IsFailure)) ?? nameof(Result.IsFailure), value.IsFailure);

        writer.WritePropertyName(namingPolicy?.ConvertName(nameof(Result.Error)) ?? nameof(Result.Error));
        JsonSerializer.Serialize(writer, value.Error, options);

        writer.WriteEndObject();
    }
}

public class ResultOfTJsonConverter<TValue> : JsonConverter<Result<TValue>>
{
    public override Result<TValue> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException("Deserialization of Result<TValue> is not supported.");
    }

    public override void Write(Utf8JsonWriter writer, Result<TValue> value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();

        var namingPolicy = options.PropertyNamingPolicy;
        writer.WriteBoolean(namingPolicy?.ConvertName(nameof(Result.IsSuccess)) ?? nameof(Result.IsSuccess), value.IsSuccess);
        writer.WriteBoolean(namingPolicy?.ConvertName(nameof(Result.IsFailure)) ?? nameof(Result.IsFailure), value.IsFailure);

        writer.WritePropertyName(namingPolicy?.ConvertName(nameof(Result.Error)) ?? nameof(Result.Error));
        JsonSerializer.Serialize(writer, value.Error, options);

        writer.WritePropertyName(namingPolicy?.ConvertName(nameof(Result<TValue>.Value)) ?? nameof(Result<TValue>.Value));
        if (value.IsSuccess)
        {
            JsonSerializer.Serialize(writer, value.Value, options);
        }
        else
        {
            writer.WriteNullValue();
        }

        writer.WriteEndObject();
    }
}
