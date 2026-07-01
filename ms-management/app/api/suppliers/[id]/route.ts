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

    const existing = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        contactName: data.contactName ?? undefined,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        status: data.status ?? undefined,
        company: data.company ?? undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT supplier error:", error);
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

    const existing = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Supplier deleted" });
  } catch (error: any) {
    console.error("DELETE supplier error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
