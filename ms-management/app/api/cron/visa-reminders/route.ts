import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const now = new Date();
    // Normalizing today to start of day
    now.setHours(0, 0, 0, 0);

    const getDaysDiff = (dateStr: string) => {
      if (!dateStr) return null;
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) return null;
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getReminderLevel = (days: number) => {
      if (days <= 20 && days > 0) return `daily_reminder_${days}_days`;
      if (days === 0) return "Expired_Today";
      if (days < 0 && days >= -30) return `Expired_Overdue_${Math.abs(days)}_days`;
      return null;
    };

    const processEntity = async (entity: any, entityType: "Applicant" | "Staff") => {
      const logs: string[] = [];
      const { id, company, branch, visaExpiry, passportExpiry, passportNumber, email, status, clientName } = entity;
      const name = entityType === "Applicant" ? entity.fullName : entity.name;

      const checkExpiry = async (expiryDateStr: string, expiryType: "Visa" | "Passport") => {
        const daysDiff = getDaysDiff(expiryDateStr);
        if (daysDiff === null) return;

        const reminderLevel = getReminderLevel(daysDiff);
        if (!reminderLevel) return;

        // Check existing log
        const existingLog = await prisma.visaReminderLog.findFirst({
          where: {
            entityId: id,
            entityType: entityType,
            expiryType: expiryType,
            reminderLevel: reminderLevel
          }
        });

        if (!existingLog) {
          await prisma.visaReminderLog.create({
            data: {
              entityId: id,
              entityType: entityType,
              entityName: name,
              expiryType: expiryType,
              expiryDate: expiryDateStr,
              reminderLevel: reminderLevel,
              sentAt: new Date().toISOString(),
              company: company || "",
              branch: branch || ""
            }
          });

          let message = "";
          let emailBody = "";
          if (reminderLevel === "Expired") {
            message = `${entityType} ${name}'s ${expiryType} has EXPIRED on ${expiryDateStr}.`;
            emailBody = `<p>Dear ${name},</p><p>Please be advised that your ${expiryType} has EXPIRED on ${expiryDateStr}. Please take immediate action to renew it.</p>`;
          } else {
            message = `${entityType} ${name}'s ${expiryType} is expiring in ${daysDiff} days (${expiryDateStr}).`;
            emailBody = `<p>Dear ${name},</p><p>Please be advised that your ${expiryType} will expire in ${daysDiff} days on ${expiryDateStr}. Please initiate the renewal process.</p>`;
          }

          // 1. Send Notification to Admins
          const admins = await prisma.user.findMany({
            where: {
              company: company,
              role: { in: ["Super Admin", "Company Admin", "Branch Admin"] },
              status: "Active"
            }
          });

          const targetAdmins = admins.filter(admin => 
            admin.role === "Super Admin" || 
            (admin.role === "Company Admin" && admin.company === company) ||
            (admin.role === "Branch Admin" && admin.company === company && admin.branch === branch)
          );

          for (const admin of targetAdmins) {
            await prisma.notification.create({
              data: {
                title: `${expiryType} Expiry Alert`,
                message: message,
                type: reminderLevel === "Expired" ? "Alert" : "Warning",
                createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                userId: admin.id,
                company: company,
                branch: branch,
                link: entityType === "Applicant" ? `/applicants/${id}` : `/staff/${id}`
              }
            });
          }

          // 2. Send actual email to Entity (Applicant / Staff)
          if (email) {
            await sendEmail({
              to: email,
              subject: `Action Required: Your ${expiryType} Expiry Notice`,
              body: emailBody,
              candidateName: name,
              company: company,
              branch: branch,
              templateType: expiryType === "Visa" ? "Visa" : "Passport_Expiry",
              templateData: {
                recipientName: name,
                visaExpiry: expiryDateStr,
                passportExpiry: expiryDateStr,
                passportNumber: passportNumber || "N/A",
                daysRemaining: daysDiff,
              }
            });
          }

          // 3. Send email to Client Company if Placed (For Applicants only)
          if (entityType === "Applicant" && status === "Placed" && clientName) {
            const cCompany = await prisma.company.findFirst({
              where: { name: clientName }
            });
            if (cCompany && cCompany.email) {
              await sendEmail({
                to: cCompany.email,
                subject: `Action Required: ${expiryType} Expiry for Placed Applicant ${name}`,
                body: `<p>Dear ${clientName} Management,</p><p>This is a notification that your placed applicant, ${name}, has a ${expiryType} that ${reminderLevel === "Expired" ? "has EXPIRED on " + expiryDateStr : "will expire in " + daysDiff + " days on " + expiryDateStr}. Please coordinate with the applicant.</p>`,
                candidateName: name,
                company: company,
                branch: branch,
                templateType: "General_Announcement",
                templateData: {
                  recipientName: `${clientName} Management`,
                  announcementTitle: `Urgent: ${expiryType} Expiry Alert - ${name}`,
                  announcementMessage: `Please be notified that the ${expiryType} for your placed employee, ${name}, ${reminderLevel === "Expired" ? "has EXPIRED on " + expiryDateStr : "is expiring in " + daysDiff + " days on " + expiryDateStr}. Please coordinate renewal actions immediately.`,
                  notes: `Employee Passport: ${passportNumber || "N/A"}`
                }
              });
            }
          }

          logs.push(`Sent ${reminderLevel} reminder for ${name} (${expiryType})`);
        }
      };

      await checkExpiry(visaExpiry, "Visa");
      await checkExpiry(passportExpiry, "Passport");
      return logs;
    };

    const applicants = await prisma.applicant.findMany({
      where: {
        OR: [
          { status: "Processing" },
          { status: "Placed" },
          { status: "Visa Processing" }
        ]
      },
      select: { id: true, fullName: true, visaExpiry: true, passportExpiry: true, passportNumber: true, company: true, branch: true, email: true, status: true, clientName: true }
    });

    const staff = await prisma.staff.findMany({
      where: { status: "Active" },
      select: { id: true, name: true, visaExpiry: true, passportExpiry: true, passportNumber: true, company: true, branch: true, email: true }
    });

    const results: string[] = [];
    for (const applicant of applicants) {
      const logs = await processEntity(applicant, "Applicant");
      results.push(...logs);
    }
    for (const s of staff) {
      const logs = await processEntity(s, "Staff");
      results.push(...logs);
    }

    return NextResponse.json({ 
      success: true, 
      processedApplicants: applicants.length,
      processedStaff: staff.length,
      remindersSent: results.length, 
      logs: results 
    });

  } catch (error: any) {
    console.error("Cron Visa Reminders error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
