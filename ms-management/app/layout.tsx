import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

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
    const user = await getSessionUser();
    let companySettings: any = null;
    
    if (user && user.company && user.company !== "System") {
      companySettings = await prisma.company.findFirst({
        where: { name: user.company }
      });
    } else if (user && user.company === "System") {
      // For Super Admins or users in the root system
      companySettings = await prisma.company.findFirst({
        where: { name: "MS Horizon F.Z.E" }
      });
    }

    if (companySettings && companySettings.brandColor) {
      primaryColor = companySettings.brandColor;
      sidebarColor = companySettings.secondaryColor || sidebarColor;
    } else {
      // Fallback to site settings
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "SETTINGS" }
      });
      if (settings) {
        if (settings.primaryColor) primaryColor = settings.primaryColor;
        if (settings.sidebarColor) sidebarColor = settings.sidebarColor;
      }
    }
  } catch (err) {
    console.error("Failed to load dynamic branding in RootLayout:", err);
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

