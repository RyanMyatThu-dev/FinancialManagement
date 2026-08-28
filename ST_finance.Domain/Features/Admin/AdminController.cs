using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Authentication;
using ST_finance.Shared;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ST_finance.Domain.Features.Admin
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminController : ApiControllerBase
    {
        private readonly UserManager<TblUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly AppDbContext _context;

        public AdminController(
            UserManager<TblUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            AppDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        // ── USER MANAGEMENT ──────────────────────────────────────────────

        [HttpGet("users")]
        [HasPermission("User.Read")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _userManager.Users.Include(u => u.TblUserProfile).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(u =>
                    (u.UserName != null && u.UserName.ToLower().Contains(lowerSearch)) ||
                    (u.Email != null && u.Email.ToLower().Contains(lowerSearch)) ||
                    (u.FullName != null && u.FullName.ToLower().Contains(lowerSearch)));
            }

            var total = await query.CountAsync();
            var users = await query
                .OrderBy(u => u.UserName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userDtos = new List<object>();
            foreach (var user in users)
            {
                var userRoles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.FullName,
                    IsBlocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow,
                    Role = userRoles.FirstOrDefault() ?? "Student",
                    Profile = user.TblUserProfile != null ? new
                    {
                        user.TblUserProfile.MonthlyAllowanceAmount,
                        user.TblUserProfile.AllowanceDayOfMonth,
                        user.TblUserProfile.TargetMonthlySavings,
                        user.TblUserProfile.Currency,
                        user.TblUserProfile.ResetFrequency,
                        user.TblUserProfile.EnableQuotaPacing
                    } : null
                });
            }

            return Ok(Result.Success(new { total, users = userDtos, page, pageSize }));
        }

        [HttpPost("users/{id}/block")]
        [HasPermission("User.Write")]
        public async Task<IActionResult> ToggleBlockUser(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(Result.Failure(CustomErrors.Auth.UserNotFound));
            }

            bool isBlocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow;
            if (isBlocked)
            {
                await _userManager.SetLockoutEndDateAsync(user, null);
            }
            else
            {
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            }

            return Ok(Result.Success(new { isBlocked = !isBlocked }));
        }

        [HttpDelete("users/{id}/reset")]
        [HasPermission("User.Delete")]
        public async Task<IActionResult> ResetUserData(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(Result.Failure(CustomErrors.Auth.UserNotFound));
            }

            await UserDataCleanup.DeleteAllUserDataAsync(_context, id);
            return Ok(Result.Success(new { message = "User transaction and configuration data reset successfully." }));
        }

        // ── DYNAMIC RBAC MANAGEMENT ──────────────────────────────────────

        [HttpGet("roles")]
        [HasPermission("Rbac.Read")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            var rolePermissions = await _context.TblRolePermissions.ToListAsync();

            var roleList = roles.Select(r => new
            {
                r.Id,
                r.Name,
                Permissions = rolePermissions
                    .Where(rp => rp.RoleId == r.Id)
                    .Select(rp => rp.Permission)
                    .ToList()
            }).ToList();

            return Ok(Result.Success(roleList));
        }

        [HttpPost("roles")]
        [HasPermission("Rbac.Write")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var exists = await _roleManager.RoleExistsAsync(request.RoleName);
            if (exists)
            {
                return BadRequest(Result.Failure(new Error("Rbac.DuplicateRole", "Role already exists.")));
            }

            var result = await _roleManager.CreateAsync(new IdentityRole<Guid>
            {
                Id = Guid.NewGuid(),
                Name = request.RoleName
            });

            if (!result.Succeeded)
            {
                var errStr = string.Join("; ", result.Errors.Select(e => e.Description));
                return BadRequest(Result.Failure(new Error("Rbac.FailedToCreate", errStr)));
            }

            return Ok(Result.Success());
        }

        [HttpPut("roles/{roleName}/permissions")]
        [HasPermission("Rbac.Write")]
        public async Task<IActionResult> UpdateRolePermissions(string roleName, [FromBody] UpdateRolePermissionsRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
            {
                return NotFound(Result.Failure(new Error("Rbac.RoleNotFound", "Role not found.")));
            }

            // Remove existing mappings
            var existing = await _context.TblRolePermissions.Where(rp => rp.RoleId == role.Id).ToListAsync();
            _context.TblRolePermissions.RemoveRange(existing);

            // Add new mappings
            foreach (var permission in request.Permissions)
            {
                _context.TblRolePermissions.Add(new TblRolePermission
                {
                    RoleId = role.Id,
                    Permission = permission
                });
            }

            await _context.SaveChangesAsync();
            return Ok(Result.Success());
        }

        [HttpPut("users/{id}/roles")]
        [HasPermission("Rbac.Write")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(Result.Failure(CustomErrors.Auth.UserNotFound));
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                var roleExists = await _roleManager.RoleExistsAsync(request.Role);
                if (!roleExists)
                {
                    return BadRequest(Result.Failure(new Error("Rbac.RoleNotFound", "Role does not exist.")));
                }
                await _userManager.AddToRoleAsync(user, request.Role);
            }

            return Ok(Result.Success());
        }

        // ── USER REPORT / FEEDBACK OVERSIGHT ─────────────────────────────

        [HttpGet("reports")]
        [HasPermission("Report.Read")]
        public async Task<IActionResult> GetReports(
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.TblUserReports.Include(r => r.User).AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var total = await query.CountAsync();
            var reports = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Title,
                    r.Description,
                    r.Status,
                    r.CreatedAt,
                    User = new
                    {
                        r.User.Id,
                        r.User.UserName,
                        r.User.Email,
                        r.User.FullName
                    }
                })
                .ToListAsync();

            return Ok(Result.Success(new { total, reports, page, pageSize }));
        }

        [HttpPut("reports/{id}/status")]
        [HasPermission("Report.Write")]
        public async Task<IActionResult> UpdateReportStatus(Guid id, [FromBody] UpdateReportStatusRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var report = await _context.TblUserReports.FirstOrDefaultAsync(r => r.Id == id);
            if (report == null)
            {
                return NotFound(Result.Failure(new Error("Report.NotFound", "Report not found.")));
            }

            report.Status = request.Status;
            await _context.SaveChangesAsync();

            return Ok(Result.Success());
        }
    }

    public record CreateRoleRequest(
        [Required][MaxLength(50)] string RoleName
    );

    public record UpdateRolePermissionsRequest(
        [Required] List<string> Permissions
    );

    public record UpdateUserRoleRequest(
        [Required] string Role
    );

    public record UpdateReportStatusRequest(
        [Required][MaxLength(20)] string Status
    );
}
