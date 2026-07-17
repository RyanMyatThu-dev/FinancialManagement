"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Pagination, type PaginationMeta } from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import {
  Tag,
  Search,
  Plus,
  Loader2,
  AlertTriangle,
  Tag as TagIcon,
  Sparkles,
} from "lucide-react";

interface TagType {
  id: string;
  name: string;
  color?: string;
}

interface PagedTagsResponse {
  items: TagType[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const PAGE_SIZE = 12;

export default function TagsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tempSearch, setTempSearch] = useState("");

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [createError, setCreateError] = useState<string | null>(null);

  // 1. Fetch tags
  const { data, isLoading, error } = useQuery<PagedTagsResponse>({
    queryKey: ["tags-paged", page, search],
    queryFn: async () => {
      const res = await apiClient.get(
        `/api/transactions/tags?pageNumber=${page}&pageSize=${PAGE_SIZE}&search=${encodeURIComponent(
          search
        )}`
      );
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch tags");
    },
    placeholderData: (prev) => prev,
  });

  const tags = data?.items ?? [];
  const meta: PaginationMeta | null = data
    ? {
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        hasPreviousPage: data.hasPreviousPage,
        hasNextPage: data.hasNextPage,
      }
    : null;

  // 2. Create tag mutation
  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiClient.post("/api/transactions/tags", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create tag");
    },
    onSuccess: () => {
      showToast("Tag created successfully", "success");
      qc.invalidateQueries({ queryKey: ["tags-paged"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
      setCreateError(null);
      setPage(1);
    },
    onError: (err: any) => {
      setCreateError(err.message || "Failed to create tag");
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(tempSearch);
    setPage(1);
  };

  const handleResetSearch = () => {
    setTempSearch("");
    setSearch("");
    setPage(1);
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createMutation.mutate({
      name: newTagName.trim(),
      color: newTagColor,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-5 w-5 text-[hsl(var(--primary))]" />
            Tags Management
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
            Apply visual labels to categorize and track custom micro-budgets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Create Tag Panel */}
        <div className="ds-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              New Tag
            </h3>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
              Label transactions dynamically for tailored reports.
            </p>
          </div>

          <form onSubmit={handleCreateTag} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="tag-name" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Name
              </label>
              <input
                id="tag-name"
                type="text"
                required
                maxLength={55}
                placeholder="e.g. Starbucks, BTS, Weekend"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="ds-input w-full px-3 py-2 text-xs"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Color Theme
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-[hsl(var(--border))] bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono tracking-tight text-[hsl(var(--muted-foreground))]">
                  {newTagColor.toUpperCase()}
                </span>
              </div>
            </div>

            {createError && (
              <div className="p-3 bg-[hsl(var(--destructive)/0.06)] border border-[hsl(var(--destructive)/0.15)] rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[hsl(var(--destructive))] font-mono leading-relaxed">
                  {createError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider font-mono"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Tag
            </button>
          </form>
        </div>

        {/* View Tags List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="ds-card p-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2" autoComplete="off">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  placeholder="Search tags by name..."
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  className="ds-input w-full pl-9 pr-4 py-2.5 text-xs font-mono"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="ds-btn-secondary px-4 py-2.5 text-xs font-mono font-bold"
              >
                Search
              </button>
              {(search || tempSearch) && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="ds-btn-icon h-9 w-9 border border-[hsl(var(--border))]"
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </form>
          </div>

          {/* List display */}
          {isLoading ? (
            <div className="ds-card p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-[hsl(var(--primary))] mb-2" />
              <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                Fetching tags...
              </p>
            </div>
          ) : error ? (
            <div className="ds-card p-6 border-[hsl(var(--destructive)/0.2)] bg-[hsl(var(--destructive)/0.02)] flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--destructive))] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[hsl(var(--destructive))] mb-1 font-mono uppercase tracking-wider">
                  Query Failed
                </h4>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono leading-relaxed">
                  {error.message || "Failed to load tags. Please try again."}
                </p>
              </div>
            </div>
          ) : tags.length === 0 ? (
            <div className="ds-card p-12 flex flex-col items-center justify-center text-center">
              <TagIcon className="h-10 w-10 text-[hsl(var(--muted-foreground))] mb-3 opacity-60" />
              <h3 className="text-xs font-bold mb-1">No Tags Found</h3>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono max-w-sm">
                Try searching for something else or create a new tag using the form on the left.
              </p>
            </div>
          ) : (
            <>
              {/* Tag Badges Grid */}
              <div className="ds-card p-5">
                <div className="flex flex-wrap gap-3">
                  {tags.map((t) => (
                    <div
                      key={t.id}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-mono tracking-tight transition-all duration-150 hover:scale-[1.02]"
                      style={{
                        backgroundColor: `${t.color}0a`,
                        borderColor: `${t.color}35`,
                        color: t.color || "hsl(var(--foreground))",
                      }}
                    >
                      <TagIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-bold">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {meta && (
                <div className="ds-card p-4">
                  <Pagination meta={meta} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
