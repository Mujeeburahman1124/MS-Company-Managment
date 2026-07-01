"use strict";
"use client";

import Link from "next/link";
import { History, X } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function RecentPages() {
  const { recentPages, clearRecentPages } = useNavigationStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl">
        <History className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl border-slate-100 shadow-xl bg-white">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              Recent Pages
            </span>
            {recentPages.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  clearRecentPages();
                }}
                className="text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 h-6"
              >
                Clear
              </Button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-slate-100 my-1" />
        {recentPages.length === 0 ? (
          <div className="text-center py-6 px-4 text-xs text-slate-400">
            No recently visited pages
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-0.5">
            {recentPages.map((page, idx) => (
              <DropdownMenuItem key={`${page.path}-${idx}`} asChild>
                <Link
                  href={page.path}
                  className="flex items-center justify-between w-full px-2 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base flex-shrink-0">
                      {page.icon || "📄"}
                    </span>
                    <span className="font-medium truncate">{page.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                    {page.visitedAt}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
