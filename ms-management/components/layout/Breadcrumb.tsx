"use strict";
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { MODULES_LIST } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function Breadcrumb() {
  const pathname = usePathname();
  if (pathname === "/dashboard" || pathname === "/" || pathname === "/login") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  
  // Helper to map route segment to readable label
  const getSegmentLabel = (segment: string, _index: number) => {
    // Check if segment matches a module route
    const module = MODULES_LIST.find(
      (m) => m.path.replace("/", "") === segment
    );
    if (module) return module.label;

    // Known ID prefixes — show as-is (APP001, STF001, COM001, etc.)
    if (/^(APP|STF|COM|BRN|USR|SUP|VEH|LVE|REQ|INT|PLM|SUP|TASK|PAYROLL|DOC|RST|PAY|SAL)/.test(segment.toUpperCase())) {
      return segment.toUpperCase();
    }

    // Dynamic ID segments like [id] patterns (numeric or UUID-like)
    if (/^\d+$/.test(segment) || /^[a-f0-9-]{8,}$/.test(segment)) {
      return `#${segment.slice(0, 8)}`;
    }

    if (segment === "new") return "New Entry";
    if (segment === "tracking") return "Tracking";

    // Convert kebab-case to Title Case
    return segment
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const breadcrumbs = segments.map((segment, index) => {
    const url = `/${segments.slice(0, index + 1).join("/")}`;
    const label = getSegmentLabel(segment, index);
    const isLast = index === segments.length - 1;

    return {
      url,
      label,
      isLast
    };
  });

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 py-3 px-4 md:px-6 bg-slate-50 border-b border-slate-100 select-none">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      
      {breadcrumbs.map((crumb, idx) => {
        // Mobile optimization: only show the last two crumbs
        const isHiddenOnMobile = breadcrumbs.length > 2 && idx < breadcrumbs.length - 2;

        return (
          <div
            key={crumb.url}
            className={cn(
              "flex items-center space-x-1.5",
              isHiddenOnMobile && "hidden sm:flex"
            )}
          >
            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            {crumb.isLast ? (
              <span className="font-semibold text-slate-800 truncate max-w-[120px] md:max-w-xs">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.url}
                className="hover:text-blue-600 transition-colors truncate max-w-[120px]"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
