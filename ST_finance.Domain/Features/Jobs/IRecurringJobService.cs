using System.Threading.Tasks;

namespace ST_finance.Domain.Features.Jobs
{
    public interface IRecurringJobService
    {
        Task ProcessRecurringSchedulesAsync();
    }
}
