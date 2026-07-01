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

    if (user.role === "Staff" || user.role === "Recruiter") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.payrollRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        basicSalary: data.basicSalary !== undefined ? Number(data.basicSalary) : undefined,
        allowances: data.allowances !== undefined ? Number(data.allowances) : undefined,
        deductions: data.deductions !== undefined ? Number(data.deductions) : undefined,
        allowanceDetails: data.allowanceDetails !== undefined ? data.allowanceDetails : undefined,
        deductionDetails: data.deductionDetails !== undefined ? data.deductionDetails : undefined,
        advanceDeduction: data.advanceDeduction !== undefined ? Number(data.advanceDeduction) : undefined,
        loanDeduction: data.loanDeduction !== undefined ? Number(data.loanDeduction) : undefined,
        overtimeHours: data.overtimeHours !== undefined ? Number(data.overtimeHours) : undefined,
        overtimeRate: data.overtimeRate !== undefined ? Number(data.overtimeRate) : undefined,
        overtime: data.overtime !== undefined ? Number(data.overtime) : undefined,
        netSalary: data.netSalary !== undefined ? Number(data.netSalary) : undefined,
        status: data.status ?? undefined,
        month: data.month ?? undefined,
        year: data.year !== undefined ? parseInt(data.year) : undefined,
        position: data.position ?? undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT payroll error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "Staff" || user.role === "Recruiter") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.payrollRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.payrollRecord.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Payroll record deleted" });
  } catch (error: any) {
    console.error("DELETE payroll error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
