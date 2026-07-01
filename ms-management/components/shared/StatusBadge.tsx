"use strict";

import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border select-none",
        getStatusColor(status),
        className
      )}
    >
      {status}
    </Badge>
  );
}
