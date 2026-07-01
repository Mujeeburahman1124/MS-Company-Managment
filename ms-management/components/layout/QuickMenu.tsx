"use strict";
"use client";

import Link from "next/link";
import { LayoutGrid, Users, UserCog, Building2, Car, CheckSquare, Calendar, BarChart3, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const QUICK_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, path: "/dashboard", color: "text-blue-500 bg-blue-50" },
  { label: "Applicants", icon: Users, path: "/applicants", color: "text-emerald-500 bg-emerald-50" },
  { label: "Staff", icon: UserCog, path: "/staff", color: "text-purple-500 bg-purple-50" },
  { label: "Client Companies", icon: Building2, path: "/companies", color: "text-amber-500 bg-amber-50" },
  { label: "Vehicles", icon: Car, path: "/vehicles", color: "text-rose-500 bg-rose-50" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks", color: "text-indigo-500 bg-indigo-50" },
  { label: "Interviews", icon: Calendar, path: "/interviews", color: "text-teal-500 bg-teal-50" },
  { label: "Reports", icon: BarChart3, path: "/reports", color: "text-orange-500 bg-orange-50" },
  { label: "Settings", icon: Settings, path: "/settings", color: "text-slate-500 bg-slate-50" }
];

export default function QuickMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl">
        <LayoutGrid className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3 rounded-2xl border-slate-100 shadow-xl bg-white">
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.label} asChild className="focus:bg-transparent">
                <Link
                  href={item.path}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group select-none"
                >
                  <div className={`p-2 rounded-lg ${item.color} mb-1.5 transition-transform group-hover:scale-105`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900 text-center">
                    {item.label}
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
