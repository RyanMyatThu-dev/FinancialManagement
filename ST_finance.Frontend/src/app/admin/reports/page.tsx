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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)] flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </span>
        );
      case "InProgress":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.2)] flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3 animate-spin" /> In Progress
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.2)] flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" /> Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">User Reports & Feedback</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Review student-submitted bugs, feedback, and general operations requests.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Ticket List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-[hsl(var(--card))] p-4 rounded-xl border border-[hsl(var(--border))]">
            <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Filter Status:</span>
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors border ${
                statusFilter === "" 
                  ? "bg-[hsl(var(--secondary))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]" 
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border-transparent"
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => { setStatusFilter("Open"); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors border ${
                statusFilter === "Open" 
                  ? "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.2)]" 
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border-transparent"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => { setStatusFilter("InProgress"); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors border ${
                statusFilter === "InProgress" 
                  ? "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]" 
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border-transparent"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => { setStatusFilter("Resolved"); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors border ${
                statusFilter === "Resolved" 
                  ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.2)]" 
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border-transparent"
              }`}
            >
              Resolved
            </button>
          </div>

          {/* List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-12 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--secondary))] border-t-[hsl(var(--primary))]" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-12 text-center text-[hsl(var(--muted-foreground))]">
                No tickets found for this status.
              </div>
            ) : (
              tickets.map((ticket: TicketReport) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 space-y-3 text-left relative hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:bottom-0 hover:before:w-[2px] hover:before:bg-[hsl(var(--primary))] ${
                    selectedTicket?.id === ticket.id
                      ? "bg-[hsl(var(--primary)/0.04)] border-[hsl(var(--primary)/0.3)] shadow-[0_0_12px_rgba(57,255,20,0.03)]"
                      : "bg-[hsl(var(--secondary)/0.3)] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent)/0.4)]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] line-clamp-1">{ticket.title}</h3>
                    {getStatusBadge(ticket.status)}
                  </div>
                  
                  <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-[hsl(var(--muted-foreground))] pt-1 border-t border-[hsl(var(--border))]">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-[hsl(var(--primary))]" />
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
            <div className="flex items-center justify-between px-6 py-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Page {page} of {pageCount} ({total} tickets)
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

        {/* Right Column: Ticket Inspector */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 h-fit min-h-[300px] flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-6 text-left">
              {/* Header Info */}
              <div className="space-y-2 pb-4 border-b border-[hsl(var(--border))]">
                <div className="flex justify-between items-start gap-3">
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-semibold tracking-wider uppercase">Ticket details</span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="font-bold text-[hsl(var(--foreground))] text-base leading-snug">{selectedTicket.title}</h3>
              </div>

              {/* Submitter details */}
              <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] p-3.5 rounded-lg space-y-2 text-xs">
                <p className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Submitter Profile
                </p>
                <div className="text-[hsl(var(--muted-foreground))] space-y-1">
                  <p><span className="text-[hsl(var(--muted-foreground))/0.6]">Name:</span> {selectedTicket.user.fullName}</p>
                  <p><span className="text-[hsl(var(--muted-foreground))/0.6]">Email:</span> {selectedTicket.user.email}</p>
                  <p><span className="text-[hsl(var(--muted-foreground))/0.6]">Username:</span> @{selectedTicket.user.userName}</p>
                  <p><span className="text-[hsl(var(--muted-foreground))/0.6]">Submitted:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Ticket Description */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Issue Description</p>
                <div className="bg-[hsl(var(--secondary)/0.2)] p-4 rounded-lg text-xs text-[hsl(var(--foreground))] leading-relaxed max-h-[220px] overflow-y-auto border border-[hsl(var(--border))]">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Transition actions */}
              <div className="space-y-3 pt-4 border-t border-[hsl(var(--border))]">
                <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Set Ticket Status</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: "Open" })}
                    disabled={updateStatusMutation.isPending || selectedTicket.status === "Open"}
                    className="py-2 text-[10px] bg-[hsl(var(--destructive)/0.08)] border border-[hsl(var(--destructive)/0.2)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.15)] font-semibold rounded-lg transition-all disabled:opacity-30"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: "InProgress" })}
                    disabled={updateStatusMutation.isPending || selectedTicket.status === "InProgress"}
                    className="py-2 text-[10px] bg-[hsl(var(--warning)/0.08)] border border-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.15)] font-semibold rounded-lg transition-all disabled:opacity-30"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: "Resolved" })}
                    disabled={updateStatusMutation.isPending || selectedTicket.status === "Resolved"}
                    className="py-2 text-[10px] bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.15)] font-semibold rounded-lg transition-all disabled:opacity-30"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 gap-3">
              <MessageSquareText className="h-8 w-8 text-[hsl(var(--muted-foreground))] opacity-60" />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Select a ticket from the reports column to inspect user feedback and transition status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
