"use client";

/**
 * ThemeApplier.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A zero-render client component that bridges the Zustand siteSettings store
 * with the browser's CSS variable system.
 *
 * It renders null (no DOM output) and purely uses useEffect to:
 *   1. Apply theme CSS variables immediately on first mount (handles page
 *      refresh and navigation between pages within the SPA).
 *   2. Re-apply whenever siteSettings changes (instant live update when the
 *      Admin saves new colors from the Settings page).
 *
 * Mounted once inside AppShell so it is active for every authenticated page.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { applyThemeCssVars } from "@/lib/applyTheme";

export default function ThemeApplier() {
  const siteSettings = useAuthStore((state) => state.siteSettings);

  useEffect(() => {
    // Apply theme as soon as siteSettings are available / change
    if (siteSettings) {
      applyThemeCssVars(siteSettings);
    }
  }, [siteSettings]);

  // Also apply a Google Font link tag if the font differs from Inter (already
  // loaded in globals.css). This ensures dynamic font loading works without
  // a server round-trip.
  useEffect(() => {
    if (!siteSettings?.fontFamily || siteSettings.fontFamily === "Inter") return;

    const fontName = siteSettings.fontFamily;
    const encodedFont = fontName.replace(/ /g, "+");
    const linkId = "ms-dynamic-font";

    let existing = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!existing) {
      existing = document.createElement("link");
      existing.id = linkId;
      existing.rel = "stylesheet";
      document.head.appendChild(existing);
    }
    existing.href = `https://fonts.googleapis.com/css2?family=${encodedFont}:wght@300;400;500;600;700;800;900&display=swap`;
  }, [siteSettings?.fontFamily]);

  return null;
}
