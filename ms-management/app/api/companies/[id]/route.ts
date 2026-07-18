import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasPermissionBackend, createAuditLog, canModifyRecord } from "@/lib/auth-helpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Query existing company to check tenancy
    const existing = await prisma.company.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (!(await canModifyRecord(user, "companies", "edit", existing))) {
      await createAuditLog(user, "Status Changed", "companies", null, `Unauthorized attempt to edit company ${id}`, request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    // Role verification: Super Admin can edit any company; Company Admin can edit only their own
    if (user.role !== "Super Admin" && user.company !== existing.name) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        logo: data.logo !== undefined ? data.logo : undefined,
        telephone: data.telephone !== undefined ? data.telephone : undefined,
        hrMobile: data.hrMobile !== undefined ? data.hrMobile : undefined,
        ownerMobile: data.ownerMobile !== undefined ? data.ownerMobile : undefined,
        whatsapp: data.whatsapp !== undefined ? data.whatsapp : undefined,
        email: data.email !== undefined ? data.email : undefined,
        address: data.address !== undefined ? data.address : undefined,
        status: data.status ?? undefined,
        branches: data.branches !== undefined ? Number(data.branches) : undefined,
        staff: data.staff !== undefined ? Number(data.staff) : undefined,
        applicants: data.applicants !== undefined ? Number(data.applicants) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        enabledModules: data.enabledModules !== undefined ? data.enabledModules : undefined,
        googleMapLink: data.googleMapLink !== undefined ? data.googleMapLink : undefined,
        documents: data.documents !== undefined ? data.documents : undefined,
        jobDemands: data.jobDemands !== undefined ? data.jobDemands : undefined,
        tradeLicenseNumber: data.tradeLicenseNumber !== undefined ? data.tradeLicenseNumber : undefined,
        licenseIssueDate: data.licenseIssueDate !== undefined ? data.licenseIssueDate : undefined,
        licenseExpiryDate: data.licenseExpiryDate !== undefined ? data.licenseExpiryDate : undefined,
        companyType: data.companyType !== undefined ? data.companyType : undefined,
        ownerName: data.ownerName !== undefined ? data.ownerName : undefined,
        emirateLocation: data.emirateLocation !== undefined ? data.emirateLocation : undefined,
        trnNumber: data.trnNumber !== undefined ? data.trnNumber : undefined,
        separateDatabase: data.separateDatabase !== undefined ? data.separateDatabase : undefined,
        databaseStatus: data.databaseStatus !== undefined ? data.databaseStatus : undefined,
        themeConfig: data.themeConfig !== undefined ? data.themeConfig : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT company error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.company.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (!(await canModifyRecord(user, "companies", "delete", existing))) {
      await createAuditLog(user, "Status Changed", "companies", null, `Unauthorized attempt to delete company ${id}`, request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Company deleted" });
  } catch (error: any) {
    console.error("DELETE company error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
