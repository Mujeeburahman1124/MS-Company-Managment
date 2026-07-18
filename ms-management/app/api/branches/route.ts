import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter, hasPermissionBackend, createAuditLog, getPermissionScopedFilter } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      const branches = await prisma.branch.findMany({
        where: { status: "Active" },
        select: {
          id: true,
          name: true,
          company: true,
          companyId: true,
          status: true
        },
        orderBy: { name: "asc" }
      });
      return NextResponse.json(branches);
    }

    const filter = await getPermissionScopedFilter(user, "branches", "view", "company", "name");
    if (!filter) {
      await createAuditLog(user, "Status Changed", "branches", null, "Unauthorized attempt to view branches", request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const branches = await prisma.branch.findMany({
      where: filter,
      orderBy: { name: "asc" }
    });

    return NextResponse.json(branches);
  } catch (error: any) {
    console.error("GET branches error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermissionBackend(user, "branches", "create"))) {
      await createAuditLog(user, "Status Changed", "branches", null, "Unauthorized attempt to create branch", request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name || !data.company || !data.companyId) {
      return NextResponse.json(
        { error: "Name, company, and companyId are required" },
        { status: 400 }
      );
    }

    // Tenancy Check: Company Admin can only create branches for their own company
    if (user.role === "Company Admin" && data.company !== user.company) {
      return NextResponse.json(
        { error: "Cannot create branch for another company" },
        { status: 403 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        id: data.id || undefined,
        name: data.name,
        company: data.company,
        companyId: data.companyId,
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        status: data.status || "Active",
        staff: Number(data.staff) || 0,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
        tradeLicenseNumber: data.tradeLicenseNumber || null,
        location: data.location || null,
        contactPerson: data.contactPerson || null
      }
    });

    return NextResponse.json(branch);
  } catch (error: any) {
    console.error("POST branch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
