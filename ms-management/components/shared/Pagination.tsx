"use strict";
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  moduleKey: string;
  totalItems: number;
}

export default function Pagination({ moduleKey, totalItems }: PaginationProps) {
  const { filters, setFilter } = useFilterStore();
  const currentFilters = filters[moduleKey];

  if (!currentFilters) return null;

  const page = currentFilters.page || 1;
  const pageSize = currentFilters.pageSize || 10;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilter(moduleKey, { page: newPage });
    }
  };

  const handlePageSizeChange = (val: string | null) => {
    if (val) setFilter(moduleKey, { pageSize: parseInt(val, 10), page: 1 });
  };

  const startIdx = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalItems);

  // Generate page numbers to show (max 5)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 md:px-6 bg-white border-t border-slate-100 select-none text-xs text-slate-500 font-medium">
      {/* Items count summary */}
      <div className="text-center sm:text-left">
        Showing <span className="font-semibold text-slate-700">{startIdx}</span> to{" "}
        <span className="font-semibold text-slate-700">{endIdx}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalItems}</span> results
      </div>

      {/* Controls: Page selectors & Next/Prev */}
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span>Show:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-18 bg-white border-slate-200 rounded-lg text-xs h-8">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-100 rounded-lg text-xs">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg border-slate-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </Button>

          {/* Numbers list (hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((p) => (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                onClick={() => handlePageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold ${
                  page === p
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-lg border-slate-200 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
