import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "SETTINGS" }
    });

    if (!settings) {
      // Fallback default settings if seed didn't run or table is empty
      settings = {
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
        placementTerms: "1. Registration Process: The Candidate shall register with the Consultancy by providing complete and accurate documents, including passport copy, visa copies, and education credentials.\n2. Placement Timeline: The placement process will proceed according to candidate profile matching and client selection pipelines, typically concluding within 90 days from the registration date.\n3. Candidate Responsibilities: The Candidate is responsible for attending all scheduled interviews, providing correct documents, and undergoing mandatory medical tests as required by MoHRE.\n4. Consultancy Responsibilities: The Consultancy will guide the candidate through active job applications, coordinate interview schedules, and facilitate employment visa processing steps.\n5. Placement Service Fee Terms: All service fees are subject to 5% VAT under UAE Tax Law. Fees must be settled according to the schedules defined in the payment details.\n6. Payment Schedule: Payment must be settled in two parts: Registration Fee due upon registration, and Placement Fee due upon signing the placement agreement or job offer.\n7. Registration Fee Refund Policy: The registration fee is a processing fee and is non-refundable once administrative files are processed or candidate profiles are sent to employers.\n8. Placement Fee Refund Policy: Placement fees are eligible for refund only if the Placed Company fails to issue the entry permit or work visa within the agreed timeline.\n9. Cancellation Policy: If the Candidate cancels the registration after job matching begins, any paid fees shall be forfeited to cover administrative costs.\n10. Replacement Policy: If the Candidate resigns or is terminated within the 90-day probation period, the Consultancy will provide a one-time replacement candidate at no extra fee.\n11. Employer Related Issues: The Consultancy is not liable for changes in company policies, salary adjustments, or termination actions initiated by the Placed Company.\n12. Visa Processing Terms: Visa processing is subject to approvals from the UAE Ministry of Human Resources and Emiratisation (MoHRE) and the Federal Authority for Identity and Citizenship (ICP).\n13. Confidentiality: Both parties agree to maintain strict confidentiality regarding client business secrets, candidate personal files, and employment terms.\n14. Data Privacy: Candidate personal data will be processed and shared with prospective employers solely for recruitment and placement purposes under UAE Data Protection Law.\n15. Compliance with UAE Labour Laws: This agreement and the subsequent employment relations shall comply with UAE Federal Decree-Law No. 33 of 2021 regarding the Regulation of Labour Relations.\n16. Dispute Resolution: Any disputes arising out of this agreement shall be settled amicably through mediation, failing which they shall be referred to the competent UAE courts.\n17. Governing Law: This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates as applied in the Emirate of Dubai.\n18. Agreement Acceptance: By signing this agreement digitally, both parties confirm they have read, understood, and agreed to all 18 clauses without any reservation.",
        refundPolicy: "Registration and service fees are non-refundable once visa processing has been initiated by the Placed Company or in case of candidates presenting falsified documents.",
        replacementPolicy: "If the placed candidate resigns or is terminated within the probation period (up to 90 days), the Consultancy shall provide a one-time replacement candidate at no extra cost.",
        candidateDeclaration: "I hereby declare that I accept the offer of employment and the terms set out in this Agreement. I verify that the passport information, address, and credentials provided are correct. I agree to abide by the labour regulations of the United Arab Emirates.",
        consultancyDeclaration: "We declare that we will act as the authorized placement agent, coordinating the scheduling, interview processing, and document management in compliance with MoHRE policies and UAE Federal Labour Laws.",
        companyLicense: "2013854/FZE",
        companyWebsite: "www.mshorizon.ae",
        printFooter: "MS Horizon F.Z.E - Recruitment Consultancy Placement Agreement",
        linkedin: "",
        twitter: "",
        facebook: "",
        instagram: "",
        logo: ""
      };
    }

    if (user && user.company && user.company !== "System") {
      const company = await prisma.company.findFirst({
        where: { name: user.company }
      });
      if (company) {
        const themeConfig = company.themeConfig ? (typeof company.themeConfig === "string" ? JSON.parse(company.themeConfig) : company.themeConfig) : {};
        return NextResponse.json({
          ...settings,
          ...themeConfig,
          logo: company.logo || settings.logo,
          siteName: company.name || settings.siteName,
        });
      }
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
