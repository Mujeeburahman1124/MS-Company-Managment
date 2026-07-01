"use strict";

import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string | number;
    type: "up" | "down" | "neutral";
  };
  color?: "blue" | "emerald" | "amber" | "rose" | "purple" | "slate";
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "blue"
}: StatCardProps) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100"
  };

  return (
    <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white p-5 hover:shadow-md transition-all select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("p-2 rounded-xl border flex items-center justify-center", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
          {value}
        </h3>
        
        {(trend || description) && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
            {trend && (
              <span
                className={cn(
                  "font-bold",
                  trend.type === "up" && "text-emerald-600",
                  trend.type === "down" && "text-rose-600",
                  trend.type === "neutral" && "text-slate-500"
                )}
              >
                {trend.type === "up" && "+"}
                {trend.type === "down" && "-"}
                {trend.value}
              </span>
            )}
            {description && <span className="truncate">{description}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
