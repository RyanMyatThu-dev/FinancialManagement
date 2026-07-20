"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useToast } from "@/context/ToastContext";
import { MessageSquareText, Calendar, User, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface TicketReport {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    userName: string;
    email: string;
    fullName: string;
  };
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<TicketReport | null>(null);

  // Fetch Tickets
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", statusFilter, page],
    queryFn: async () => {
      const url = statusFilter 
        ? `/api/admin/reports?status=${statusFilter}&page=${page}&pageSize=10`
        : `/api/admin/reports?page=${page}&pageSize=10`;
      const res = await apiClient.get(url);
      return res.data.value;
    },
  });

  // Update Ticket Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      await apiClient.put(`/api/admin/reports/${ticketId}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      showToast(`Ticket status updated to ${variables.status}.`, "success");
      
      // Update local detailed view if currently selected
      if (selectedTicket && selectedTicket.id === variables.ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          status: variables.status,
        });
      }
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || "Failed to update ticket status.", "error");
    },
  });

  const tickets = data?.reports || [];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Resolved":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </span>
        );
      case "InProgress":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3 animate-spin" /> In Progress
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" /> Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">User Reports & Feedback</h2>
        <p className="text-sm text-zinc-400">Review student-submitted bugs, feedback, and general operations requests.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Ticket List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm">
            <span className="text-xs text-zinc-400 font-medium">Filter Status:</span>
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === "" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => { setStatusFilter("Open"); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === "Open" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => { setStatusFilter("InProgress"); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === "InProgress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => { setStatusFilter("Resolved"); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === "Resolved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Resolved
            </button>
          </div>

          {/* List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-zinc-900/10 rounded-xl border border-zinc-850 p-12 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-indigo-500" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-zinc-900/10 rounded-xl border border-zinc-850 p-12 text-center text-zinc-500">
                No tickets found for this status.
              </div>
            ) : (
              tickets.map((ticket: TicketReport) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 space-y-3 text-left ${
                    selectedTicket?.id === ticket.id
                      ? "bg-indigo-600/5 border-indigo-500/30 shadow-md shadow-indigo-500/5"
                      : "bg-zinc-900/20 border-zinc-850/80 hover:bg-zinc-900/30 hover:border-zinc-800"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-sm text-zinc-200 line-clamp-1">{ticket.title}</h3>
                    {getStatusBadge(ticket.status)}
                  </div>
                  
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 pt-1 border-t border-zinc-900/60">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ticket.user.fullName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/10 border border-zinc-850 rounded-xl">
              <div className="text-xs text-zinc-500">
                Page {page} of {pageCount} ({total} tickets)
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

        {/* Right Column: Ticket Inspector */}
        <div className="bg-zinc-900/30 rounded-xl border border-zinc-850 p-6 h-fit min-h-[300px] flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-6 text-left">
              {/* Header Info */}
              <div className="space-y-2 pb-4 border-b border-zinc-850">
                <div className="flex justify-between items-start gap-3">
                  <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Ticket details</span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="font-bold text-zinc-100 text-base leading-snug">{selectedTicket.title}</h3>
              </div>

              {/* Submitter details */}
              <div className="bg-zinc-950/40 border border-zinc-850 p-3.5 rounded-lg space-y-2 text-xs">
                <p className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-zinc-500" /> Submitter Profile
                </p>
                <div className="text-zinc-400 space-y-1">
                  <p><span className="text-zinc-500">Name:</span> {selectedTicket.user.fullName}</p>
                  <p><span className="text-zinc-500">Email:</span> {selectedTicket.user.email}</p>
                  <p><span className="text-zinc-500">Username:</span> @{selectedTicket.user.userName}</p>
                  <p><span className="text-zinc-500">Submitted:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Ticket Description */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-300">Issue Description</p>
                <div className="bg-zinc-900/60 p-4 rounded-lg text-xs text-zinc-300 leading-relaxed max-h-[220px] overflow-y-auto border border-zinc-850">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Transition actions */}
              <div className="space-y-3 pt-4 border-t border-zinc-850">
                <p className="text-xs font-semibold text-zinc-300">Set Ticket Status</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: "Open" })}
                    disabled={updateStatusMutation.isPending || selectedTicket.status === "Open"}
                    className="py-2 text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold rounded-lg transition-colors disabled:opacity-30"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: "InProgress" })}
                    disabled={updateStatusMutation.isPending || selectedTicket.status === "InProgress"}
                    className="py-2 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 font-semibold rounded-lg transition-colors disabled:opacity-30"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: "Resolved" })}
                    disabled={updateStatusMutation.isPending || selectedTicket.status === "Resolved"}
                    className="py-2 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-semibold rounded-lg transition-colors disabled:opacity-30"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 gap-3">
              <MessageSquareText className="h-8 w-8 text-zinc-600" />
              <p className="text-xs text-zinc-500">
                Select a ticket from the reports column to inspect user feedback and transition status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
