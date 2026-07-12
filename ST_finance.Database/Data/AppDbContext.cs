using ST_finance.Shared.Enums;
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace ST_finance.Database.Data;

public partial class AppDbContext : IdentityDbContext<TblUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<TblAccount> TblAccounts { get; set; }

    public virtual DbSet<TblCategory> TblCategories { get; set; }

    public virtual DbSet<TblCategoryBudget> TblCategoryBudgets { get; set; }

    public virtual DbSet<TblDailyQuotaLog> TblDailyQuotaLogs { get; set; }

    public virtual DbSet<TblRecurringSchedule> TblRecurringSchedules { get; set; }

    public virtual DbSet<TblSavingsContribution> TblSavingsContributions { get; set; }

    public virtual DbSet<TblSavingsGoal> TblSavingsGoals { get; set; }

    public virtual DbSet<TblTag> TblTags { get; set; }

    public virtual DbSet<TblTransaction> TblTransactions { get; set; }

    public virtual DbSet<TblUser> TblUsers { get; set; }

    public virtual DbSet<TblUserProfile> TblUserProfiles { get; set; }

    public virtual DbSet<TblOtpVerification> TblOtpVerifications { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=chula_financial_db;Username=postgres;Password=postgres;");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global Query Filters for Soft Deletes
        modelBuilder.Entity<TblUser>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.Entity<TblAccount>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.Entity<TblCategory>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.Entity<TblTag>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.Entity<TblTransaction>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.Entity<TblRecurringSchedule>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.Entity<TblCategoryBudget>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.Entity<TblSavingsGoal>().HasQueryFilter(e => !e.DeleteFlag);
        modelBuilder.HasPostgresExtension("uuid-ossp");

        modelBuilder.Entity<TblAccount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_Account_pkey");

            entity.ToTable("Tbl_Account");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.AccountType)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasColumnName("account_type");
            entity.Property(e => e.Balance)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("0.00")
                .HasColumnName("balance");
            entity.Property(e => e.Color)
                .HasMaxLength(7)
                .HasDefaultValueSql("'#4F46E5'::character varying")
                .HasColumnName("color");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.Icon)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Wallet'::character varying")
                .HasColumnName("icon");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.TblAccounts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_Account_user_id_fkey");
        });

        modelBuilder.Entity<TblCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_Category_pkey");

            entity.ToTable("Tbl_Category");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Color)
                .HasMaxLength(7)
                .HasDefaultValueSql("'#4F46E5'::character varying")
                .HasColumnName("color");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.Icon)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Tag'::character varying")
                .HasColumnName("icon");
            entity.Property(e => e.IsDefault)
                .HasDefaultValue(false)
                .HasColumnName("is_default");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.Type)
                .HasMaxLength(10)
                .HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.TblCategories)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_Category_user_id_fkey");
        });

        modelBuilder.Entity<TblCategoryBudget>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_CategoryBudget_pkey");

            entity.ToTable("Tbl_CategoryBudget");

            entity.HasIndex(e => new { e.UserId, e.CategoryId, e.Month, e.Year }, "unique_user_category_budget_period").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.LimitAmount)
                .HasPrecision(12, 2)
                .HasColumnName("limit_amount");
            entity.Property(e => e.Month).HasColumnName("month");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Year).HasColumnName("year");

            entity.HasOne(d => d.Category).WithMany(p => p.TblCategoryBudgets)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("Tbl_CategoryBudget_category_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.TblCategoryBudgets)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_CategoryBudget_user_id_fkey");
        });

        modelBuilder.Entity<TblDailyQuotaLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_DailyQuotaLog_pkey");

            entity.ToTable("Tbl_DailyQuotaLog");

            entity.HasIndex(e => new { e.UserId, e.Date }, "unique_user_daily_quota_date").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.ActualSpent)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("0.00")
                .HasColumnName("actual_spent");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Date).HasColumnName("date");
            entity.Property(e => e.TargetQuota)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("0.00")
                .HasColumnName("target_quota");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.TblDailyQuotaLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_DailyQuotaLog_user_id_fkey");
        });

        modelBuilder.Entity<TblRecurringSchedule>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_RecurringSchedule_pkey");

            entity.ToTable("Tbl_RecurringSchedule");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.AccountId).HasColumnName("account_id");
            entity.Property(e => e.Amount)
                .HasPrecision(12, 2)
                .HasColumnName("amount");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.DayOfMonth).HasColumnName("day_of_month");
            entity.Property(e => e.DayOfWeek).HasColumnName("day_of_week");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.Frequency)
                .HasMaxLength(20)
                .HasColumnName("frequency");
            entity.Property(e => e.LastTriggeredAt).HasColumnName("last_triggered_at");
            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .HasColumnName("name");
            entity.Property(e => e.NextOccurrenceDate).HasColumnName("next_occurrence_date");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.TargetAccountId).HasColumnName("target_account_id");
            entity.Property(e => e.TransactionType)
                .HasMaxLength(10)
                .HasColumnName("transaction_type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Account).WithMany(p => p.TblRecurringScheduleAccounts)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("Tbl_RecurringSchedule_account_id_fkey");

            entity.HasOne(d => d.Category).WithMany(p => p.TblRecurringSchedules)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("Tbl_RecurringSchedule_category_id_fkey");

            entity.HasOne(d => d.TargetAccount).WithMany(p => p.TblRecurringScheduleTargetAccounts)
                .HasForeignKey(d => d.TargetAccountId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("Tbl_RecurringSchedule_target_account_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.TblRecurringSchedules)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_RecurringSchedule_user_id_fkey");
        });

        modelBuilder.Entity<TblSavingsContribution>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_SavingsContribution_pkey");

            entity.ToTable("Tbl_SavingsContribution");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasPrecision(12, 2)
                .HasColumnName("amount");
            entity.Property(e => e.Date)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("date");
            entity.Property(e => e.Note)
                .HasMaxLength(250)
                .HasColumnName("note");
            entity.Property(e => e.SavingsGoalId).HasColumnName("savings_goal_id");
            entity.Property(e => e.TransactionId).HasColumnName("transaction_id");

            entity.HasOne(d => d.SavingsGoal).WithMany(p => p.TblSavingsContributions)
                .HasForeignKey(d => d.SavingsGoalId)
                .HasConstraintName("Tbl_SavingsContribution_savings_goal_id_fkey");

            entity.HasOne(d => d.Transaction).WithMany(p => p.TblSavingsContributions)
                .HasForeignKey(d => d.TransactionId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("Tbl_SavingsContribution_transaction_id_fkey");
        });

        modelBuilder.Entity<TblSavingsGoal>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_SavingsGoal_pkey");

            entity.ToTable("Tbl_SavingsGoal");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.GoalName)
                .HasMaxLength(150)
                .HasColumnName("goal_name");
            entity.Property(e => e.IsCompleted)
                .HasDefaultValue(false)
                .HasColumnName("is_completed");
            entity.Property(e => e.TargetAmount)
                .HasPrecision(12, 2)
                .HasColumnName("target_amount");
            entity.Property(e => e.TargetDate).HasColumnName("target_date");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.TblSavingsGoals)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_SavingsGoal_user_id_fkey");
        });

        modelBuilder.Entity<TblTag>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_Tag_pkey");

            entity.ToTable("Tbl_Tag");

            entity.HasIndex(e => new { e.UserId, e.Name }, "unique_user_tag_name").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Color)
                .HasMaxLength(7)
                .HasDefaultValueSql("'#4F46E5'::character varying")
                .HasColumnName("color");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.TblTags)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_Tag_user_id_fkey");
        });

        modelBuilder.Entity<TblTransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_Transaction_pkey");

            entity.ToTable("Tbl_Transaction");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.AccountId).HasColumnName("account_id");
            entity.Property(e => e.Amount)
                .HasPrecision(12, 2)
                .HasColumnName("amount");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Date)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("date");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
            entity.Property(e => e.IsRecurringCreated)
                .HasDefaultValue(false)
                .HasColumnName("is_recurring_created");
            entity.Property(e => e.TargetAccountId).HasColumnName("target_account_id");
            entity.Property(e => e.TransactionType)
                .HasMaxLength(10)
                .HasColumnName("transaction_type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Account).WithMany(p => p.TblTransactionAccounts)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("Tbl_Transaction_account_id_fkey");

            entity.HasOne(d => d.Category).WithMany(p => p.TblTransactions)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("Tbl_Transaction_category_id_fkey");

            entity.HasOne(d => d.TargetAccount).WithMany(p => p.TblTransactionTargetAccounts)
                .HasForeignKey(d => d.TargetAccountId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("Tbl_Transaction_target_account_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.TblTransactions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Tbl_Transaction_user_id_fkey");

            entity.HasMany(d => d.Tags).WithMany(p => p.Transactions)
                .UsingEntity<Dictionary<string, object>>(
                    "TblTransactionTag",
                    r => r.HasOne<TblTag>().WithMany()
                        .HasForeignKey("TagId")
                        .HasConstraintName("Tbl_TransactionTag_tag_id_fkey"),
                    l => l.HasOne<TblTransaction>().WithMany()
                        .HasForeignKey("TransactionId")
                        .HasConstraintName("Tbl_TransactionTag_transaction_id_fkey"),
                    j =>
                    {
                        j.HasKey("TransactionId", "TagId").HasName("Tbl_TransactionTag_pkey");
                        j.ToTable("Tbl_TransactionTag");
                        j.IndexerProperty<Guid>("TransactionId").HasColumnName("transaction_id");
                        j.IndexerProperty<Guid>("TagId").HasColumnName("tag_id");
                    });
        });

        modelBuilder.Entity<TblUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_User_pkey");

            entity.ToTable("Tbl_User");

            entity.HasIndex(e => e.Email, "Tbl_User_email_key").IsUnique();

            entity.HasIndex(e => e.NormalizedEmail, "Tbl_User_normalized_email_key").IsUnique();

            entity.HasIndex(e => e.NormalizedUserName, "Tbl_User_normalized_username_key").IsUnique();

            entity.HasIndex(e => e.UserName, "Tbl_User_username_key").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.AccessFailedCount)
                .HasDefaultValue(0)
                .HasColumnName("access_failed_count");
            entity.Property(e => e.ConcurrencyStamp).HasColumnName("concurrency_stamp");
            entity.Property(e => e.DeleteFlag)
                .HasDefaultValue(false)
                .HasColumnName("delete_flag");
            entity.Property(e => e.Email)
                .HasMaxLength(256)
                .HasColumnName("email");
            entity.Property(e => e.EmailConfirmed)
                .HasDefaultValue(false)
                .HasColumnName("email_confirmed");
            entity.Property(e => e.FullName)
                .HasMaxLength(256)
                .HasColumnName("full_name");
            entity.Property(e => e.LockoutEnabled)
                .HasDefaultValue(false)
                .HasColumnName("lockout_enabled");
            entity.Property(e => e.LockoutEnd).HasColumnName("lockout_end");
            entity.Property(e => e.NormalizedEmail)
                .HasMaxLength(256)
                .HasColumnName("normalized_email");
            entity.Property(e => e.NormalizedUserName)
                .HasMaxLength(256)
                .HasColumnName("normalized_username");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number");
            entity.Property(e => e.PhoneNumberConfirmed)
                .HasDefaultValue(false)
                .HasColumnName("phone_number_confirmed");
            entity.Property(e => e.RefreshToken).HasColumnName("refresh_token");
            entity.Property(e => e.RefreshTokenExpiryTime).HasColumnName("refresh_token_expiry_time");
            entity.Property(e => e.SecurityStamp).HasColumnName("security_stamp");
            entity.Property(e => e.TwoFactorEnabled)
                .HasDefaultValue(false)
                .HasColumnName("two_factor_enabled");
            entity.Property(e => e.UserName)
                .HasMaxLength(256)
                .HasColumnName("username");
        });

        modelBuilder.Entity<TblUserProfile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_UserProfile_pkey");

            entity.ToTable("Tbl_UserProfile");

            entity.HasIndex(e => e.UserId, "Tbl_UserProfile_user_id_key").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.AllowanceDayOfMonth)
                .HasDefaultValue(25)
                .HasColumnName("allowance_day_of_month");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .HasDefaultValueSql("'THB'::character varying")
                .HasColumnName("currency");
            entity.Property(e => e.MonthlyAllowanceAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("16000.00")
                .HasColumnName("monthly_allowance_amount");
            entity.Property(e => e.TargetMonthlySavings)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("2000.00")
                .HasColumnName("target_monthly_savings");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.TblUserProfile)
                .HasForeignKey<TblUserProfile>(d => d.UserId)
                .HasConstraintName("Tbl_UserProfile_user_id_fkey");
        });

        modelBuilder.Entity<TblOtpVerification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tbl_OtpVerification_pkey");

            entity.ToTable("Tbl_OtpVerification");

            entity.HasIndex(e => new { e.Email, e.Purpose }, "Tbl_OtpVerification_email_purpose_idx");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()")
                .HasColumnName("id");
            entity.Property(e => e.Email)
                .HasMaxLength(256)
                .HasColumnName("email");
            entity.Property(e => e.Code)
                .HasMaxLength(6)
                .HasColumnName("code");
            entity.Property(e => e.Purpose)
                .HasMaxLength(50)
                .HasColumnName("purpose");
            entity.Property(e => e.ExpiryTime).HasColumnName("expiry_time");
            entity.Property(e => e.IsUsed)
                .HasDefaultValue(false)
                .HasColumnName("is_used");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
