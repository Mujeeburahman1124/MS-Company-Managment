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

    const updated = await prisma.overtimeRequest.update({
      where: { id },
      data: {
        hours: data.hours !== undefined ? Number(data.hours) : undefined,
        reason: data.reason ?? undefined,
        status: data.status ?? undefined
      }
    });

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

    await prisma.overtimeRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Overtime request deleted" });
  } catch (error: any) {
    console.error("DELETE overtime error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
