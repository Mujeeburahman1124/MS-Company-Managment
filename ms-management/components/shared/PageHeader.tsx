"use strict";

import { ReactNode } from "react";
import BackButton from "./BackButton";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  actions
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5 px-4 md:px-6 border-b border-slate-100 bg-white select-none">
      <div className="flex items-center gap-2 overflow-hidden">
        {showBack && <BackButton />}
        <div className="overflow-hidden">
          <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {actions}
        </div>
      )}
    </div>
  );
}
