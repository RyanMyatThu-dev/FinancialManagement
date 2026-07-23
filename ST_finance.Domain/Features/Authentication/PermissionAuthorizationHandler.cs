using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ST_finance.Domain.Features.Authentication
{
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly AppDbContext _dbContext;

        public PermissionAuthorizationHandler(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            if (context.User == null)
            {
                return;
            }

            // Extract roles from claims
            var roles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            if (!roles.Any())
            {
                // Fallback: check if the UserId is present, look it up in DB
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    // Query roles dynamically if not embedded in token
                    var userRoles = await _dbContext.UserRoles
                        .Where(ur => ur.UserId == userId)
                        .Join(_dbContext.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .Where(name => name != null)
                        .ToListAsync();

#pragma warning disable CS8604
                    roles.AddRange(userRoles);
#pragma warning restore CS8604
                }
            }

            if (!roles.Any())
            {
                return;
            }

            // Check if any user role maps to the required permission in the DB
            var hasPermission = await _dbContext.TblRolePermissions
                .Join(_dbContext.Roles, rp => rp.RoleId, r => r.Id, (rp, r) => new { rp.Permission, RoleName = r.Name })
                .AnyAsync(x => roles.Contains(x.RoleName) && x.Permission == requirement.Permission);

            if (hasPermission)
            {
                context.Succeed(requirement);
            }
        }
    }
}
