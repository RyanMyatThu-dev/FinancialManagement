"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import { ShieldCheck, Plus, CheckSquare, Square, UserCheck, ShieldAlert } from "lucide-react";

interface RolePermissionMap {
  id: string;
  name: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { id: "User.Read", name: "Read Users", desc: "View registered student lists and profiles." },
  { id: "User.Write", name: "Write Users", desc: "Block/unblock and edit user states." },
  { id: "User.Delete", name: "Purge User Data", desc: "Delete and reset user accounts, transactions, and goals." },
  { id: "Rbac.Read", name: "Read RBAC", desc: "View system roles and permission structures." },
  { id: "Rbac.Write", name: "Write RBAC", desc: "Create roles, bind permissions, and assign user roles." },
  { id: "Report.Read", name: "Read Reports", desc: "View student feedback, support tickets, and bugs." },
  { id: "Report.Write", name: "Write Reports", desc: "Modify report status, resolve support tickets." },
];

export default function RbacPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState<RolePermissionMap | null>(null);
  
  // Assign Role to User state
  const [targetUserId, setTargetUserId] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // Fetch Roles
  const { data: roles = [], isLoading } = useQuery<RolePermissionMap[]>({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/roles");
      return res.data.value;
    },
  });

  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiClient.post("/api/admin/roles", { roleName: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      showToast("Role created successfully.", "success");
      setNewRoleName("");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || "Failed to create role.", "error");
    },
  });

  // Update Role Permissions Mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleName, permissions }: { roleName: string; permissions: string[] }) => {
      await apiClient.put(`/api/admin/roles/${roleName}/permissions`, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      showToast("Role permissions updated successfully.", "success");
      setSelectedRole(null);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || "Failed to update permissions.", "error");
    },
  });

  // Assign Role to User Mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiClient.put(`/api/admin/users/${userId}/roles`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast("User role reassigned successfully.", "success");
      setTargetUserId("");
      setTargetRole("");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || "Failed to assign role to user.", "error");
    },
  });

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    createRoleMutation.mutate(newRoleName.trim());
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedRole) return;

    const isMapped = selectedRole.permissions.includes(permissionId);
    let updatedPermissions = [];

    if (isMapped) {
      updatedPermissions = selectedRole.permissions.filter((p) => p !== permissionId);
    } else {
      updatedPermissions = [...selectedRole.permissions, permissionId];
    }

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions,
    });
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    updatePermissionsMutation.mutate({
      roleName: selectedRole.name,
      permissions: selectedRole.permissions,
    });
  };

  const handleAssignRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !targetRole) return;
    assignRoleMutation.mutate({ userId: targetUserId.trim(), role: targetRole });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Dynamic RBAC Settings</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Map string permissions dynamically to user identity roles in the database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Role List & Create Role */}
        <div className="space-y-6">
          {/* Create Role Panel */}
          <div className="bg-[hsl(var(--card))] p-6 rounded-xl border border-[hsl(var(--border))] space-y-4">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[hsl(var(--primary))]" />
              Create Custom Role
            </h3>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. Moderator, CustomerCare..."
                className="w-full px-3 py-2 text-xs bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-lg focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
              <button
                type="submit"
                disabled={createRoleMutation.isPending}
                className="w-full py-2 text-xs bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] hover:shadow-[0_0_12px_rgba(57,255,20,0.35)] font-bold rounded-lg transition-all"
              >
                Create Role
              </button>
            </form>
          </div>

          {/* Quick User Role Assignment */}
          <div className="bg-[hsl(var(--card))] p-6 rounded-xl border border-[hsl(var(--border))] space-y-4">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
              Reassign User Role
            </h3>
            <form onSubmit={handleAssignRoleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Enter User GUID / ID..."
                className="w-full px-3 py-2 text-xs bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-lg focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
              <select
                className="w-full px-3 py-2 text-xs bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-lg focus:outline-none focus:border-[hsl(var(--primary))] text-[hsl(var(--muted-foreground))]"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="">Select Role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={assignRoleMutation.isPending}
                className="w-full py-2 text-xs bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] hover:shadow-[0_0_12px_rgba(57,255,20,0.35)] font-bold rounded-lg transition-all"
              >
                Reassign Role
              </button>
            </form>
          </div>
        </div>

        {/* Middle Column: Roles Grid */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
            System Roles Mapping
          </h3>

          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-[hsl(var(--secondary))] border-t-[hsl(var(--primary))]" />
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedRole?.name === role.name
                      ? "bg-[hsl(var(--primary)/0.08)] border-[hsl(var(--primary)/0.4)] text-[hsl(var(--primary))]"
                      : "bg-[hsl(var(--secondary)/0.3)] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/0.5)] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{role.name}</span>
                    <span className="text-[10px] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] px-2 py-0.5 rounded font-mono border border-[hsl(var(--border))]">
                      {role.permissions.length} perms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Permission Editor */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[hsl(var(--chula-pink))]" />
              Permissions Configurator
            </h3>

            {selectedRole ? (
              <div className="space-y-4">
                <div className="pb-2 border-b border-[hsl(var(--border))]">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Configuring Role:</p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{selectedRole.name}</p>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedRole.permissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handlePermissionToggle(perm.id)}
                        className="flex gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--accent)/0.4)] cursor-pointer transition-colors border border-transparent hover:border-[hsl(var(--border))]"
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-[hsl(var(--muted-foreground))/0.6] shrink-0" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{perm.name}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-normal">{perm.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-center text-xs text-[hsl(var(--muted-foreground))]">
                Select a role from the mapping column to configure its dynamic permissions.
              </div>
            )}
          </div>

          {selectedRole && (
            <div className="pt-4 border-t border-[hsl(var(--border))] mt-4">
              <button
                onClick={handleSavePermissions}
                disabled={updatePermissionsMutation.isPending}
                className="w-full py-2 text-xs bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] hover:shadow-[0_0_12px_rgba(57,255,20,0.35)] font-bold rounded-lg transition-all"
              >
                Save Role Permissions
              </button>
            </div>
          )}
        </div>
    </div>
  );
}
