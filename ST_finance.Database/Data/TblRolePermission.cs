using System;
using Microsoft.AspNetCore.Identity;

namespace ST_finance.Database.Data
{
    public class TblRolePermission
    {
        public Guid RoleId { get; set; }
        public string Permission { get; set; } = null!;
        public virtual IdentityRole<Guid> Role { get; set; } = null!;
    }
}
