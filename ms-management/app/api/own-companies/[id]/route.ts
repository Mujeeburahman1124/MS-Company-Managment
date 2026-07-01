import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can modify SaaS tenants
    if (user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.internalCompany.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const updated = await prisma.internalCompany.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        logo: data.logo !== undefined ? data.logo : undefined,
        telephone: data.telephone !== undefined ? data.telephone : undefined,
        email: data.email !== undefined ? data.email : undefined,
        address: data.address !== undefined ? data.address : undefined,
        status: data.status ?? undefined,
        branches: data.branches !== undefined ? Number(data.branches) : undefined,
        staff: data.staff !== undefined ? Number(data.staff) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        subscriptionPlan: data.subscriptionPlan ?? undefined,
        licenseExpiry: data.licenseExpiry ?? undefined,
        maxUsers: data.maxUsers !== undefined ? Number(data.maxUsers) : undefined,
        maxStorage: data.maxStorage !== undefined ? Number(data.maxStorage) : undefined,
        type: data.type !== undefined ? data.type : undefined,
        branch: data.branch !== undefined ? data.branch : undefined,
        location: data.location !== undefined ? data.location : undefined,
        country: data.country !== undefined ? data.country : undefined,
        district: data.district !== undefined ? data.district : undefined,
        province: data.province !== undefined ? data.province : undefined,
        city: data.city !== undefined ? data.city : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT own-company error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can delete SaaS tenants
    if (user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.internalCompany.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Tenant deleted" });
  } catch (error: any) {
    console.error("DELETE own-company error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
