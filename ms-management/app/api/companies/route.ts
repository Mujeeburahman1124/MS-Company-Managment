import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      const companies = await prisma.company.findMany({
        where: { status: "Active" },
        select: {
          id: true,
          name: true,
          logo: true,
          status: true,
          email: true,
          telephone: true,
          whatsapp: true
        },
        orderBy: { name: "asc" }
      });
      return NextResponse.json(companies);
    }

    // Apply tenancy scoping
    // For Companies list, Company Admin/Branch Admin should see only their own company, Super Admin sees all.
    const filter = getTenantScopeFilter(user, "name");

    const companies = await prisma.company.findMany({
      where: filter,
      orderBy: { name: "asc" }
    });

    return NextResponse.json(companies);
  } catch (error: any) {
    console.error("GET companies error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can create client companies
    if (user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        id: data.id || undefined, // use passed id (like COM001) or default cuid
        name: data.name,
        logo: data.logo || null,
        telephone: data.telephone || "",
        hrMobile: data.hrMobile || "",
        ownerMobile: data.ownerMobile || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        address: data.address || "",
        status: data.status || "Active",
        branches: Number(data.branches) || 0,
        staff: Number(data.staff) || 0,
        applicants: Number(data.applicants) || 0,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
        createdBy: user.name,
        notes: data.notes || null,
        enabledModules: data.enabledModules || {},
        googleMapLink: data.googleMapLink || null,
        documents: data.documents || [],
        jobDemands: data.jobDemands || [],
        tradeLicenseNumber: data.tradeLicenseNumber || null,
        licenseIssueDate: data.licenseIssueDate || null,
        licenseExpiryDate: data.licenseExpiryDate || null,
        companyType: data.companyType || null,
        ownerName: data.ownerName || null,
        emirateLocation: data.emirateLocation || null,
        trnNumber: data.trnNumber || null,
        separateDatabase: data.separateDatabase || false,
        databaseStatus: data.databaseStatus || "Not Provisioned"
      }
    });

    return NextResponse.json(company);
  } catch (error: any) {
    console.error("POST company error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
