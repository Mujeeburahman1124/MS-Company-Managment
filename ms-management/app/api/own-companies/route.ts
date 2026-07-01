import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownCompanies = await prisma.internalCompany.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json(ownCompanies);
  } catch (error: any) {
    console.error("GET own-companies error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can create SaaS tenants
    if (user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name || !data.type) {
      return NextResponse.json({ error: "Company name and type are required" }, { status: 400 });
    }

    const company = await prisma.internalCompany.create({
      data: {
        id: data.id || undefined,
        name: data.name,
        logo: data.logo || null,
        telephone: data.telephone || "",
        email: data.email || "",
        address: data.address || "",
        status: data.status || "Active",
        branches: Number(data.branches) || 0,
        staff: Number(data.staff) || 0,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
        createdBy: user.name,
        notes: data.notes || null,
        subscriptionPlan: data.subscriptionPlan || "Basic",
        licenseExpiry: data.licenseExpiry || "",
        maxUsers: Number(data.maxUsers) || 10,
        maxStorage: Number(data.maxStorage) || 5,
        type: data.type || null,
        branch: data.branch || null,
        location: data.location || null,
        country: data.country || null,
        district: data.district || null,
        province: data.province || null,
        city: data.city || null
      }
    });

    return NextResponse.json(company);
  } catch (error: any) {
    console.error("POST own-company error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
