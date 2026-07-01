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

    let shifts = await prisma.shift.findMany({
      where: filter,
      orderBy: { name: "asc" }
    });

    if (shifts.length === 0) {
      const company = user.company === "System" ? "Alpha Solutions LLC" : user.company;
      const branch = user.branch === "All" ? "Main Branch" : user.branch;
      
      const defaultShiftsData = [
        { name: "Morning Shift (9 to 7)", clockIn: "09:00", clockOut: "19:00", gracePeriod: 15, breakDuration: 60, description: "Standard Morning Shift", company, branch, createdBy: "System", createdAt: new Date().toISOString().slice(0, 10) },
        { name: "Long Shift (7 to 9)", clockIn: "07:00", clockOut: "21:00", gracePeriod: 15, breakDuration: 60, description: "Full Day Extended Shift", company, branch, createdBy: "System", createdAt: new Date().toISOString().slice(0, 10) },
        { name: "Early Shift (7:30 to 5:30)", clockIn: "07:30", clockOut: "17:30", gracePeriod: 15, breakDuration: 60, description: "Standard Early Shift", company, branch, createdBy: "System", createdAt: new Date().toISOString().slice(0, 10) },
      ];

      for (const d of defaultShiftsData) {
        await prisma.shift.create({ data: d });
      }

      shifts = await prisma.shift.findMany({
        where: filter,
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json(shifts);
  } catch (error: any) {
    console.error("GET shifts error:", error);
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

    const clockIn = data.clockIn || data.startTime;
    const clockOut = data.clockOut || data.endTime;
    const gracePeriod = data.gracePeriod !== undefined ? parseInt(data.gracePeriod) : 15;
    const breakDuration = data.breakDuration !== undefined ? parseInt(data.breakDuration) : 60;
    const description = data.description || "";

    if (!data.name || !clockIn || !clockOut || !data.company || !data.branch) {
      return NextResponse.json(
        { error: "Name, clockIn/startTime, clockOut/endTime, company, and branch are required" },
        { status: 400 }
      );
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && data.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const shift = await prisma.shift.create({
      data: {
        id: data.id || undefined,
        name: data.name,
        clockIn,
        clockOut,
        gracePeriod,
        breakDuration,
        description,
        company: data.company,
        branch: data.branch,
        createdBy: user.name,
        createdAt: new Date().toISOString().slice(0, 10),
        overtimeEligible: data.overtimeEligible || "Yes",
        status: data.status || "Active"
      }
    });

    return NextResponse.json(shift);
  } catch (error: any) {
    console.error("POST shift error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
