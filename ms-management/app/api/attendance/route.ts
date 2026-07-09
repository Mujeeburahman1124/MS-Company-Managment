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

    const isAdmin = user.role === "Super Admin" || 
                    user.role === "Company Admin" || 
                    user.role === "Branch Admin" || 
                    user.role === "HR Manager" || 
                    user.role === "Admin" || 
                    user.role === "HR" ||
                    user.role === "Recruiter" ||
                    user.role === "Accountant";

    if (!isAdmin) {
      const staffMember = await prisma.staff.findFirst({
        where: { email: user.email }
      });
      filter["staffId"] = staffMember ? staffMember.id : "NOT_FOUND";
    }

    const attendance = await prisma.staffAttendance.findMany({
      where: filter,
      orderBy: [
        { year: "desc" },
        { month: "desc" }
      ]
    });

    return NextResponse.json(attendance);
  } catch (error: any) {
    console.error("GET attendance error:", error);
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

    if (!data.staffId || !data.month || data.year === undefined || !data.records) {
      return NextResponse.json(
        { error: "StaffId, month, year, and records are required" },
        { status: 400 }
      );
    }

    let company = data.company || user.company;
    let branch = data.branch || user.branch;

    if (user.role !== "Super Admin") {
      if (company !== user.company) {
        return NextResponse.json({ error: "Forbidden: Cannot access other company" }, { status: 403 });
      }
      if (user.role !== "Company Admin" && branch !== user.branch) {
        return NextResponse.json({ error: "Forbidden: Cannot access other branch" }, { status: 403 });
      }
    }

    // Find if record already exists for this staff, month and year
    const existing = await prisma.staffAttendance.findFirst({
      where: {
        staffId: data.staffId,
        month: data.month,
        year: Number(data.year)
      }
    });

    let record;
    if (existing) {
      record = await prisma.staffAttendance.update({
        where: { id: existing.id },
        data: {
          records: data.records,
          staffName: data.staffName || undefined
        }
      });
    } else {
      record = await prisma.staffAttendance.create({
        data: {
          id: data.id || undefined,
          staffId: data.staffId,
          staffName: data.staffName || "Staff member",
          month: data.month,
          year: Number(data.year),
          records: data.records,
          company,
          branch
        }
      });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("POST attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
