"use strict";
"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl px-2 md:px-3 py-1.5 h-8 gap-1 select-none flex-shrink-0"
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  );
}
