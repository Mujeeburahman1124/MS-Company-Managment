import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "SETTINGS" }
    });

    if (!settings) {
      // Fallback default settings if seed didn't run or table is empty
      return NextResponse.json({
        id: "SETTINGS",
        siteName: "MS Horizon F.Z.E",
        email: "info@mshorizon.ae",
        phone: "+971 4 123 4567",
        whatsapp: "+971 50 123 4567",
        address: "Office 101, Business Bay, Dubai, UAE",
        footerText: "© 2026 MS Horizon F.Z.E. All Rights Reserved.",
        primaryColor: "#3B82F6",
        sidebarColor: "#0A0F1C",
        website: "www.mshorizon.ae",
        fontFamily: "Inter",
        backgroundColor: "#f8fafc",
        cardColor: "#ffffff",
        textColor: "#0f172a",
        borderColor: "#e2e8f0",
        buttonColor: "#3b82f6",
        headerColor: "#ffffff"
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET site settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can modify general portal site settings
    if (user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    const updated = await prisma.siteSettings.upsert({
      where: { id: "SETTINGS" },
      update: {
        siteName: data.siteName ?? undefined,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        whatsapp: data.whatsapp ?? undefined,
        address: data.address ?? undefined,
        footerText: data.footerText ?? undefined,
        primaryColor: data.primaryColor ?? undefined,
        sidebarColor: data.sidebarColor ?? undefined,
        linkedin: data.linkedin !== undefined ? data.linkedin : undefined,
        twitter: data.twitter !== undefined ? data.twitter : undefined,
        facebook: data.facebook !== undefined ? data.facebook : undefined,
        instagram: data.instagram !== undefined ? data.instagram : undefined,
        logo: data.logo !== undefined ? data.logo : undefined,
        website: data.website !== undefined ? data.website : undefined,
        fontFamily: data.fontFamily !== undefined ? data.fontFamily : undefined,
        backgroundColor: data.backgroundColor !== undefined ? data.backgroundColor : undefined,
        cardColor: data.cardColor !== undefined ? data.cardColor : undefined,
        textColor: data.textColor !== undefined ? data.textColor : undefined,
        borderColor: data.borderColor !== undefined ? data.borderColor : undefined,
        buttonColor: data.buttonColor !== undefined ? data.buttonColor : undefined,
        headerColor: data.headerColor !== undefined ? data.headerColor : undefined
      },
      create: {
        id: "SETTINGS",
        siteName: data.siteName || "MS Horizon F.Z.E",
        email: data.email || "info@mshorizon.ae",
        phone: data.phone || "+971 4 123 4567",
        whatsapp: data.whatsapp || "+971 50 123 4567",
        address: data.address || "Office 101, Business Bay, Dubai, UAE",
        footerText: data.footerText || "© 2026 MS Horizon F.Z.E. All Rights Reserved.",
        primaryColor: data.primaryColor || "#3B82F6",
        sidebarColor: data.sidebarColor || "#0A0F1C",
        linkedin: data.linkedin || null,
        twitter: data.twitter || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        logo: data.logo || null,
        website: data.website || "www.mshorizon.ae",
        fontFamily: data.fontFamily || "Inter",
        backgroundColor: data.backgroundColor || "#f8fafc",
        cardColor: data.cardColor || "#ffffff",
        textColor: data.textColor || "#0f172a",
        borderColor: data.borderColor || "#e2e8f0",
        buttonColor: data.buttonColor || "#3b82f6",
        headerColor: data.headerColor || "#ffffff"
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT site settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
