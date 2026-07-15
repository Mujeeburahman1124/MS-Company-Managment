import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const logs: string[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Helper: calculate days difference
    const getDaysDiff = (dateStr: string) => {
      if (!dateStr) return null;
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) return null;
      
      // If we're dealing with a recurring date (like birthday), shift year to current year
      // Otherwise, standard diff
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Helper: get days until birthday (adjusting for current year)
    const getDaysUntilBirthday = (dobStr: string) => {
      if (!dobStr) return null;
      const dob = new Date(dobStr);
      if (isNaN(dob.getTime())) return null;
      
      let nextBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < now) {
        // If birthday passed this year, look at next year
        nextBirthday = new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate());
      }
      
      const diffTime = nextBirthday.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // ==========================================
    // 1. INTERVIEW REMINDERS (1 Day Before)
    // ==========================================
    const upcomingInterviews = await prisma.interview.findMany({
      where: { status: "Scheduled" }
    });

    for (const interview of upcomingInterviews) {
      if (!interview.dateTime) continue;
      const interviewDate = new Date(interview.dateTime);
      interviewDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Remind 1 day before
      if (daysDiff === 1 && interview.emailId) {
        const isOnline = interview.onlinePhysical === "Online";
        const emailBody = `Dear ${interview.personName},
        
This is a reminder that your ${interview.type} is scheduled for tomorrow on ${interview.dateTime.replace("T", " ")}.

Type: ${isOnline ? "Online" : "Physical"}
Location/Link: ${isOnline ? (interview.meetingLink || "Link to be provided") : (interview.googleMapLink || "Location to be provided")}

Please ensure you are available on time.

Best regards,
${interview.company} HR Department`;

        await sendEmail({
          to: interview.emailId,
          subject: `Interview Reminder: Tomorrow at ${interview.dateTime.replace("T", " ")}`,
          body: emailBody,
          candidateName: interview.personName,
          company: interview.company,
          branch: interview.branch,
          templateType: "Interview_Reminder",
          templateData: {
            recipientName: interview.personName,
            role: interview.interviewPosition || "Candidate",
            dateTime: interview.dateTime.replace("T", " "),
            onlinePhysical: interview.onlinePhysical,
            meetingMode: interview.meetingMode,
            conductPersonName: interview.conductPersonName,
            meetingLink: interview.meetingLink,
            googleMapLink: interview.googleMapLink,
            notes: interview.notes,
          }
        }).catch(e => console.error(e));
        
        logs.push(`Sent Interview reminder for ${interview.personName}`);
      }
    }


    // ==========================================
    // 2. BIRTHDAY NOTIFICATIONS (7 Days & Day Of)
    // ==========================================
    const allStaff = await prisma.staff.findMany({
      where: { status: "Active" }
    });

    for (const staff of allStaff) {
      // staff model uses 'dob', check if it exists:
      const staffDob = (staff as any).dob || (staff as any).dateOfBirth;
      const daysUntil = getDaysUntilBirthday(staffDob);
      if (daysUntil === null) continue;

      if (daysUntil === 7 || daysUntil === 0) {
        const admins = await prisma.user.findMany({
          where: { 
            company: staff.company,
            role: { in: ["Super Admin", "Company Admin", "Branch Admin", "HR Manager"] }
          }
        });

        // 1. Alert Admins/HR
        for (const admin of admins) {
          if (admin.role === "Branch Admin" && admin.branch !== staff.branch) continue;
          
          await prisma.notification.create({
            data: {
              title: daysUntil === 0 ? "Birthday Today!" : "Upcoming Birthday",
              message: daysUntil === 0 
                ? `Today is ${staff.name}'s birthday! Wish them well.`
                : `${staff.name}'s birthday is coming up in 7 days.`,
              type: "Birthday",
              userId: admin.id,
              company: staff.company,
              branch: staff.branch,
              link: `/staff/${staff.id}`,
              createdAt: new Date().toISOString()
            }
          });
        }

        // 2. Send Email Greeting if it's the actual day
        if (daysUntil === 0 && staff.email) {
          const emailBody = `Dear ${staff.name},
          
Wishing you a very Happy Birthday! We hope you have a fantastic day celebrating.

Best wishes from all of us at ${staff.company}!`;

          await sendEmail({
            to: staff.email,
            subject: `Happy Birthday from ${staff.company}! 🎂`,
            body: emailBody,
            candidateName: staff.name,
            company: staff.company,
            branch: staff.branch,
            templateType: "Birthday",
            templateData: {
              recipientName: staff.name,
              announcementTitle: `Happy Birthday, ${staff.name}! 🎂`,
              announcementMessage: `On behalf of everyone at ${staff.company || "our organization"}, we wish you a wonderful birthday filled with joy, success, and happiness. Thank you for your valuable contributions to our team!`,
            }
          }).catch(e => console.error(e));
        }

        logs.push(`Sent Birthday alert for ${staff.name} (${daysUntil} days)`);
      }
    }


    // ==========================================
    // 3. VEHICLE NOTIFICATIONS (15 days, 7 days, 0 days)
    // ==========================================
    const allVehicles = await prisma.vehicle.findMany();
    
    for (const vehicle of allVehicles) {
      const checkVehicleExpiry = async (expiryDateStr: string, expiryType: string) => {
        const daysDiff = getDaysDiff(expiryDateStr);
        if (daysDiff === null) return;

        if (daysDiff === 15 || daysDiff === 7 || daysDiff === 0 || daysDiff === -1) {
          let message = "";
          let level = "";
          const vMake = (vehicle as any).make || (vehicle as any).vehicleMake || "Vehicle";

          if (daysDiff === 0 || daysDiff === -1) {
            message = `${vMake} (${vehicle.plateNumber}) ${expiryType} has EXPIRED!`;
            level = "Alert";
          } else {
            message = `${vMake} (${vehicle.plateNumber}) ${expiryType} expires in ${daysDiff} days.`;
            level = "Warning";
          }

          const admins = await prisma.user.findMany({
            where: { 
              company: vehicle.company,
              role: { in: ["Super Admin", "Company Admin", "Branch Admin"] }
            }
          });

          for (const admin of admins) {
            if (admin.role === "Branch Admin" && admin.branch !== vehicle.branch) continue;
            
            await prisma.notification.create({
              data: {
                title: `Vehicle ${expiryType} Alert`,
                message: message,
                type: level,
                userId: admin.id,
                company: vehicle.company,
                branch: vehicle.branch,
                link: `/vehicles`,
                createdAt: new Date().toISOString()
              }
            });
            
            // Send email to admin
            if (admin.email) {
              await sendEmail({
                to: admin.email,
                subject: `Action Required: Vehicle ${expiryType} - ${vehicle.plateNumber}`,
                body: `Dear ${admin.name},\n\n${message}\n\nPlease take the necessary actions.\n\nBest regards,\nSystem Notifications`,
                company: vehicle.company,
                branch: vehicle.branch,
                templateType: "General_Announcement",
                templateData: {
                  recipientName: admin.name,
                  announcementTitle: `Vehicle Expiry Warning: ${expiryType}`,
                  announcementMessage: `This is to notify you that the vehicle **${vMake}** (Plate Number: **${vehicle.plateNumber}**) has a **${expiryType}** expiring on **${expiryDateStr}**. Please coordinate the renewal immediately.`,
                  notes: `Days Remaining: ${daysDiff}`
                }
              }).catch(e => console.error(e));
            }
          }
          logs.push(`Sent Vehicle alert for ${vehicle.plateNumber} (${expiryType})`);
        }
      };

      await checkVehicleExpiry(vehicle.insuranceExpiry, "Insurance");
      await checkVehicleExpiry(vehicle.registrationExpiry, "Registration");
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Cron Daily Reminders Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
