import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasPermissionBackend, createAuditLog, canModifyRecord } from "@/lib/auth-helpers";

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

    const existing = await prisma.payrollRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    if (data.status === "Approved") {
      if (!(await hasPermissionBackend(user, "payroll", "approve"))) {
        await createAuditLog(user, "Status Changed", "payroll", null, `Unauthorized attempt to approve payroll record ${id}`, request.headers.get("x-forwarded-for"));
        return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
      }
    } else {
      if (!(await canModifyRecord(user, "payroll", "edit", existing))) {
        await createAuditLog(user, "Status Changed", "payroll", null, `Unauthorized attempt to edit payroll record ${id}`, request.headers.get("x-forwarded-for"));
        return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
      }
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent editing financial details of already approved or paid payroll
    if (existing.status === "Approved" || existing.status === "Paid") {
      const isStatusOnlyUpdate = data.status !== undefined && 
                                 data.basicSalary === undefined && 
                                 data.allowances === undefined && 
                                 data.deductions === undefined && 
                                 data.overtimeHours === undefined && 
                                 data.overtime === undefined;
      
      if (!isStatusOnlyUpdate && !(await hasPermissionBackend(user, "payroll", "approve"))) {
        return NextResponse.json({ error: "Forbidden: Cannot modify details of approved or paid payroll without approval permission" }, { status: 403 });
      }
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

    // Handle Notifications for Status Changes
    if (data.status && data.status !== existing.status) {
      try {
        const staffMember = await prisma.staff.findUnique({
          where: { id: updated.staffId }
        });

        if (staffMember) {
          const userMember = await prisma.user.findFirst({
            where: { name: staffMember.name }
          });
          
          if (userMember) {
            await prisma.notification.create({
              data: {
                title: `Payslip ${data.status}`,
                message: `Your payslip for ${updated.month} ${updated.year} is now ${data.status}.`,
                type: data.status === "Paid" ? "Payment" : "Info",
                userId: userMember.id,
                company: updated.company,
                branch: updated.branch,
                link: "/profile",
                createdAt: new Date().toISOString()
              }
            });
          }

          if (staffMember.email) {
            const { sendEmail } = await import("@/lib/notifications");
            await sendEmail({
              to: staffMember.email,
              subject: `Payslip Update: ${updated.month} ${updated.year} - ${data.status}`,
              body: `Dear ${staffMember.name},\n\nYour payslip for ${updated.month} ${updated.year} is now marked as ${data.status}.\nNet Salary: ${updated.netSalary}\n\nPlease check your dashboard for full details.\n\nBest regards,\n${updated.company} HR & Finance`,
              candidateName: staffMember.name,
              company: updated.company,
              branch: updated.branch,
              templateType: "General_Announcement",
              templateData: {
                recipientName: staffMember.name,
                announcementTitle: `Payslip Status: ${data.status}`,
                announcementMessage: `Your payslip for **${updated.month} ${updated.year}** has been marked as **${data.status}**.\n\n**Net Salary:** AED ${updated.netSalary}\n**Basic Salary:** AED ${updated.basicSalary}\n**Allowances:** AED ${updated.allowances}\n**Deductions:** AED ${updated.deductions}`,
                notes: `Please check your employee portal dashboard for full details.`
              }
            }).catch(e => console.error(e));
          }
        }
      } catch (err) {
        console.error("Failed to send payslip update notification:", err);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT payroll error:", error);
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

    const existing = await prisma.payrollRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    if (!(await canModifyRecord(user, "payroll", "delete", existing))) {
      await createAuditLog(user, "Status Changed", "payroll", null, `Unauthorized attempt to delete payroll record ${id}`, request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
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
