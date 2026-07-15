import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter, hasPermissionBackend } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermissionBackend(user, "leave", "view"))) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
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

    // Standard staff members see only their own leave requests
    if (!isAdmin) {
      const staffMember = await prisma.staff.findFirst({
        where: { email: user.email }
      });
      filter["staffId"] = staffMember ? staffMember.id : "NOT_FOUND";
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: filter,
      orderBy: { createdAt: "desc" }
    });

    // Map leaveType to type and appliedDate to createdAt if needed
    // In e:/MS Company Managment/ms-management/lib/types.ts:
    //   leaveType: "Annual" | "Sick" | "Emergency" | "Vacation" | "Unpaid";
    //   fromDate: string;
    //   toDate: string;
    //   days: number;
    //   reason: string;
    //   attachment: string | null;
    //   status: "Pending" | "Processing" | "Approved" | "Rejected";
    //   appliedDate: string;
    // Let's verify that the db fields map directly to client expectations:
    // In schema.prisma:
    //   model LeaveRequest {
    //     id          String   @id @default(cuid())
    //     staffId     String
    //     staffName   String
    //     type        String   // "Annual" | "Sick" | "Emergency" | "Unpaid" | "Maternity" | "Paternity"
    //     startDate   String
    //     endDate     String
    //     days        Int
    //     reason      String
    //     status      String   // "Pending" | "Approved" | "Rejected" | "Cancelled"
    //     company     String
    //     branch      String
    //     createdAt   String
    //     approvedBy  String?
    //   }
    //
    // Notice that:
    // - database uses "type" but frontend uses "leaveType"
    // - database uses "startDate" and "endDate" but frontend uses "fromDate" and "toDate"
    // - database has no "appliedDate" or "attachment"
    //
    // Let's align them in mapping!
    const mapped = leaveRequests.map((l: any) => ({
      id: l.id,
      staffId: l.staffId,
      staffName: l.staffName,
      leaveType: l.type,
      fromDate: l.startDate,
      toDate: l.endDate,
      days: l.days,
      reason: l.reason,
      attachment: null, // support document attachment
      status: l.status,
      appliedDate: l.createdAt.slice(0, 10),
      company: l.company,
      branch: l.branch,
      approvedBy: l.approvedBy,
      approvedAt: null,
      createdAt: l.createdAt
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("GET leave requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermissionBackend(user, "leave", "create"))) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.staffId || !data.fromDate || !data.toDate) {
      return NextResponse.json(
        { error: "Staff member, from date, and to date are required" },
        { status: 400 }
      );
    }

    // Tenancy Check
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

    const newRequest = await prisma.leaveRequest.create({
      data: {
        id: data.id || undefined,
        staffId: data.staffId,
        staffName: data.staffName || user.name,
        type: data.leaveType || "Annual",
        startDate: data.fromDate,
        endDate: data.toDate,
        days: Number(data.days) || 1,
        reason: data.reason || "",
        status: data.status || "Pending",
        company: company,
        branch: branch,
        createdAt: data.createdAt || new Date().toISOString().replace("T", " ").slice(0, 19),
        approvedBy: null
      }
    });

    const mappedResponse = {
      id: newRequest.id,
      staffId: newRequest.staffId,
      staffName: newRequest.staffName,
      leaveType: newRequest.type,
      fromDate: newRequest.startDate,
      toDate: newRequest.endDate,
      days: newRequest.days,
      reason: newRequest.reason,
      attachment: null,
      status: newRequest.status,
      appliedDate: newRequest.createdAt.slice(0, 10),
      company: newRequest.company,
      branch: newRequest.branch,
      approvedBy: newRequest.approvedBy,
      approvedAt: null,
      createdAt: newRequest.createdAt
    };

    // Trigger real-time email notification to the staff member
    const staffMember = await prisma.staff.findUnique({
      where: { id: newRequest.staffId }
    });

    if (staffMember && staffMember.email) {
      const emailBody = `Dear ${staffMember.name},

Your leave request has been submitted successfully and is currently pending approval.

Leave Details:
- Request ID: ${newRequest.id}
- Type: ${newRequest.type}
- Duration: ${newRequest.startDate} to ${newRequest.endDate} (${newRequest.days} days)
- Reason: ${newRequest.reason || "N/A"}
- Status: Pending

We will notify you once a decision is made.

Best regards,
${newRequest.company} HR Department`;

      sendEmail({
        to: staffMember.email,
        subject: `Leave Request Submitted: ${newRequest.type} Leave - ${staffMember.name}`,
        body: emailBody,
        candidateName: staffMember.name,
        company: newRequest.company,
        branch: newRequest.branch,
        templateType: "General_Announcement",
        templateData: {
          recipientName: staffMember.name,
          announcementTitle: `Leave Request Submitted: ${newRequest.type}`,
          announcementMessage: `Your leave request for **${newRequest.type}** leave has been successfully submitted.\n\n**Duration:** ${newRequest.startDate} to ${newRequest.endDate} (${newRequest.days} days)\n**Reason:** ${newRequest.reason || "N/A"}`,
          notes: "Status: Pending approval. We will notify you once a decision is made."
        }
      }).catch(err => console.error("Async leave submit email error:", err));

      try {
        await prisma.notification.create({
          data: {
            title: "New Leave Request",
            message: `${staffMember.name} has applied for ${newRequest.type} leave (${newRequest.days} days).`,
            type: "Leave",
            userId: "admin", // Matches Admins via GET route OR logic
            company: newRequest.company,
            branch: newRequest.branch,
            link: "/leave",
            createdAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error("Failed to send leave admin notification:", err);
      }
    }

    return NextResponse.json(mappedResponse);
  } catch (error: any) {
    console.error("POST leave request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
