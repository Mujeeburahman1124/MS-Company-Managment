import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "Super Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const log = await prisma.activityLog.findUnique({
      where: { id }
    });

    if (!log) {
      return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
    }

    if (!log.archived) {
      return NextResponse.json(
        { error: "Only archived logs can be deleted permanently" },
        { status: 400 }
      );
    }

    await prisma.activityLog.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Log entry deleted permanently" });
  } catch (error: any) {
    console.error("DELETE activity log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
