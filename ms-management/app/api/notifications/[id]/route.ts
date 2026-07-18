import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasPermissionBackend, createAuditLog } from "@/lib/auth-helpers";

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

    const existing = await prisma.notification.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Check ownership or admin permission
    const isOwner = existing.userId === user.id;
    if (!isOwner && user.role !== "Super Admin" && !(await hasPermissionBackend(user, "notifications", "edit"))) {
      await createAuditLog(user, "Status Changed", "notifications", null, `Unauthorized attempt to edit notification ${id}`, request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const data = await request.json();

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        read: data.read !== undefined ? data.read : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT notification error:", error);
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

    const existing = await prisma.notification.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Check ownership or admin permission
    const isOwner = existing.userId === user.id;
    if (!isOwner && user.role !== "Super Admin" && !(await hasPermissionBackend(user, "notifications", "delete"))) {
      await createAuditLog(user, "Status Changed", "notifications", null, `Unauthorized attempt to delete notification ${id}`, request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    console.error("DELETE notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
