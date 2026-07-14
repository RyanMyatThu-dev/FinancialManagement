using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Budgets;
using ST_finance.Domain.Features.Budgets.Models;
using Xunit;

namespace ST_finance.UnitTests
{
    public class BudgetServiceTests
    {
        private readonly AppDbContext _context;
        private readonly BudgetService _service;
        private readonly Guid _userId = Guid.NewGuid();
        private Guid _categoryId;

        public BudgetServiceTests()
        {
            _context = TestDatabaseFixture.CreateContext();
            _service = new BudgetService(_context);

            var category = new TblCategory { UserId = _userId, Name = "Dorm", Type = "Expense", Color = "#4F46E5", Icon = "Wallet" };
            _context.TblCategories.Add(category);
            _context.SaveChanges();
            _categoryId = category.Id;
        }

        [Fact]
        public async Task SetBudget_ShouldFail_WhenLimitAmountIsNegative()
        {
            var request = new CategoryBudgetRequest(_categoryId, -100m, 7, 2026);
            var result = await _service.SetBudgetAsync(_userId, request);

            Assert.True(result.IsFailure);
            Assert.Contains("cannot be negative", result.Error.Message.ToLower());
        }

        [Fact]
        public async Task SetBudget_ShouldFail_WhenCategoryDoesNotExist()
        {
            var request = new CategoryBudgetRequest(Guid.NewGuid(), 500m, 7, 2026);
            var result = await _service.SetBudgetAsync(_userId, request);

            Assert.True(result.IsFailure);
            Assert.Equal("Category.NotFound", result.Error.Code);
        }

        [Fact]
        public async Task SetBudget_ShouldCreate_WhenBudgetDoesNotExist()
        {
            var request = new CategoryBudgetRequest(_categoryId, 450m, 7, 2026);
            var result = await _service.SetBudgetAsync(_userId, request);

            Assert.True(result.IsSuccess);
            Assert.Equal(450m, result.Value.LimitAmount);
            Assert.Equal(7, result.Value.Month);
            Assert.Equal(2026, result.Value.Year);

            var saved = await _context.TblCategoryBudgets.FirstOrDefaultAsync(b => b.CategoryId == _categoryId && b.UserId == _userId);
            Assert.NotNull(saved);
            Assert.Equal(450m, saved.LimitAmount);
        }

        [Fact]
        public async Task SetBudget_ShouldUpdate_WhenBudgetAlreadyExists()
        {
            // Seed existing
            var existing = new TblCategoryBudget
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                CategoryId = _categoryId,
                LimitAmount = 300m,
                Month = 7,
                Year = 2026
            };
            _context.TblCategoryBudgets.Add(existing);
            await _context.SaveChangesAsync();

            var request = new CategoryBudgetRequest(_categoryId, 350m, 7, 2026);
            var result = await _service.SetBudgetAsync(_userId, request);

            Assert.True(result.IsSuccess);
            Assert.Equal(350m, result.Value.LimitAmount);

            var saved = await _context.TblCategoryBudgets.FindAsync(existing.Id);
            Assert.Equal(350m, saved!.LimitAmount);
        }

        [Fact]
        public async Task GetBudgets_ShouldCalculateSpentAmountCorrectly()
        {
            // Seed Budget
            var budget = new TblCategoryBudget
            {
                UserId = _userId,
                CategoryId = _categoryId,
                LimitAmount = 1000m,
                Month = 7,
                Year = 2026
            };
            _context.TblCategoryBudgets.Add(budget);

            // Bangkok timezone calculation starts at (2026, 7, 1) Bangkok which is 2026-06-30T17:00:00Z UTC
            // Seed Transaction inside date range
            var txIn = new TblTransaction
            {
                UserId = _userId,
                CategoryId = _categoryId,
                Amount = 150m,
                TransactionType = "Expense",
                Date = new DateTime(2026, 7, 15, 12, 0, 0, DateTimeKind.Utc)
            };

            // Seed Transaction outside date range
            var txOut = new TblTransaction
            {
                UserId = _userId,
                CategoryId = _categoryId,
                Amount = 250m,
                TransactionType = "Expense",
                Date = new DateTime(2026, 8, 15, 12, 0, 0, DateTimeKind.Utc)
            };

            _context.TblTransactions.AddRange(txIn, txOut);
            await _context.SaveChangesAsync();

            var result = await _service.GetBudgetsAsync(_userId, 7, 2026);

            Assert.True(result.IsSuccess);
            var budgetResponse = result.Value.FirstOrDefault(b => b.CategoryId == _categoryId);
            Assert.NotNull(budgetResponse);
            Assert.Equal(1000m, budgetResponse.LimitAmount);
            Assert.Equal(150m, budgetResponse.AmountSpent); // Verify only the July transaction is included
        }
    }
}
