/**
 * applyTheme.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure browser utility — no React dependencies.
 *
 * Reads a SiteSettings object and applies every theme token as a CSS custom
 * property on <html> (document.documentElement).  Targeting the root element
 * is the correct approach and works consistently across:
 *   • Desktop Chrome / Edge / Firefox
 *   • Android Chrome / Samsung Internet
 *   • Safari on iPhone (iOS 15+)
 *
 * Called from:
 *   • authStore.updateSiteSettings  – instant live update when Admin saves
 *   • authStore.initStore           – applies theme after login / page refresh
 *   • ThemeApplier component        – React-level watcher for Zustand changes
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ThemeSettings {
  primaryColor?: string | null;
  sidebarColor?: string | null;
  backgroundColor?: string | null;
  cardColor?: string | null;
  textColor?: string | null;
  borderColor?: string | null;
  buttonColor?: string | null;
  headerColor?: string | null;
  fontFamily?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  tableHeaderColor?: string | null;
  notificationColor?: string | null;
}

/**
 * Convert a hex colour to an RGB triplet string like "59, 130, 246"
 * (needed for rgba() usage in some CSS).
 */
function hexToRgbComponents(hex: string): string | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return `${r}, ${g}, ${b}`;
}

/**
 * Inject (or update) a <style id="ms-dynamic-theme"> tag in <head> with
 * rules that cannot easily be expressed as a single CSS variable, such as
 * multi-stop gradients that reference the brand colour.
 */
