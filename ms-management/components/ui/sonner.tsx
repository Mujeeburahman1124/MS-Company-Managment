"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-slate-400 shrink-0" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-4 flex gap-3 text-slate-800 dark:text-slate-200 border",
          success: "border-emerald-100 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300",
          error: "border-rose-100 bg-rose-50/50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300",
          warning: "border-amber-100 bg-amber-50/50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300",
          info: "border-blue-100 bg-blue-50/50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
