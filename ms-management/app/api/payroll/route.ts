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

    // Staff see only their own payroll logs
    if (user.role === "Staff") {
      filter["staffId"] = user.id;
    }

    const records = await prisma.payrollRecord.findMany({
      where: filter,
      orderBy: { month: "desc" }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("GET payroll error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Accountant, HR, Company Admin, and Super Admin can manage payroll
    if (user.role === "Staff" || user.role === "Recruiter") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.staffId || !data.staffName || !data.month || !data.company || !data.branch) {
      return NextResponse.json(
        { error: "StaffId, staffName, month, company, and branch are required" },
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

    const newRecord = await prisma.payrollRecord.create({
      data: {
        id: data.id || undefined,
        staffId: data.staffId,
        staffName: data.staffName,
        position: data.position || "",
        month: data.month,
        year: data.year ? parseInt(data.year) : (data.month ? parseInt(data.month.slice(0, 4)) : new Date().getFullYear()),
        basicSalary: Number(data.basicSalary) || 0,
        allowances: Number(data.allowances) || 0,
        deductions: Number(data.deductions) || 0,
        allowanceDetails: data.allowanceDetails || null,
        deductionDetails: data.deductionDetails || null,
        advanceDeduction: data.advanceDeduction !== undefined ? Number(data.advanceDeduction) : 0,
        loanDeduction: data.loanDeduction !== undefined ? Number(data.loanDeduction) : 0,
        overtimeHours: data.overtimeHours !== undefined ? Number(data.overtimeHours) : 0,
        overtimeRate: data.overtimeRate !== undefined ? Number(data.overtimeRate) : 0,
        overtime: data.overtime !== undefined ? Number(data.overtime) : 0,
        netSalary: Number(data.netSalary) || 0,
        status: data.status || "Draft",
        company: data.company,
        branch: data.branch,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10)
      }
    });

    return NextResponse.json(newRecord);
  } catch (error: any) {
    console.error("POST payroll error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
