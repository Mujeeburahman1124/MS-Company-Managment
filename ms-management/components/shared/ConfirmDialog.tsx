"use strict";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
}

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to perform this action? This operation might be irreversible.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary"
}: ConfirmDialogProps) {
  const confirmButtonClass = 
    variant === "danger" 
      ? "bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
      : variant === "warning"
        ? "bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
        : "bg-blue-600 hover:bg-blue-700 text-white rounded-xl";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm sm:max-w-md p-6 bg-white border border-slate-100 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              variant === "danger" 
                ? "bg-rose-50 border-rose-100 text-rose-600" 
                : variant === "warning"
                  ? "bg-amber-50 border-amber-100 text-amber-500"
                  : "bg-blue-50 border-blue-100 text-blue-600"
            } border`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-800 tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed font-medium pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl px-4 py-2"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`${confirmButtonClass} text-xs font-semibold px-4 py-2`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
