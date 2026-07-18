import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasPermissionBackend, createAuditLog } from "@/lib/auth-helpers";

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

    const existing = await prisma.overtimeRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Overtime request not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Permission check
    const canApprove = user.role === "Super Admin" || 
                       (await hasPermissionBackend(user, "attendance", "edit")) ||
                       (await hasPermissionBackend(user, "attendance", "create")) ||
                       (await hasPermissionBackend(user, "attendance", "approve"));

    const staffMember = await prisma.staff.findFirst({ where: { email: user.email } });
    const isSelf = staffMember ? (existing.staffId === staffMember.id) : false;

    const isStatusChange = data.status !== undefined && data.status !== existing.status;
    if (isStatusChange && !canApprove) {
      return NextResponse.json({ error: "Forbidden: Cannot change status of overtime request" }, { status: 403 });
    }
    if (!canApprove && !isSelf) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }
    if (!canApprove && existing.status !== "Pending") {
      return NextResponse.json({ error: "Forbidden: Cannot modify a processed overtime request" }, { status: 403 });
    }

    const updated = await prisma.overtimeRequest.update({
      where: { id },
      data: {
        hours: data.hours !== undefined ? Number(data.hours) : undefined,
        reason: data.reason ?? undefined,
        status: data.status ?? undefined
      }
    });

    // Log Activity log
    await createAuditLog(
      user,
      isStatusChange ? "Status Changed" : "Edited",
      "Overtime",
      existing.status,
      data.status || existing.status,
      request.headers.get("x-forwarded-for")
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT overtime error:", error);
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

    const existing = await prisma.overtimeRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Overtime request not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Permission check
    const canDelete = user.role === "Super Admin" || 
                      (await hasPermissionBackend(user, "attendance", "delete")) ||
                      (await hasPermissionBackend(user, "attendance", "edit"));

    const staffMember = await prisma.staff.findFirst({ where: { email: user.email } });
    const isSelf = staffMember ? (existing.staffId === staffMember.id) : false;

    if (!canDelete && !isSelf) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }
    if (!canDelete && existing.status !== "Pending") {
      return NextResponse.json({ error: "Forbidden: Cannot delete a processed overtime request" }, { status: 403 });
    }

    await prisma.overtimeRequest.delete({
      where: { id }
    });

    // Log Activity
    await createAuditLog(
      user,
      "Deleted",
      "Overtime",
      `Staff: ${existing.staffName}, Hours: ${existing.hours}`,
      null,
      request.headers.get("x-forwarded-for")
    );

    return NextResponse.json({ success: true, message: "Overtime request deleted" });
  } catch (error: any) {
    console.error("DELETE overtime error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
