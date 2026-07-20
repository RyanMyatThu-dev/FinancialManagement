"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import { Search, Ban, RotateCcw, ShieldAlert, CheckCircle2, UserCog } from "lucide-react";

interface UserProfile {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  isBlocked: boolean;
  role: string;
  profile?: {
    monthlyAllowanceAmount?: number;
    allowanceDayOfMonth?: number;
    targetMonthlySavings?: number;
    currency?: string;
    resetFrequency?: string;
    enableQuotaPacing?: boolean;
  };
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: async () => {
      const res = await apiClient.get(`/api/admin/users?search=${search}&page=${page}&pageSize=10`);
      return res.data.value;
    },
  });

  // Toggle Block User Mutation
  const blockMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post(`/api/admin/users/${userId}/block`);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      const userObj = data?.users.find((u: UserProfile) => u.id === userId);
      const action = userObj?.isBlocked ? "unblocked" : "blocked";
      showToast(`User ${userObj?.userName} has been successfully ${action}.`, "success");
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || "Failed to update block status.", "error");
    },
  });

  // Reset User Data Mutation
  const resetMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/admin/users/${userId}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast(`User data for ${selectedUser?.userName} has been purged and reset.`, "success");
      setShowResetModal(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || "Failed to reset user data.", "error");
    },
  });

  const handleResetClick = (user: UserProfile) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const users = data?.users || [];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / 10);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">User Control Center</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Audit registrations, reset accounts, block user access, and configure profile parameters.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-[hsl(var(--card))] p-4 rounded-xl border border-[hsl(var(--border))]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-lg focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] text-[hsl(var(--foreground))] transition-colors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Grid / Table */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--secondary))] border-t-[hsl(var(--primary))]" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-[hsl(var(--muted-foreground))]">
            No registered users found matching the query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[hsl(var(--secondary)/0.3)] border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Identity Role</th>
                  <th className="px-6 py-4">Stipend Status</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))/0.4] text-[hsl(var(--foreground))]">
                {users.map((user: UserProfile) => (
                  <tr key={user.id} className="hover:bg-[hsl(var(--accent)/0.4)] transition-colors group">
                    <td className="px-6 py-4 relative before:hidden group-hover:before:block before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-[hsl(var(--primary))]">
                      <div>
                        <div className="font-medium text-[hsl(var(--foreground))]">{user.fullName}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">@{user.userName} • {user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                        user.role === "Admin" 
                          ? "bg-[hsl(var(--chula-pink)/0.08)] text-[hsl(var(--chula-pink))] border-[hsl(var(--chula-pink)/0.2)]" 
                          : "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.2)]"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[hsl(var(--muted-foreground))]">
                      {user.profile ? (
                        <div>
                          <div className="font-semibold text-[hsl(var(--foreground))]">
                            {user.profile.monthlyAllowanceAmount?.toLocaleString()} {user.profile.currency}
                          </div>
                          <div>Day {user.profile.allowanceDayOfMonth} • {user.profile.resetFrequency}</div>
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))/0.6]">No profile created</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--destructive))] font-medium">
                          <Ban className="h-3.5 w-3.5" />
                          Blocked
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--primary))] font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Block/Unblock Button */}
                        <button
                          onClick={() => blockMutation.mutate(user.id)}
                          disabled={blockMutation.isPending}
                          className={`p-1.5 rounded-lg border transition-all duration-200 ${
                            user.isBlocked
                              ? "bg-[hsl(var(--primary)/0.08)] border-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.15)] hover:shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                              : "bg-[hsl(var(--destructive)/0.08)] border-[hsl(var(--destructive)/0.2)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.15)] hover:shadow-[0_0_12px_rgba(255,0,0,0.15)]"
                          }`}
                          title={user.isBlocked ? "Unblock User" : "Block User"}
                        >
                          <Ban className="h-4 w-4" />
                        </button>

                        {/* Reset Data Button */}
                        <button
                          onClick={() => handleResetClick(user)}
                          className="p-1.5 rounded-lg bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
                          title="Purge/Reset User Data"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.1)]">
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Showing page {page} of {pageCount} ({total} total users)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 text-xs bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] disabled:opacity-50 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-md transition-all"
              >
                Previous
              </button>
              <button
                disabled={page === pageCount}
                onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
                className="px-3 py-1.5 text-xs bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] disabled:opacity-50 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-md transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Purge Reset Confirmation Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-[hsl(var(--destructive))]">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <h3 className="font-bold text-[hsl(var(--foreground))] text-lg">Confirm Account Reset</h3>
              </div>
              
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Are you absolutely sure you want to reset all data for <span className="font-semibold text-[hsl(var(--foreground))]">@{selectedUser.userName}</span> ({selectedUser.fullName})?
              </p>

              <div className="bg-[hsl(var(--destructive)/0.05)] border border-[hsl(var(--destructive)/0.15)] p-3 rounded-lg text-xs text-[hsl(var(--destructive))] space-y-1">
                <p className="font-semibold">This action will delete:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>All accounts, transactions, and categories</li>
                  <li>All recurring schedules and budget limits</li>
                  <li>All savings goals and savings contributions</li>
                  <li>All daily safe-to-spend quota logs</li>
                </ul>
                <p className="font-semibold pt-1 text-[hsl(var(--muted-foreground))]">The user login credentials and login access will NOT be deleted.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[hsl(var(--secondary)/0.15)] border-t border-[hsl(var(--border))]">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => resetMutation.mutate(selectedUser.id)}
                disabled={resetMutation.isPending}
                className="px-4 py-2 text-xs bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.9)] text-[hsl(var(--destructive-foreground))] font-semibold rounded-lg hover:shadow-[0_0_12px_rgba(255,0,0,0.3)] transition-all flex items-center gap-1.5"
              >
                {resetMutation.isPending ? (
                  <span className="h-3.5 w-3.5 border-2 border-[hsl(var(--destructive-foreground)/0.2)] border-t-[hsl(var(--destructive-foreground))] rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Purge All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
