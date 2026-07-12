using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Budgets.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Budgets
{
    public class BudgetService : IBudgetService
    {
        private readonly AppDbContext _context;

        public BudgetService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<CategoryBudgetResponse>>> GetBudgetsAsync(Guid userId, int month, int year)
        {
            var categories = await _context.TblCategories
                .Where(c => c.UserId == userId)
                .ToListAsync();

            var budgets = await _context.TblCategoryBudgets
                .Where(b => b.UserId == userId && b.Month == month && b.Year == year)
                .ToDictionaryAsync(b => b.CategoryId);

            // Month date ranges in Bangkok time UTC+7
            var startOfMonth = DateTime.SpecifyKind(
                new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7),
                DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            var responseList = new List<CategoryBudgetResponse>();

            foreach (var cat in categories)
            {
                var spent = await _context.TblTransactions
                    .Where(t => t.UserId == userId && t.CategoryId == cat.Id && t.TransactionType == "Expense" && t.Date >= startOfMonth && t.Date < endOfMonth)
                    .SumAsync(t => t.Amount);

                budgets.TryGetValue(cat.Id, out var budget);
                var limit = budget?.LimitAmount ?? 0m;
                var budgetId = budget?.Id ?? Guid.Empty;

                responseList.Add(new CategoryBudgetResponse(
                    Id: budgetId,
                    CategoryId: cat.Id,
                    CategoryName: cat.Name,
                    LimitAmount: limit,
                    AmountSpent: spent,
                    Month: month,
                    Year: year
                ));
            }

            return Result.Success<IEnumerable<CategoryBudgetResponse>>(responseList);
        }

        public async Task<Result<CategoryBudgetResponse>> SetBudgetAsync(Guid userId, CategoryBudgetRequest request)
        {
            if (request == null)
            {
                return Result.Failure<CategoryBudgetResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }
            if (request.LimitAmount < 0)
            {
                return Result.Failure<CategoryBudgetResponse>(CustomErrors.Validation.InvalidInput("Limit amount cannot be negative."));
            }

            // Verify Category
            var category = await _context.TblCategories
                .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.UserId == userId);
            if (category == null)
            {
                return Result.Failure<CategoryBudgetResponse>(new Error("Category.NotFound", "Category not found."));
            }

            // Check if budget already exists
            var existingBudget = await _context.TblCategoryBudgets
                .FirstOrDefaultAsync(b => b.UserId == userId && b.CategoryId == request.CategoryId && b.Month == request.Month && b.Year == request.Year);

            if (existingBudget != null)
            {
                existingBudget.LimitAmount = request.LimitAmount;
                existingBudget.DeleteFlag = false;
            }
            else
            {
                existingBudget = new TblCategoryBudget
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CategoryId = request.CategoryId,
                    LimitAmount = request.LimitAmount,
                    Month = request.Month,
                    Year = request.Year,
                    CreatedAt = DateTime.UtcNow,
                    DeleteFlag = false
                };
                _context.TblCategoryBudgets.Add(existingBudget);
            }

            await _context.SaveChangesAsync();

            // Calculate spent
            var startOfMonth = DateTime.SpecifyKind(
                new DateTime(request.Year, request.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7),
                DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            var spent = await _context.TblTransactions
                .Where(t => t.UserId == userId && t.CategoryId == request.CategoryId && t.TransactionType == "Expense" && t.Date >= startOfMonth && t.Date < endOfMonth)
                .SumAsync(t => t.Amount);

            return Result.Success(new CategoryBudgetResponse(
                Id: existingBudget.Id,
                CategoryId: existingBudget.CategoryId,
                CategoryName: category.Name,
                LimitAmount: existingBudget.LimitAmount,
                AmountSpent: spent,
                Month: existingBudget.Month,
                Year: existingBudget.Year
            ));
        }
    }
}
