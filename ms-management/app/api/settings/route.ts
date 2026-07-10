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
        headerColor: "#ffffff",
        placementTerms: "1. The Candidate agrees to register with the Consultancy and submit all required legal documents.\n2. The Consultancy will coordinate recruitment timelines, schedule interviews, and assist with document submission.\n3. The candidate agrees to attend all scheduled interviews and complete medical tests.",
        refundPolicy: "Registration and service fees are non-refundable once visa processing has been initiated by the Placed Company or in case of candidates presenting falsified documents.",
        replacementPolicy: "If the placed candidate resigns or is terminated within the probation period (up to 90 days), the Consultancy shall provide a one-time replacement candidate at no extra cost.",
        candidateDeclaration: "I hereby declare that I accept the offer of employment and the terms set out in this Agreement. I verify that the passport information, address, and credentials provided are correct. I agree to abide by the labour regulations of the United Arab Emirates.",
        consultancyDeclaration: "We declare that we will act as the authorized placement agent, coordinating the scheduling, interview processing, and document management in compliance with MoHRE policies and UAE Federal Labour Laws.",
        companyLicense: "2013854/FZE",
        companyWebsite: "www.mshorizon.ae",
        printFooter: "MS Horizon F.Z.E - Recruitment Consultancy Placement Agreement"
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
        headerColor: data.headerColor !== undefined ? data.headerColor : undefined,
        placementTerms: data.placementTerms !== undefined ? data.placementTerms : undefined,
        refundPolicy: data.refundPolicy !== undefined ? data.refundPolicy : undefined,
        replacementPolicy: data.replacementPolicy !== undefined ? data.replacementPolicy : undefined,
        candidateDeclaration: data.candidateDeclaration !== undefined ? data.candidateDeclaration : undefined,
        consultancyDeclaration: data.consultancyDeclaration !== undefined ? data.consultancyDeclaration : undefined,
        companyLicense: data.companyLicense !== undefined ? data.companyLicense : undefined,
        companyWebsite: data.companyWebsite !== undefined ? data.companyWebsite : undefined,
        printFooter: data.printFooter !== undefined ? data.printFooter : undefined
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
        headerColor: data.headerColor || "#ffffff",
        placementTerms: data.placementTerms || "",
        refundPolicy: data.refundPolicy || "",
        replacementPolicy: data.replacementPolicy || "",
        candidateDeclaration: data.candidateDeclaration || "",
        consultancyDeclaration: data.consultancyDeclaration || "",
        companyLicense: data.companyLicense || "",
        companyWebsite: data.companyWebsite || "",
        printFooter: data.printFooter || ""
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT site settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
