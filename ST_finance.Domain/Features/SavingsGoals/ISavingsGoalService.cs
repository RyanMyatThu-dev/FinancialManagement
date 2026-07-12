using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ST_finance.Domain.Features.SavingsGoals.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.SavingsGoals
{
    public interface ISavingsGoalService
    {
        Task<Result<PagedResponse<SavingsGoalResponse>>> GetGoalsAsync(Guid userId, int pageNumber, int pageSize);
        Task<Result<SavingsGoalResponse>> CreateGoalAsync(Guid userId, CreateSavingsGoalRequest request);
        Task<Result<SavingsGoalResponse>> ContributeToGoalAsync(Guid userId, Guid goalId, ContributeRequest request);
        Task<Result<IEnumerable<SavingsContributionResponse>>> GetContributionsAsync(Guid userId, Guid goalId);
        Task<Result> DeleteGoalAsync(Guid userId, Guid goalId);
    }
}
