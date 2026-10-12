using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ST_finance.Domain;
using ST_finance.Domain.Features.Jobs;

[assembly: LambdaSerializer(typeof(DefaultLambdaJsonSerializer))]

namespace ST_finance.Api;

public sealed class ScheduledJobsFunction
{
    private readonly IServiceProvider _serviceProvider;

    public ScheduledJobsFunction()
    {
        var builder = Host.CreateApplicationBuilder();
        builder.Services.AddDomainServices(builder.Configuration);
        _serviceProvider = builder.Services.BuildServiceProvider();
    }

    public async Task FunctionHandler(ScheduledJobCommand command, ILambdaContext context)
    {
        context.Logger.LogInformation(
            "Received scheduled job {JobName}; request ID {RequestId}.",
            command.Job,
            context.AwsRequestId);

        await using var scope = _serviceProvider.CreateAsyncScope();
        var dispatcher = scope.ServiceProvider.GetRequiredService<IScheduledJobDispatcher>();
        await dispatcher.DispatchAsync(command);
    }
}
