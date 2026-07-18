import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter, hasPermissionBackend } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    // Check view permission
    const hasViewPerm = user.role === "Super Admin" || 
                        (await hasPermissionBackend(user, "attendance", "view"));
    
    if (!hasViewPerm) {
      const staffMember = await prisma.staff.findFirst({
        where: { email: user.email }
      });
      filter["staffId"] = staffMember ? staffMember.id : "NO_LINKED_STAFF";
    }

    const requests = await prisma.overtimeRequest.findMany({
      where: filter,
      orderBy: { date: "desc" }
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("GET overtime error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.staffId || !data.staffName || !data.date || !data.hours || !data.company || !data.branch) {
      return NextResponse.json(
        { error: "StaffId, staffName, date, hours, company, and branch are required" },
        { status: 400 }
      );
    }

    const targetStaff = await prisma.staff.findUnique({
      where: { id: data.staffId }
    });
    if (!targetStaff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const isSelf = targetStaff.email?.toLowerCase() === user.email?.toLowerCase();
    const canCreateOthers = user.role === "Super Admin" || 
                            (await hasPermissionBackend(user, "attendance", "create")) ||
                            (await hasPermissionBackend(user, "attendance", "edit"));
    
    if (!canCreateOthers && !isSelf) {
      return NextResponse.json({ error: "Forbidden: Cannot create overtime request for another staff member" }, { status: 403 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && targetStaff.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const req = await prisma.overtimeRequest.create({
      data: {
        id: data.id || undefined,
        staffId: data.staffId,
        staffName: data.staffName,
        date: data.date,
        hours: Number(data.hours) || 0,
        reason: data.reason || "",
        status: data.status || "Pending",
        company: targetStaff.company,
        branch: targetStaff.branch,
        createdAt: data.createdAt || new Date().toISOString()
      }
    });

    return NextResponse.json(req);
  } catch (error: any) {
    console.error("POST overtime error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
