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
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Dynamic RBAC Settings</h2>
        <p className="text-sm text-zinc-400">Map string permissions dynamically to user identity roles in the database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Role List & Create Role */}
        <div className="space-y-6">
          {/* Create Role Panel */}
          <div className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              Create Custom Role
            </h3>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. Moderator, CustomerCare..."
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-850 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-200"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
              <button
                type="submit"
                disabled={createRoleMutation.isPending}
                className="w-full py-2 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-white transition-colors"
              >
                Create Role
              </button>
            </form>
          </div>

          {/* Quick User Role Assignment */}
          <div className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              Reassign User Role
            </h3>
            <form onSubmit={handleAssignRoleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Enter User GUID / ID..."
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-850 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-200"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
              <select
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-850 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-400"
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
                className="w-full py-2 text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-white transition-colors"
              >
                Reassign Role
              </button>
            </form>
          </div>
        </div>

        {/* Middle Column: Roles Grid */}
        <div className="bg-zinc-900/30 rounded-xl border border-zinc-850 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            System Roles Mapping
          </h3>

          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-800 border-t-indigo-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedRole?.name === role.name
                      ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400"
                      : "bg-zinc-900/20 border-zinc-850 text-zinc-300 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-zinc-200">{role.name}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                      {role.permissions.length} perms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Permission Editor */}
        <div className="bg-zinc-900/30 rounded-xl border border-zinc-850 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Permissions Configurator
            </h3>

            {selectedRole ? (
              <div className="space-y-4">
                <div className="pb-2 border-b border-zinc-850">
                  <p className="text-xs text-zinc-500">Configuring Role:</p>
                  <p className="text-sm font-bold text-zinc-100">{selectedRole.name}</p>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedRole.permissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handlePermissionToggle(perm.id)}
                        className="flex gap-3 p-2.5 rounded-lg hover:bg-zinc-800/20 cursor-pointer transition-colors border border-transparent hover:border-zinc-850"
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-zinc-600 shrink-0" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">{perm.name}</p>
                          <p className="text-[10px] text-zinc-500 leading-normal">{perm.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-center text-xs text-zinc-500">
                Select a role from the mapping column to configure its dynamic permissions.
              </div>
            )}
          </div>

          {selectedRole && (
            <div className="pt-4 border-t border-zinc-850 mt-4">
              <button
                onClick={handleSavePermissions}
                disabled={updatePermissionsMutation.isPending}
                className="w-full py-2 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-white transition-colors"
              >
                Save Role Permissions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
