"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Pagination, type PaginationMeta } from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import {
  FolderOpen,
  Search,
  Plus,
  Loader2,
  AlertTriangle,
  FolderOpen as FolderIcon,
  Tag as TagIcon,
  Sparkles,
  BookOpen,
  Coffee,
  Utensils,
  Bus,
  Home,
  GraduationCap,
  Gamepad2,
  Dumbbell,
  ShoppingBag,
  Wifi,
  Gift,
  Briefcase,
  Heart,
  Wallet
} from "lucide-react";

export const STUDENT_ICONS = [
  { name: "BookOpen", label: "Studies" },
  { name: "Coffee", label: "Coffee/Drinks" },
  { name: "Utensils", label: "Food/Meals" },
  { name: "Bus", label: "Transit/Commute" },
  { name: "Home", label: "Rent/Dorm" },
  { name: "GraduationCap", label: "Tuition" },
  { name: "Sparkles", label: "Fun/Leisure" },
  { name: "Gamepad2", label: "Gaming" },
  { name: "Dumbbell", label: "Sports/Gym" },
  { name: "ShoppingBag", label: "Shopping" },
  { name: "Wifi", label: "Internet" },
  { name: "Gift", label: "Allowance" },
  { name: "Briefcase", label: "Part-time Job" },
  { name: "Heart", label: "Personal" },
  { name: "Wallet", label: "Savings/Cash" }
];

export const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case "BookOpen": return <BookOpen className={className} />;
    case "Coffee": return <Coffee className={className} />;
    case "Utensils": return <Utensils className={className} />;
    case "Bus": return <Bus className={className} />;
    case "Home": return <Home className={className} />;
    case "GraduationCap": return <GraduationCap className={className} />;
    case "Sparkles": return <Sparkles className={className} />;
    case "Gamepad2": return <Gamepad2 className={className} />;
    case "Dumbbell": return <Dumbbell className={className} />;
    case "ShoppingBag": return <ShoppingBag className={className} />;
    case "Wifi": return <Wifi className={className} />;
    case "Gift": return <Gift className={className} />;
    case "Briefcase": return <Briefcase className={className} />;
    case "Heart": return <Heart className={className} />;
    case "Wallet": return <Wallet className={className} />;
    default: return <FolderOpen className={className} />;
  }
};

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
}

interface PagedCategoriesResponse {
  items: Category[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const PAGE_SIZE = 8;

export default function CategoriesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tempSearch, setTempSearch] = useState("");

  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("Expense");
  const [newCatColor, setNewCatColor] = useState("#10B981");
  const [newCatIcon, setNewCatIcon] = useState("FolderOpen");
  const [createError, setCreateError] = useState<string | null>(null);

  // 1. Fetch categories
  const { data, isLoading, error } = useQuery<PagedCategoriesResponse>({
    queryKey: ["categories-paged", page, search],
    queryFn: async () => {
      const res = await apiClient.get(
        `/api/transactions/categories?pageNumber=${page}&pageSize=${PAGE_SIZE}&search=${encodeURIComponent(
          search
        )}`
      );
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch categories");
    },
    placeholderData: (prev) => prev,
  });

  const categories = data?.items ?? [];
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

  // 2. Create category mutation
  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiClient.post("/api/transactions/categories", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create category");
    },
    onSuccess: () => {
      showToast("Category created successfully", "success");
      qc.invalidateQueries({ queryKey: ["categories-paged"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setNewCatName("");
      setCreateError(null);
      setPage(1);
    },
    onError: (err: any) => {
      setCreateError(err.message || "Failed to create category");
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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMutation.mutate({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      icon: newCatIcon,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
            Categories Management
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
            Organize transactions and set spending quotas by specific folders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Create Category Panel */}
        <div className="ds-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              New Category
            </h3>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
              Add folders to track income streams and expenses.
            </p>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="cat-name" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                required
                maxLength={50}
                placeholder="e.g. Restaurants, Freelance"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="ds-input w-full px-3 py-2 text-xs"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="cat-type" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Type
              </label>
              <select
                id="cat-type"
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="ds-input w-full px-3 py-2 text-xs"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                  Color Theme
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="h-9 w-9 rounded-lg border border-[hsl(var(--border))] bg-transparent cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-mono tracking-tight text-[hsl(var(--muted-foreground))]">
                    {newCatColor.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
                  Select Icon
                </label>
                <div className="grid grid-cols-5 gap-2 p-3 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg">
                  {STUDENT_ICONS.map((ico) => {
                    const isSelected = newCatIcon === ico.name;
                    return (
                      <button
                        key={ico.name}
                        type="button"
                        onClick={() => setNewCatIcon(ico.name)}
                        title={ico.label}
                        className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                            : "bg-transparent border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-hover))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        <CategoryIcon name={ico.name} className="h-4.5 w-4.5" />
                      </button>
                    );
                  })}
                </div>
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
              Create Category
            </button>
          </form>
        </div>

        {/* View Categories List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="ds-card p-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2" autoComplete="off">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  placeholder="Search categories by name..."
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
                Fetching categories...
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
                  {error.message || "Failed to load categories. Please try again."}
                </p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="ds-card p-12 flex flex-col items-center justify-center text-center">
              <FolderIcon className="h-10 w-10 text-[hsl(var(--muted-foreground))] mb-3 opacity-60" />
              <h3 className="text-xs font-bold mb-1">No Categories Found</h3>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono max-w-sm">
                Try searching for something else or create a new category using the form on the left.
              </p>
            </div>
          ) : (
            <>
              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="ds-card p-4 flex items-center justify-between border-l-4 transition-all hover:translate-x-0.5"
                    style={{ borderLeftColor: c.color || "hsl(var(--border))" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center border transition-all"
                        style={{
                          backgroundColor: `${c.color}0d`,
                          borderColor: `${c.color}35`,
                          color: c.color,
                        }}
                      >
                        <CategoryIcon name={c.icon || "FolderOpen"} className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold">{c.name}</h4>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))] font-mono">
                          Icon: {c.icon || "FolderOpen"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                        c.type === "Income"
                          ? "bg-[hsl(var(--primary)/0.06)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.15)]"
                          : "bg-[hsl(var(--destructive)/0.06)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.15)]"
                      }`}
                    >
                      {c.type}
                    </span>
                  </div>
                ))}
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
