import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/notifications";

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

    const existing = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Tenancy Check scoping
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Map input fields from frontend keys to DB fields
    const updatePayload: any = {};
    if (data.leaveType !== undefined) updatePayload.type = data.leaveType;
    if (data.fromDate !== undefined) updatePayload.startDate = data.fromDate;
    if (data.toDate !== undefined) updatePayload.endDate = data.toDate;
    if (data.days !== undefined) updatePayload.days = Number(data.days);
    if (data.reason !== undefined) updatePayload.reason = data.reason;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.approvedBy !== undefined) updatePayload.approvedBy = data.approvedBy;

    // Save update in DB
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: updatePayload
    });

    if (updated.status === "Approved") {
      try {
        const start = new Date(updated.startDate);
        const end = new Date(updated.endDate);
        const dateList: Date[] = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dateList.push(new Date(d));
        }

        const dateGroups: Record<string, { year: number, month: string, dates: string[] }> = {};
        for (const dateObj of dateList) {
          const yyyy = dateObj.getFullYear();
          const monthLong = dateObj.toLocaleString("en-US", { month: "long" });
          const key = `${yyyy}-${monthLong}`;
          const dateStr = dateObj.toISOString().slice(0, 10);
          
          if (!dateGroups[key]) {
            dateGroups[key] = { year: yyyy, month: monthLong, dates: [] };
          }
          dateGroups[key].dates.push(dateStr);
        }

        for (const [key, group] of Object.entries(dateGroups)) {
          const existingAttendance = await prisma.staffAttendance.findFirst({
            where: {
              staffId: updated.staffId,
              month: group.month,
              year: group.year
            }
          });

          let currentRecords: any[] = [];
          if (existingAttendance) {
            try {
              currentRecords = typeof existingAttendance.records === 'string'
                ? JSON.parse(existingAttendance.records)
                : (existingAttendance.records as any[]);
            } catch (e) {}
          }

          for (const dStr of group.dates) {
            const existingDayIdx = currentRecords.findIndex(r => r.date === dStr);
            const leaveDayRecord = {
              date: dStr,
              status: "Leave",
              clockIn: "",
              clockOut: "",
              overtimeHours: 0
            };
            if (existingDayIdx >= 0) {
              currentRecords[existingDayIdx] = leaveDayRecord;
            } else {
              currentRecords.push(leaveDayRecord);
            }
          }

          if (existingAttendance) {
            await prisma.staffAttendance.update({
              where: { id: existingAttendance.id },
              data: {
                records: currentRecords as any
              }
            });
          } else {
            await prisma.staffAttendance.create({
              data: {
                staffId: updated.staffId,
                staffName: updated.staffName,
                month: group.month,
                year: group.year,
                records: currentRecords as any,
                company: updated.company,
                branch: updated.branch
              }
            });
          }
        }
      } catch (err) {
        console.error("Auto mapping approved leaves to attendance error:", err);
      }
    }

    const mappedResponse = {
      id: updated.id,
      staffId: updated.staffId,
      staffName: updated.staffName,
      leaveType: updated.type,
      fromDate: updated.startDate,
      toDate: updated.endDate,
      days: updated.days,
      reason: updated.reason,
      attachment: null,
      status: updated.status,
      appliedDate: updated.createdAt.slice(0, 10),
      company: updated.company,
      branch: updated.branch,
      approvedBy: updated.approvedBy,
      approvedAt: data.approvedAt || null,
      rejectReason: data.rejectReason || undefined,
      createdAt: updated.createdAt
    };

    // If status has changed, trigger real-time notifications
    const statusChanged = data.status && data.status !== existing.status;

    if (statusChanged) {
      const staffMember = await prisma.staff.findUnique({
        where: { id: updated.staffId }
      });

      if (staffMember && staffMember.email) {
        let decisionText = "";
        let detailsList = "";

        if (updated.status === "Approved") {
          decisionText = "CONGRATULATIONS! Your leave request has been APPROVED.";
        } else if (updated.status === "Rejected") {
          decisionText = `Your leave request has been REJECTED.\nRejection Reason: ${data.rejectReason || "No reason specified"}`;
        } else {
          decisionText = `Your leave request status has been updated to: ${updated.status}.`;
        }

        const emailBody = `Dear ${staffMember.name},

This email is to notify you that your leave request status has been updated.

${decisionText}

Leave Details:
- Request ID: ${updated.id}
- Type: ${updated.type}
- Duration: ${updated.startDate} to ${updated.endDate} (${updated.days} days)
- Reason: ${updated.reason || "N/A"}
- Decided By: ${updated.approvedBy || user.name}

Please contact the HR department if you have any questions or require further details.

Best regards,
${updated.company} HR Department`;

        sendEmail({
          to: staffMember.email,
          subject: `Leave Request Status Updated: ${updated.status} - ID: ${updated.id}`,
          body: emailBody,
          candidateName: staffMember.name,
          company: updated.company,
          branch: updated.branch
        }).catch(err => console.error("Async leave status update email error:", err));
      }
    }

    return NextResponse.json(mappedResponse);
  } catch (error: any) {
    console.error("PUT leave request error:", error);
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

    const existing = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Tenancy Check scoping
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.leaveRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Leave request deleted" });
  } catch (error: any) {
    console.error("DELETE leave request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
