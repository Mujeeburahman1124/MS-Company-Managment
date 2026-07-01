"use strict";

import { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: any;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title = "No records found",
  description = "There are no matches for the selected filters. Try adjusting your search query or criteria.",
  icon: Icon = FolderOpen,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-slate-200 rounded-2xl bg-white select-none shadow-sm max-w-lg mx-auto my-6",
        className
      )}
    >
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 mb-4 animate-pulse">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed font-medium">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
