"use strict";

import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAccessCardProps {
  label: string;
  path: string;
  icon: LucideIcon;
  color?: "blue" | "emerald" | "amber" | "rose" | "purple" | "teal" | "slate";
}

export default function QuickAccessCard({
  label,
  path,
  icon: Icon,
  color = "blue"
}: QuickAccessCardProps) {
  const colorMap = {
    blue: "text-blue-500 bg-blue-50 border-blue-100 group-hover:bg-blue-100",
    emerald: "text-emerald-500 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100",
    amber: "text-amber-500 bg-amber-50 border-amber-100 group-hover:bg-amber-100",
    rose: "text-rose-500 bg-rose-50 border-rose-100 group-hover:bg-rose-100",
    purple: "text-purple-500 bg-purple-50 border-purple-100 group-hover:bg-purple-100",
    teal: "text-teal-500 bg-teal-50 border-teal-100 group-hover:bg-teal-100",
    slate: "text-slate-500 bg-slate-50 border-slate-100 group-hover:bg-slate-100"
  };

  return (
    <Link href={path} className="group block select-none">
      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white p-4 flex items-center justify-between hover:shadow-md hover:border-slate-200 transition-all">
        <div className="flex items-center gap-3 truncate">
          <div className={cn("p-2.5 rounded-xl border transition-colors flex items-center justify-center flex-shrink-0", colorMap[color])}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 truncate">
            {label}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
      </Card>
    </Link>
  );
}
