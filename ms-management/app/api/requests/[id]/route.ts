import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasPermissionBackend } from "@/lib/auth-helpers";
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

    const existing = await prisma.staffRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Authorization: Staff can only edit/cancel their own request while it is Pending.
    // Managers/Admins can update status, reply, and reject reasons.
    const staffMember = await prisma.staff.findFirst({
      where: { email: user.email }
    });
    const staffId = staffMember ? staffMember.id : user.id;
    const isOwner = existing.staffId === staffId;
    const isStaff = user.role === "Staff";

    if (isStaff && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Permission Check
    if (!isStaff) {
      if (data.status === "Approved") {
        if (!(await hasPermissionBackend(user, "requests", "approve"))) {
          return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
        }
      } else if (data.status === "Rejected" || data.status === "Returned") {
        if (!(await hasPermissionBackend(user, "requests", "reject"))) {
          return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
        }
      } else {
        if (!(await hasPermissionBackend(user, "requests", "edit"))) {
          return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
        }
      }
    }

    let updatePayload: any = {};
    const auditLogs: any[] = Array.isArray(existing.history) ? [...(existing.history as any[])] : [];

    if (isStaff) {
      if (existing.status !== "Pending") {
        return NextResponse.json({ error: "Cannot modify a request that is already being processed" }, { status: 400 });
      }
      
      updatePayload = {
        description: data.description !== undefined ? data.description : undefined,
        attachment: data.attachment !== undefined ? data.attachment : undefined,
        status: data.status === "Cancelled" ? "Cancelled" : undefined // Staff can cancel
      };

      if (data.status === "Cancelled") {
        auditLogs.push({
          date: new Date().toISOString().replace("T", " ").slice(0, 19),
          action: "Cancelled",
          user: user.name
        });
      } else {
        auditLogs.push({
          date: new Date().toISOString().replace("T", " ").slice(0, 19),
          action: "Edited",
          user: user.name
        });
      }
    } else {
      // Admins/Managers processing the request
      updatePayload = {
        status: data.status !== undefined ? data.status : undefined,
        reason: data.reason !== undefined ? data.reason : undefined,
        reply: data.reply !== undefined ? data.reply : undefined
      };

      if (data.status && data.status !== existing.status) {
        auditLogs.push({
          date: new Date().toISOString().replace("T", " ").slice(0, 19),
          action: `Status changed to ${data.status}`,
          user: user.name,
          note: data.reply || data.reason || null
        });
      }
    }

    updatePayload.history = auditLogs;

    const updated = await prisma.staffRequest.update({
      where: { id },
      data: updatePayload
    });

    // ── Email notification when admin/manager changes status ────────────────
    const statusChanged = data.status && data.status !== existing.status;
    if (!isStaff && statusChanged && updated.email) {
      let subject = "";
      let body = "";

      if (data.status === "Approved") {
        subject = `Request Approved: ${updated.requestType}`;
        body = `Dear ${updated.name},

Your request has been APPROVED.

Request Details:
- Type: ${updated.requestType}
- Description: ${updated.description}
- Request Date: ${updated.date}
- Approved By: ${user.name}

${data.reply ? `Message from HR:\n${data.reply}\n` : ""}Please contact HR if you need any further assistance.

Best regards,
${updated.company} HR Department`;

      } else if (data.status === "Rejected") {
        subject = `Request Update: ${updated.requestType}`;
        body = `Dear ${updated.name},

We regret to inform you that your request has been reviewed and could not be approved at this time.

Request Details:
- Type: ${updated.requestType}
- Description: ${updated.description}
- Request Date: ${updated.date}

${data.reason ? `Reason:\n${data.reason}\n` : ""}${data.reply ? `Message from HR:\n${data.reply}\n` : ""}If you have questions, please contact the HR department.

Best regards,
${updated.company} HR Department`;

      } else if (data.status === "Processing") {
        subject = `Request In Progress: ${updated.requestType}`;
        body = `Dear ${updated.name},

Your request is currently being processed by the HR department.

Request Details:
- Type: ${updated.requestType}
- Description: ${updated.description}
- Request Date: ${updated.date}

${data.reply ? `Message from HR:\n${data.reply}\n` : ""}We will notify you once a final decision is made.

Best regards,
${updated.company} HR Department`;

      } else {
        subject = `Request Status Updated: ${updated.requestType}`;
        body = `Dear ${updated.name},

Your request status has been updated to: ${data.status}.

${data.reply ? `Message from HR:\n${data.reply}\n` : ""}Best regards,
${updated.company} HR Department`;
      }

      sendEmail({
        to: updated.email,
        subject,
        body,
        candidateName: updated.name,
        company: updated.company,
        branch: updated.branch,
        templateType: "General_Announcement",
        templateData: {
          recipientName: updated.name,
          announcementTitle: `Request Update: ${updated.requestType}`,
          announcementMessage: `Your request for **${updated.requestType}** has been updated to status: **${data.status}**.`,
          notes: data.reply || ""
        }
      }).catch(err => console.error("Async staff request email error:", err));

      if (existing.staffId) {
        try {
          await prisma.notification.create({
            data: {
              title: `Request Status: ${data.status}`,
              message: `Your ${updated.requestType} request has been marked as ${data.status}.`,
              type: data.status === "Approved" ? "Success" : (data.status === "Rejected" ? "Alert" : "Info"),
              userId: existing.staffId,
              company: updated.company,
              branch: updated.branch,
              link: "/requests",
              createdAt: new Date().toISOString()
            }
          });
        } catch (err) {
          console.error("Failed to send staff request notification:", err);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT request error:", error);
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

    const existing = await prisma.staffRequest.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only managers/admins of the same company (or Super Admin) can delete requests, or the owner if Pending
    const staffMember = await prisma.staff.findFirst({
      where: { email: user.email }
    });
    const staffId = staffMember ? staffMember.id : user.id;
    const isOwner = existing.staffId === staffId;
    const isStaff = user.role === "Staff";

    if (isStaff) {
      if (!isOwner || existing.status !== "Pending") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      if (user.role !== "Super Admin" && existing.company !== user.company) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!(await hasPermissionBackend(user, "requests", "delete"))) {
        return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
      }
    }

    await prisma.staffRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Request deleted" });
  } catch (error: any) {
    console.error("DELETE request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
