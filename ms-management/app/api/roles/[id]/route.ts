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

    const existing = await prisma.role.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Protection: Cannot edit default system roles unless Super Admin
    if (!existing.company && user.role !== "Super Admin") {
      return NextResponse.json({ error: "Cannot modify default system roles" }, { status: 403 });
    }

    // Tenancy Check: Company Admin can only edit roles scoped to their company
    if (existing.company && user.role !== "Super Admin" && user.company !== existing.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        permissions: data.permissions ?? undefined,
        isCustom: data.isCustom !== undefined ? data.isCustom : undefined,
        company: user.role === "Super Admin" ? (data.company !== undefined ? data.company : undefined) : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT role error:", error);
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

    const existing = await prisma.role.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Protection: Cannot delete system roles
    if (!existing.company && user.role !== "Super Admin") {
      return NextResponse.json({ error: "Cannot delete default system roles" }, { status: 403 });
    }

    // Tenancy Check: Company Admin can only delete roles scoped to their company
    if (existing.company && user.role !== "Super Admin" && user.company !== existing.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error: any) {
    console.error("DELETE role error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