function injectDynamicStyleTag(settings: ThemeSettings): void {
  const primary = settings.primaryColor || "#3B82F6";
  const sidebar = settings.sidebarColor || "#0A0F1C";
  const header  = settings.headerColor  || "#ffffff";
  const button  = settings.buttonColor  || primary;

  // Derive a slightly darker variant of sidebar for gradient mid-stop
  // We'll just use the sidebar colour directly for simplicity / correctness.
  const css = `
    /* ── Dynamically generated brand styles ── */
    :root {
      --background: ${settings.backgroundColor || "#f8fafc"};
      --foreground: ${settings.textColor || "#0f172a"};
      --border: ${settings.borderColor || "#e2e8f0"};
    }

    /* Global Dynamic Color Overrides */
    .bg-blue-600, .bg-blue-500, .bg-primary, [data-state=active] {
      background-color: var(--button-color) !important;
    }
    .hover\:bg-blue-700:hover, .hover\:bg-blue-600:hover, .bg-blue-600:hover, .bg-primary:hover {
      background-color: var(--button-color) !important;
      filter: brightness(0.9) !important;
    }
    .text-blue-600, .text-blue-500, .text-primary {
      color: var(--primary) !important;
    }
    .hover\:text-blue-700:hover, .hover\:text-blue-600:hover {
      color: var(--primary) !important;
      filter: brightness(0.9) !important;
    }
    .border-blue-600, .border-blue-500, .border-blue-400 {
      border-color: var(--primary) !important;
    }
    .bg-blue-50, .bg-blue-50\/50, .bg-blue-50\/30 {
      background-color: var(--primary)1a !important; /* 10% opacity hex code format */
    }
    .text-blue-700, .text-blue-800 {
      color: var(--primary) !important;
    }
    
    /* Card, Sidebar & Header Overrides */
    .bg-card, .bg-white, .bg-white\/50, [class*="bg-white"] {
      background-color: var(--card) !important;
    }
    .bg-sidebar, [class*="bg-slate-900"], [class*="bg-slate-950"] {
      background-color: var(--sidebar) !important;
    }
    .bg-slate-50\/50, .bg-slate-50, thead, th, thead tr, .bg-slate-100 {
      background-color: var(--table-header-color) !important;
    }
    
    /* Accent & Notification Color Overrides */
    .border-indigo-100, .bg-indigo-50, .text-indigo-600, .bg-indigo-100 {
      border-color: var(--accent-color) !important;
      color: var(--accent-color) !important;
    }
    .bg-indigo-50 {
      background-color: var(--accent-color)14 !important;
    }
    .bg-rose-500, .bg-rose-600, .bg-red-500, .bg-red-600, .bg-destructive {
      background-color: var(--notification-color) !important;
    }

    .ms-sidebar-gradient {
      background: linear-gradient(180deg, ${sidebar} 0%, ${sidebar}ee 50%, ${sidebar}cc 100%) !important;
    }
    .ms-glass {
      background: ${header}d0 !important;
    }
    .ms-frost {
      background: ${header}c8 !important;
    }
    .ms-icon-gradient {
      background: linear-gradient(135deg, ${sidebar}, ${primary}) !important;
    }
    .ms-accent-line {
      background: linear-gradient(90deg, ${primary} 0%, ${primary}99 50%, ${primary}44 100%) !important;
    }
    /* Primary colour ripple / glow effects */
    .ms-glow-pulse {
      animation: ms-glow-pulse-themed 2.5s ease-in-out infinite;
    }
    @keyframes ms-glow-pulse-themed {
      0%, 100% { box-shadow: 0 0 0 0 ${primary}33; }
      50%       { box-shadow: 0 0 12px 4px ${primary}1f; }
    }
  `;

  let tag = document.getElementById("ms-dynamic-theme") as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "ms-dynamic-theme";
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

/**
 * Main entry point — call this any time theme settings change.
 * Safe to call from Zustand actions (checks window availability).
 */
export function applyThemeCssVars(settings: ThemeSettings): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const root = document.documentElement;

  const primary    = settings.primaryColor    || "#3B82F6";
  const sidebar    = settings.sidebarColor    || "#0A0F1C";
  const bg         = settings.backgroundColor || "#f8fafc";
  const card       = settings.cardColor       || "#ffffff";
  const text       = settings.textColor       || "#0f172a";
  const border     = settings.borderColor     || "#e2e8f0";
  const button     = settings.buttonColor     || primary;
  const header     = settings.headerColor     || "#ffffff";
  const font       = settings.fontFamily      || "Inter";
  const secondary  = settings.secondaryColor   || "#64748b";
  const accent     = settings.accentColor      || primary;
  const tableHeader = settings.tableHeaderColor || "#f8fafc";
  const notification = settings.notificationColor || primary;

  const primaryRgb = hexToRgbComponents(primary);
  const sidebarRgb = hexToRgbComponents(sidebar);

  // ── Core design tokens ──────────────────────────────────────────────────
  root.style.setProperty("--primary",          primary);
  root.style.setProperty("--ring",             primary);
  root.style.setProperty("--sidebar",          sidebar);
  root.style.setProperty("--background",       bg);
  root.style.setProperty("--foreground",       text);
  root.style.setProperty("--card",             card);
  root.style.setProperty("--card-foreground",  text);
  root.style.setProperty("--popover",          card);
  root.style.setProperty("--popover-foreground", text);
  root.style.setProperty("--border",           border);
  root.style.setProperty("--input",            border);
  root.style.setProperty("--button-color",     button);
  root.style.setProperty("--header-color",     header);
  root.style.setProperty("--secondary-color",  secondary);
  root.style.setProperty("--accent-color",     accent);
  root.style.setProperty("--table-header-color", tableHeader);
  root.style.setProperty("--notification-color", notification);

  // ── Sidebar sub-tokens ──────────────────────────────────────────────────
  root.style.setProperty("--sidebar-foreground",           "#f8fafc");
  root.style.setProperty("--sidebar-primary",              primary);
  root.style.setProperty("--sidebar-primary-foreground",   "#ffffff");
  root.style.setProperty("--sidebar-accent",               `${sidebar}ee`);
  root.style.setProperty("--sidebar-accent-foreground",    "#f8fafc");
  root.style.setProperty("--sidebar-border",               `${sidebar}99`);
  root.style.setProperty("--sidebar-ring",                 primary);

  // ── Brand gradient tokens ────────────────────────────────────────────────
  root.style.setProperty("--ms-gradient-start", sidebar);
  root.style.setProperty("--ms-gradient-mid",   primary);
  root.style.setProperty("--ms-gradient-end",   primary);

  // ── Card shadows using primary colour ────────────────────────────────────
  if (primaryRgb) {
    root.style.setProperty("--ms-glow", `0 0 35px rgba(${primaryRgb}, 0.15)`);
    root.style.setProperty(
      "--ms-card-shadow-hover",
      `0 16px 32px -8px rgba(${primaryRgb}, 0.12), 0 0 0 1px rgba(${primaryRgb}, 0.08)`
    );
  }
  if (sidebarRgb) {
    root.style.setProperty("--ms-brand-grad", `linear-gradient(135deg, ${primary} 0%, ${sidebar} 100%)`);
  }

  // ── Typography ────────────────────────────────────────────────────────────
  root.style.setProperty("--font-body", `"${font}", var(--font-sans, sans-serif)`);
  // Also update the body font-family directly for compatibility
  document.body.style.fontFamily = `"${font}", system-ui, -apple-system, sans-serif`;

  // ── Secondary / muted tones derived from card ─────────────────────────────
  // Keep muted slightly darker than card background
  root.style.setProperty("--muted",              `${card}`);
  root.style.setProperty("--muted-foreground",   "#64748b");
  root.style.setProperty("--secondary",          `${card}`);
  root.style.setProperty("--secondary-foreground", text);
  root.style.setProperty("--accent",             `${card}`);
  root.style.setProperty("--accent-foreground",  text);

  // ── Inject dynamic gradient / glassmorphism styles ────────────────────────
  injectDynamicStyleTag(settings);
}
