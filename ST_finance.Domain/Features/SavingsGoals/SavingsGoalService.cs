using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.SavingsGoals.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.SavingsGoals
{
    public class SavingsGoalService : ISavingsGoalService
    {
        private readonly AppDbContext _context;

        public SavingsGoalService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<PagedResponse<SavingsGoalResponse>>> GetGoalsAsync(Guid userId, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize  < 1) pageSize  = 12;
            if (pageSize  > 100) pageSize = 100;

            var query = _context.TblSavingsGoals
                .Include(g => g.TblSavingsContributions)
                .Where(g => g.UserId == userId && !g.DeleteFlag)
                .OrderByDescending(g => g.CreatedAt);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var responses = items.Select(g => new SavingsGoalResponse(
                Id: g.Id,
                UserId: g.UserId,
                GoalName: g.GoalName,
                TargetAmount: g.TargetAmount,
                TargetDate: g.TargetDate,
                IsCompleted: g.IsCompleted ?? false,
                CurrentAmount: g.TblSavingsContributions.Sum(c => c.Amount),
                CreatedAt: g.CreatedAt ?? DateTime.UtcNow
            )).ToList();

            return Result.Success(PagedResponse<SavingsGoalResponse>.Create(responses, totalCount, pageNumber, pageSize));
        }

        public async Task<Result<SavingsGoalResponse>> CreateGoalAsync(Guid userId, CreateSavingsGoalRequest request)
        {
            if (request == null)
            {
                return Result.Failure<SavingsGoalResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }
            if (request.TargetAmount <= 0)
            {
                return Result.Failure<SavingsGoalResponse>(CustomErrors.Validation.InvalidInput("Target amount must be greater than zero."));
            }

            var goal = new TblSavingsGoal
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                GoalName = request.GoalName,
                TargetAmount = request.TargetAmount,
                TargetDate = request.TargetDate,
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblSavingsGoals.Add(goal);
            await _context.SaveChangesAsync();

            return Result.Success(new SavingsGoalResponse(
                Id: goal.Id,
                UserId: goal.UserId,
                GoalName: goal.GoalName,
                TargetAmount: goal.TargetAmount,
                TargetDate: goal.TargetDate,
                IsCompleted: false,
                CurrentAmount: 0m,
                CreatedAt: goal.CreatedAt.Value
            ));
        }

        public async Task<Result<SavingsGoalResponse>> ContributeToGoalAsync(Guid userId, Guid goalId, ContributeRequest request)
        {
            if (request == null)
            {
                return Result.Failure<SavingsGoalResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var goal = await _context.TblSavingsGoals
                .Include(g => g.TblSavingsContributions)
                .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId && !g.DeleteFlag);

            if (goal == null)
            {
                return Result.Failure<SavingsGoalResponse>(new Error("SavingsGoal.NotFound", "Savings goal not found."));
            }

            var currentGoalSavings = goal.TblSavingsContributions.Sum(c => c.Amount);

            if (request.Amount < 0 && (currentGoalSavings + request.Amount < 0))
            {
                return Result.Failure<SavingsGoalResponse>(CustomErrors.Validation.InvalidInput("Cannot withdraw more funds than currently saved in this goal."));
            }

            if (request.Amount > 0)
            {
                var totalBalance = await _context.TblAccounts
                    .Where(a => a.UserId == userId)
                    .SumAsync(a => a.Balance ?? 0m);

                var totalSavings = await _context.TblSavingsContributions
                    .Where(c => c.SavingsGoal.UserId == userId && !c.SavingsGoal.DeleteFlag)
                    .SumAsync(c => c.Amount);

                var disposableBalance = totalBalance - totalSavings;

                if (request.Amount > disposableBalance)
                {
                    return Result.Failure<SavingsGoalResponse>(CustomErrors.Validation.InvalidInput($"Insufficient disposable balance ({disposableBalance:F2} THB) to contribute {request.Amount:F2} THB."));
                }
            }

            var contribution = new TblSavingsContribution
            {
                Id = Guid.NewGuid(),
                SavingsGoalId = goal.Id,
                Amount = request.Amount,
                Date = DateTime.UtcNow,
                Note = request.Note,
                TransactionId = null 
            };

            _context.TblSavingsContributions.Add(contribution);
            
            var newTotal = currentGoalSavings + request.Amount;
            goal.IsCompleted = newTotal >= goal.TargetAmount;

            await _context.SaveChangesAsync();

            return Result.Success(new SavingsGoalResponse(
                Id: goal.Id,
                UserId: goal.UserId,
                GoalName: goal.GoalName,
                TargetAmount: goal.TargetAmount,
                TargetDate: goal.TargetDate,
                IsCompleted: goal.IsCompleted ?? false,
                CurrentAmount: newTotal,
                CreatedAt: goal.CreatedAt ?? DateTime.UtcNow
            ));
        }

        public async Task<Result<IEnumerable<SavingsContributionResponse>>> GetContributionsAsync(Guid userId, Guid goalId)
        {
            var goalExists = await _context.TblSavingsGoals.AnyAsync(g => g.Id == goalId && g.UserId == userId);
            if (!goalExists)
            {
                return Result.Failure<IEnumerable<SavingsContributionResponse>>(new Error("SavingsGoal.NotFound", "Savings goal not found."));
            }

            var contributions = await _context.TblSavingsContributions
                .Where(c => c.SavingsGoalId == goalId)
                .OrderByDescending(c => c.Date)
                .ToListAsync();

            var responses = contributions.Select(c => new SavingsContributionResponse(
                Id: c.Id,
                SavingsGoalId: c.SavingsGoalId,
                TransactionId: c.TransactionId,
                Amount: c.Amount,
                Date: c.Date,
                Note: c.Note
            ));

            return Result.Success(responses);
        }

        public async Task<Result> DeleteGoalAsync(Guid userId, Guid goalId)
        {
            var goal = await _context.TblSavingsGoals
                .FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);

            if (goal == null)
            {
                return Result.Failure(new Error("SavingsGoal.NotFound", "Savings goal not found."));
            }

            goal.DeleteFlag = true;
            await _context.SaveChangesAsync();

            return Result.Success();
        }
    }
}
