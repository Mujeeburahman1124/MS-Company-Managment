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

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.branch.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Tenancy Check: Company Admin can only edit their own branches, Super Admin can edit all
    if (user.role !== "Super Admin" && user.company !== existing.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        company: data.company ?? undefined,
        companyId: data.companyId ?? undefined,
        address: data.address !== undefined ? data.address : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        email: data.email !== undefined ? data.email : undefined,
        status: data.status ?? undefined,
        staff: data.staff !== undefined ? Number(data.staff) : undefined,
        tradeLicenseNumber: data.tradeLicenseNumber !== undefined ? data.tradeLicenseNumber : undefined,
        location: data.location !== undefined ? data.location : undefined,
        contactPerson: data.contactPerson !== undefined ? data.contactPerson : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT branch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.branch.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Tenancy Check: Company Admin can only delete their own branches, Super Admin can delete all
    if (user.role !== "Super Admin" && user.company !== existing.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.branch.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Branch deleted" });
  } catch (error: any) {
    console.error("DELETE branch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
