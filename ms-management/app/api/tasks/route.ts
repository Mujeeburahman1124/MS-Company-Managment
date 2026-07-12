import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter, hasPermissionBackend } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/notifications";

// Normalize Prisma Task → frontend Task shape
function normalizeTask(t: any) {
  return {
    ...t,
    deadline: t.deadline || t.dueDate || "",
    assignedDate: t.assignedDate || "",
    history: Array.isArray(t.history) ? t.history : (t.history ? JSON.parse(JSON.stringify(t.history)) : []),
    incompleteReason: t.incompleteReason || undefined,
    applicantId: t.applicantId || undefined,
    applicantName: t.applicantName || undefined,
    targetDocument: t.targetDocument || undefined,
  };
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermissionBackend(user, "tasks", "view"))) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    // Scoping check for Staff: Staff see only tasks assigned to them (by staffId/name)
    if (user.role === "Staff") {
      filter["assignedTo"] = user.name; // match name or id (assignedTo holds staff name or id)
    }

    const tasks = await prisma.task.findMany({
      where: filter,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(tasks.map(normalizeTask));
  } catch (error: any) {
    console.error("GET tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermissionBackend(user, "tasks", "create")) && !(await hasPermissionBackend(user, "tasks", "assign"))) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.title || !data.assignedTo || !data.company || !data.branch) {
      return NextResponse.json(
        { error: "Title, assignedTo, company, and branch are required" },
        { status: 400 }
      );
    }

    // Tenancy Check
    if (user.role !== "Super Admin") {
      if (data.company !== user.company) {
        return NextResponse.json({ error: "Cannot create task for another company" }, { status: 403 });
      }
      if (user.role !== "Company Admin" && data.branch !== user.branch) {
        return NextResponse.json({ error: "Cannot create task for another branch" }, { status: 403 });
      }
    }

    if (data.assignedToId) {
      const assignedStaff = await prisma.staff.findUnique({ where: { id: data.assignedToId } });
      if (assignedStaff) {
        if (user.role !== "Super Admin" && assignedStaff.company !== data.company) {
          return NextResponse.json({ error: "Cannot assign task to a staff member in another company" }, { status: 403 });
        }
        if (user.role !== "Super Admin" && user.role !== "Company Admin" && assignedStaff.branch !== data.branch) {
          return NextResponse.json({ error: "Cannot assign task to a staff member in another branch" }, { status: 403 });
        }
      }
    }

    const task = await prisma.task.create({
      data: {
        id: data.id || undefined,
        title: data.title,
        description: data.description || "",
        assignedTo: data.assignedTo,
        assignedToId: data.assignedToId || "",
        assignedToRole: data.assignedToRole || null,
        status: data.status || "Pending",
        priority: data.priority || "Medium",
        dueDate: data.deadline || data.dueDate || "",
        deadline: data.deadline || null,
        assignedDate: data.assignedDate || null,
        company: data.company,
        branch: data.branch,
        createdBy: user.name,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 19).replace("T", " "),
        completedAt: data.completedAt || null,
        feedback: data.feedback || null,
        applicantId: data.applicantId || null,
        applicantName: data.applicantName || null,
        targetDocument: data.targetDocument || null,
        incompleteReason: data.incompleteReason || null,
        history: data.history || null
      }
    });

    // Send email alert to assignee
    try {
      let assigneeEmail: string | null = null;
      let assigneeName = task.assignedTo;
      let userMember: any = null;

      // 1. Try finding in Staff (case-insensitive fallback)
      let staffMember = await prisma.staff.findFirst({
        where: { name: task.assignedTo }
      });
      
      if (!staffMember) {
        const staffList = await prisma.staff.findMany({
          where: { company: task.company }
        });
        staffMember = staffList.find(s => s.name.trim().toLowerCase() === task.assignedTo.trim().toLowerCase()) || null;
      }

      if (staffMember && staffMember.email) {
        assigneeEmail = staffMember.email;
        assigneeName = staffMember.name;
      } else {
        // 2. Try finding in User (case-insensitive fallback)
        userMember = await prisma.user.findFirst({
          where: { name: task.assignedTo }
        });
        
        if (!userMember) {
          const userList = await prisma.user.findMany({
            where: { company: task.company }
          });
          userMember = userList.find(u => u.name.trim().toLowerCase() === task.assignedTo.trim().toLowerCase()) || null;
        }

        if (userMember && userMember.email) {
          assigneeEmail = userMember.email;
          assigneeName = userMember.name;
        }
      }

      if (assigneeEmail) {
        const applicantInfo = task.applicantName ? `\n- Linked Candidate: ${task.applicantName}` : "";
        const targetDocInfo = task.targetDocument ? `\n- Document to Verify: ${task.targetDocument}` : "";
        const emailBody = `Dear ${assigneeName},

You have been assigned a new task: "${task.title}".

Task Details:
- Title: ${task.title}
- Description: ${task.description || "No description provided."}
- Priority: ${task.priority}
- Due Date: ${task.dueDate || "No due date specified."}${applicantInfo}${targetDocInfo}
- Assigned By: ${user.name}

Please review this task on your dashboard and keep its progress updated.

Best regards,
${task.company} HR & Management System`;

        sendEmail({
          to: assigneeEmail,
          subject: `New Task Assigned: ${task.title}`,
          body: emailBody,
          candidateName: assigneeName,
          company: task.company,
          branch: task.branch
        }).catch(err => console.error("Async task email error:", err));
        
        if (userMember) {
          await prisma.notification.create({
            data: {
              title: "New Task Assigned",
              message: `You have been assigned a new task: "${task.title}".`,
              type: "Task",
              userId: userMember.id,
              company: task.company,
              branch: task.branch,
              link: "/tasks",
              createdAt: new Date().toISOString()
            }
          });
        }
      } else {
        console.warn(`[EMAIL-SERVICE] Assignee '${task.assignedTo}' email not found in Staff or User tables.`);
      }
    } catch (emailErr) {
      console.error("Error setting up task notification:", emailErr);
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("POST task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
