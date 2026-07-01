import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company");

    const suppliers = await prisma.supplier.findMany({
      where: filter,
      orderBy: { name: "asc" }
    });

    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("GET suppliers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.name || !data.company) {
      return NextResponse.json(
        { error: "Supplier name and company are required" },
        { status: 400 }
      );
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && data.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        id: data.id || undefined,
        name: data.name,
        contactName: data.contactName || "",
        email: data.email || "",
        phone: data.phone || "",
        status: data.status || "Active",
        company: data.company,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10)
      }
    });

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("POST supplier error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
