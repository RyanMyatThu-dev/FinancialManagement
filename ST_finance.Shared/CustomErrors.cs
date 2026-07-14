namespace ST_finance.Shared
{
    public static class CustomErrors
    {
        public static class Validation
        {
            public static Error InvalidInput(string message) => new("Validation.InvalidInput", message);
            public static readonly Error GeneralError = new("Validation.GeneralError", "One or more validation errors occurred.");
        }

        public static class Account
        {
            public static readonly Error NotFound = new("Account.NotFound", "The requested account was not found.");
            public static readonly Error DuplicateName = new("Account.DuplicateName", "An account with this name already exists.");
            public static readonly Error BalanceSyncError = new("Account.BalanceSyncError", "Failed to sync account balances.");
            public static readonly Error HasTransactions = new("Account.HasTransactions", "This account is linked to transaction history and cannot be deleted without force.");
        }

        public static class Transaction
        {
            public static readonly Error NotFound = new("Transaction.NotFound", "The requested transaction was not found.");
            public static readonly Error InvalidType = new("Transaction.InvalidType", "Invalid transaction type. Must be 'Income', 'Expense', or 'Transfer'.");
            public static readonly Error NegativeAmount = new("Transaction.NegativeAmount", "Transaction amount cannot be negative.");
            public static readonly Error MissingTargetAccount = new("Transaction.MissingTargetAccount", "Target account is required for transfers.");
            public static readonly Error SameAccounts = new("Transaction.SameAccounts", "Source and target accounts must be different.");
            public static readonly Error InsufficientNetBalance = new("Transaction.InsufficientNetBalance", "This action is blocked because it would result in a negative total net balance.");
        }

        public static class Auth
        {
            public static readonly Error UserNotFound = new("Auth.UserNotFound", "User not found.");
            public static readonly Error InvalidCredentials = new("Auth.InvalidCredentials", "Invalid email or password.");
            public static readonly Error RegistrationFailed = new("Auth.RegistrationFailed", "User registration failed.");
            public static readonly Error RefreshTokenExpired = new("Auth.RefreshTokenExpired", "Refresh token has expired or is invalid.");
            public static readonly Error ProfileNotFound = new("Auth.ProfileNotFound", "User profile not found.");
            public static readonly Error EmailAlreadyRegistered = new("Auth.EmailAlreadyRegistered", "Email is already registered.");
            public static readonly Error InvalidOtp = new("Auth.InvalidOtp", "Invalid or expired verification code.");
            public static readonly Error EmailInUse = new("Auth.EmailInUse", "This email address is already in use.");
            public static readonly Error UsernameInUse = new("Auth.UsernameInUse", "This username is already taken.");
            public static readonly Error IncorrectPassword = new("Auth.IncorrectPassword", "Current password is incorrect.");
        }
    }
}
