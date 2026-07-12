"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationMeta {
  pageNumber:      number;
  pageSize:        number;
  totalCount:      number;
  totalPages:      number;
  hasPreviousPage: boolean;
  hasNextPage:     boolean;
}

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ meta, onPageChange, className = "" }: PaginationProps) {
  const { pageNumber, totalPages, hasPreviousPage, hasNextPage, totalCount, pageSize } = meta;

  if (totalPages <= 1) return null;

  // Build page window: show up to 5 page buttons centered on current
  const buildPages = () => {
    const pages: (number | "…")[] = [];
    const delta = 2;
    const left  = Math.max(1, pageNumber - delta);
    const right = Math.min(totalPages, pageNumber + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push("…");
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  const from = (pageNumber - 1) * pageSize + 1;
  const to   = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      {/* Count label */}
      <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
        Showing{" "}
        <span className="text-[hsl(var(--foreground))] font-bold">{from}–{to}</span>
        {" "}of{" "}
        <span className="text-[hsl(var(--foreground))] font-bold">{totalCount}</span>
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          id="pagination-prev"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={!hasPreviousPage}
          className="ds-btn-icon h-8 w-8 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {buildPages().map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 text-center text-[hsl(var(--muted-foreground))] text-xs font-mono select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              id={`pagination-page-${p}`}
              onClick={() => onPageChange(p as number)}
              className={`h-8 w-8 rounded-lg text-xs font-bold font-mono transition-all ${
                p === pageNumber
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          id="pagination-next"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={!hasNextPage}
          className="ds-btn-icon h-8 w-8 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
