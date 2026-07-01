"use strict";

import { Clock, User } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDate } from "@/lib/utils";

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString || dateString === "-") return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${formattedDate} ${formattedTime}`;
  } catch (e) {
    return dateString;
  }
}

interface TimelineItemProps {
  date: string;
  changedBy: string;
  oldStatus: string | null;
  newStatus: string;
  reason?: string;
  companyName?: string;
  isLast?: boolean;
}

export default function TimelineItem({
  date,
  changedBy,
  oldStatus,
  newStatus,
  reason,
  companyName,
  isLast = false
}: TimelineItemProps) {
  return (
    <div className="flex gap-4 select-none relative pb-6 group">
      {/* Vertical line indicator */}
      {!isLast && (
        <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100 group-hover:bg-blue-100 transition-colors" />
      )}
      
      {/* Node Bullet icon */}
      <div className="w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-blue-500 z-10 flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm">
        <Clock className="w-3.5 h-3.5" />
      </div>

      {/* Content box */}
      <div className="flex-1 min-w-0 bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 hover:bg-slate-50 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {oldStatus && (
              <>
                <StatusBadge status={oldStatus} className="opacity-70 scale-90" />
                <span className="text-[10px] font-bold text-slate-400">➔</span>
              </>
            )}
            <StatusBadge status={newStatus} />
            {companyName && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                {companyName}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            {formatDateTime(date)}
          </span>
        </div>

        {reason && (
          <p className="text-xs text-slate-600 mt-2 italic bg-white p-2 rounded-lg border border-slate-100">
            &ldquo;{reason}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 font-medium">
          <User className="w-3 h-3 text-slate-400" />
          <span>Updated by: {changedBy}</span>
        </div>
      </div>
    </div>
  );
}
