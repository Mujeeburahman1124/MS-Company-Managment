import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "MS SaaS Management Pro",
  description: "Multi-Company SaaS Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load site settings dynamically from DB to set CSS brand colors
  let primaryColor = "#3B82F6";
  let sidebarColor = "#0A0F1C";
  
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "SETTINGS" }
    });
    if (settings) {
      if (settings.primaryColor) primaryColor = settings.primaryColor;
      if (settings.sidebarColor) sidebarColor = settings.sidebarColor;
    }
  } catch (err) {
    console.error("Failed to load site settings in RootLayout:", err);
  }

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body 
        className="min-h-full flex flex-col m-0 bg-background text-foreground"
        style={{
          "--primary": primaryColor,
          "--ring": primaryColor,
          "--sidebar": sidebarColor,
        } as any}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

