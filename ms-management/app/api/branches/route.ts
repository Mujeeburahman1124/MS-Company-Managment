import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "name");

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

    // Super Admin and Company Admin can create branches
    if (user.role !== "Super Admin" && user.role !== "Company Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
