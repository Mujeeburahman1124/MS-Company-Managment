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

    if (!(await hasPermissionBackend(user, "shifts", "edit"))) {
      await createAuditLog(user, "Status Changed", "shifts", null, `Unauthorized attempt to edit shift ${id}`, request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const data = await request.json();

    const existing = await prisma.shift.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clockIn = data.clockIn || data.startTime;
    const clockOut = data.clockOut || data.endTime;
    const gracePeriod = data.gracePeriod !== undefined ? parseInt(data.gracePeriod) : undefined;
    const breakDuration = data.breakDuration !== undefined ? parseInt(data.breakDuration) : undefined;
    const description = data.description !== undefined ? data.description : undefined;

    const updated = await prisma.shift.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        clockIn: clockIn ?? undefined,
        clockOut: clockOut ?? undefined,
        gracePeriod: gracePeriod ?? undefined,
        breakDuration: breakDuration ?? undefined,
        description: description ?? undefined,
        company: data.company ?? undefined,
        branch: data.branch ?? undefined,
        overtimeEligible: data.overtimeEligible ?? undefined,
        status: data.status ?? undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT shift error:", error);
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

    if (!(await hasPermissionBackend(user, "shifts", "delete"))) {
      await createAuditLog(user, "Status Changed", "shifts", null, `Unauthorized attempt to delete shift ${id}`, request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const existing = await prisma.shift.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.shift.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Shift deleted" });
  } catch (error: any) {
    console.error("DELETE shift error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
