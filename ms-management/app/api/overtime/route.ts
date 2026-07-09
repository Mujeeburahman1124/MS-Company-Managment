import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    if (user.role === "Staff") {
      filter["staffId"] = user.id;
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

    // Tenancy Check
    if (user.role !== "Super Admin") {
      if (data.company !== user.company) {
        return NextResponse.json({ error: "Forbidden: Cannot access other company" }, { status: 403 });
      }
      if (user.role !== "Company Admin" && data.branch !== user.branch) {
        return NextResponse.json({ error: "Forbidden: Cannot access other branch" }, { status: 403 });
      }
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
        company: data.company,
        branch: data.branch,
        createdAt: data.createdAt || new Date().toISOString()
      }
    });

    return NextResponse.json(req);
  } catch (error: any) {
    console.error("POST overtime error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
