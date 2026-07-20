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
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">User Control Center</h2>
        <p className="text-sm text-zinc-400">Audit registrations, reset accounts, block user access, and configure profile parameters.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-950 border border-zinc-850 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-200 transition-colors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Grid / Table */}
      <div className="bg-zinc-900/30 rounded-xl border border-zinc-850 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-indigo-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            No registered users found matching the query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-900/60 border-b border-zinc-850 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Identity Role</th>
                  <th className="px-6 py-4">Stipend Status</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-zinc-300">
                {users.map((user: UserProfile) => (
                  <tr key={user.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-zinc-100">{user.fullName}</div>
                        <div className="text-xs text-zinc-500">@{user.userName} • {user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        user.role === "Admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {user.profile ? (
                        <div>
                          <div className="font-semibold text-zinc-200">
                            {user.profile.monthlyAllowanceAmount?.toLocaleString()} {user.profile.currency}
                          </div>
                          <div>Day {user.profile.allowanceDayOfMonth} • {user.profile.resetFrequency}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">No profile created</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                          <Ban className="h-3.5 w-3.5" />
                          Blocked
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
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
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                          }`}
                          title={user.isBlocked ? "Unblock User" : "Block User"}
                        >
                          <Ban className="h-4 w-4" />
                        </button>

                        {/* Reset Data Button */}
                        <button
                          onClick={() => handleResetClick(user)}
                          className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-850/60 bg-zinc-900/10">
            <div className="text-xs text-zinc-500">
              Showing page {page} of {pageCount} ({total} total users)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md disabled:opacity-50 text-zinc-300"
              >
                Previous
              </button>
              <button
                disabled={page === pageCount}
                onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
                className="px-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-md disabled:opacity-50 text-zinc-300"
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
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <h3 className="font-bold text-zinc-100 text-lg">Confirm Account Reset</h3>
              </div>
              
              <p className="text-sm text-zinc-400">
                Are you absolutely sure you want to reset all data for <span className="font-semibold text-zinc-200">@{selectedUser.userName}</span> ({selectedUser.fullName})?
              </p>

              <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg text-xs text-red-400 space-y-1">
                <p className="font-semibold">This action will delete:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>All accounts, transactions, and categories</li>
                  <li>All recurring schedules and budget limits</li>
                  <li>All savings goals and savings contributions</li>
                  <li>All daily safe-to-spend quota logs</li>
                </ul>
                <p className="font-semibold pt-1">The user login credentials and login access will NOT be deleted.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-950/40 border-t border-zinc-850">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => resetMutation.mutate(selectedUser.id)}
                disabled={resetMutation.isPending}
                className="px-4 py-2 text-xs bg-red-600 hover:bg-red-500 font-semibold rounded-lg text-white transition-colors flex items-center gap-1.5"
              >
                {resetMutation.isPending ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
