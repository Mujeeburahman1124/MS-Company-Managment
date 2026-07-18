import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasPermissionBackend, createAuditLog } from "@/lib/auth-helpers";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!(await hasPermissionBackend(user, "placement", "edit"))) {
      await createAuditLog(user, "Status Changed", "placement", null, `Unauthorized attempt to edit placement term ${id}`, req.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const data = await req.json();
    const { title, content, isActive } = data;
    const term = await prisma.placementTerm.update({
      where: { id },
      data: { title, content, isActive }
    });
    return NextResponse.json(term);
  } catch (error) {
    console.error("Error updating term:", error);
    return NextResponse.json({ error: "Failed to update term" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!(await hasPermissionBackend(user, "placement", "edit"))) {
      await createAuditLog(user, "Status Changed", "placement", null, `Unauthorized attempt to delete placement term ${id}`, req.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    await prisma.placementTerm.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting term:", error);
    return NextResponse.json({ error: "Failed to delete term" }, { status: 500 });
  }
}
