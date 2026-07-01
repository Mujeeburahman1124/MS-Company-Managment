"use strict";
"use client";

import { useState } from "react";
import { AlertCircle, X, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  message: string;
  type?: "info" | "warning" | "error" | "success";
  dismissible?: boolean;
  className?: string;
}

export default function AlertBanner({
  message,
  type = "info",
  dismissible = true,
  className
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const styleMap = {
    info: "bg-blue-50 border-blue-100 text-blue-800",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
    error: "bg-rose-50 border-rose-100 text-rose-800",
    success: "bg-emerald-50 border-emerald-100 text-emerald-800"
  };

  const IconMap = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle
  };

  const Icon = IconMap[type];

  return (
    <div
      className={cn(
        "flex items-start justify-between p-3.5 border rounded-2xl text-xs select-none shadow-sm transition-all duration-300",
        styleMap[type],
        className
      )}
    >
      <div className="flex gap-2.5 items-start mr-3">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="font-semibold leading-relaxed">{message}</span>
      </div>
      {dismissible && (
        <button
          onClick={() => setIsVisible(false)}
          className="text-current opacity-60 hover:opacity-100 p-0.5 rounded-lg hover:bg-black/5 flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
