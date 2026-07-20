using System;
using Microsoft.AspNetCore.Authorization;

namespace ST_finance.Domain.Features.Authentication
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = false)]
    public class HasPermissionAttribute : AuthorizeAttribute
    {
        public HasPermissionAttribute(string permission) : base(policy: $"Permission:{permission}")
        {
        }
    }
}
