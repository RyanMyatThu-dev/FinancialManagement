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
        Task<Result<PagedResponse<SavingsGoalResponse>>> GetCompletedGoalsAsync(Guid userId, int pageNumber, int pageSize, string sortBy);
        Task<Result<SavingsGoalResponse>> CreateGoalAsync(Guid userId, CreateSavingsGoalRequest request);
        Task<Result<SavingsGoalResponse>> ContributeToGoalAsync(Guid userId, Guid goalId, ContributeRequest request);
        Task<Result<SavingsGoalResponse>> CompleteGoalAsync(Guid userId, Guid goalId);
        Task<Result<IEnumerable<SavingsContributionResponse>>> GetContributionsAsync(Guid userId, Guid goalId);
        Task<Result> DeleteGoalAsync(Guid userId, Guid goalId);
    }
}
