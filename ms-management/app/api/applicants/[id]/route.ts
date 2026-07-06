import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { sendEmail, sendWhatsApp, generateEmailContent } from "@/lib/notifications";

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

    const existing = await prisma.applicant.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin") {
      if (existing.company !== user.company) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (user.role === "Branch Admin" && existing.branch !== user.branch) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    // Validate email uniqueness in Staff, Applicant, and User tables (excluding current ID/email)
    if (data.email && data.email.trim() !== "") {
      const emailLower = data.email.trim().toLowerCase();
      const oldEmailLower = existing.email ? existing.email.trim().toLowerCase() : "";
      
      if (emailLower !== oldEmailLower) {
        const existingUser = await prisma.user.findFirst({
          where: { email: emailLower }
        });
        if (existingUser) {
          return NextResponse.json(
            { error: "A user account with this email address already exists." },
            { status: 400 }
          );
        }

        const existingStaff = await prisma.staff.findFirst({
          where: { email: emailLower }
        });
        if (existingStaff) {
          return NextResponse.json(
            { error: "A staff member with this email address already exists." },
            { status: 400 }
          );
        }
      }

      const existingApplicant = await prisma.applicant.findFirst({
        where: { email: emailLower, id: { not: id } }
      });
      if (existingApplicant) {
        return NextResponse.json(
          { error: "An applicant with this email address already exists." },
          { status: 400 }
        );
      }
    }

    // Check phone/whatsapp uniqueness in Staff and Applicant tables (excluding current ID)
    if (data.mobile || data.whatsapp) {
      const cleanMobile = data.mobile ? data.mobile.trim().replace(/[^0-9+]/g, "") : "";
      const cleanWhatsapp = data.whatsapp ? data.whatsapp.trim().replace(/[^0-9+]/g, "") : "";
      
      if (cleanMobile || cleanWhatsapp) {
        const numbersToCheck = [cleanMobile, cleanWhatsapp].filter(n => n.length > 5);
        for (const num of numbersToCheck) {
          // Check in Staff
          const dupStaff = await prisma.staff.findFirst({
            where: {
              OR: [
                { mobile: { contains: num } },
                { whatsapp: { contains: num } }
              ]
            }
          });
          if (dupStaff) {
            return NextResponse.json({ error: `Mobile or WhatsApp number (${num}) is already registered for staff member ${dupStaff.name}.` }, { status: 400 });
          }

          // Check in Applicant
          const dupApp = await prisma.applicant.findFirst({
            where: {
              id: { not: id },
              OR: [
                { mobile: { contains: num } },
                { whatsapp: { contains: num } }
              ]
            }
          });
          if (dupApp) {
            return NextResponse.json({ error: `Mobile or WhatsApp number (${num}) is already registered for applicant ${dupApp.fullName}.` }, { status: 400 });
          }
        }
      }
    }

    // Validate passport uniqueness in Staff and Applicant tables (excluding current ID)
    if (data.passportNumber && data.passportNumber.trim() !== "") {
      const passportTrimmed = data.passportNumber.trim();
      
      const existingStaffPassport = await prisma.staff.findFirst({
        where: { passportNumber: { equals: passportTrimmed, mode: 'insensitive' } }
      });
      if (existingStaffPassport) {
        return NextResponse.json(
          { error: `Passport number (${passportTrimmed}) is already registered for staff member ${existingStaffPassport.name}.` },
          { status: 400 }
        );
      }

      const existingAppPassport = await prisma.applicant.findFirst({
        where: { passportNumber: { equals: passportTrimmed, mode: 'insensitive' }, id: { not: id } }
      });
      if (existingAppPassport) {
        return NextResponse.json(
          { error: `Passport number (${passportTrimmed}) is already registered for applicant ${existingAppPassport.fullName}.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.applicant.update({
      where: { id },
      data: {
        photo: data.photo !== undefined ? data.photo : undefined,
        applicationDate: data.applicationDate ?? undefined,
        fullName: data.fullName ?? undefined,
        dateOfBirth: data.dateOfBirth ?? undefined,
        email: data.email ?? undefined,
        mobile: data.mobile ?? undefined,
        whatsapp: data.whatsapp ?? undefined,
        nationality: data.nationality ?? undefined,
        nationalityFlag: data.nationalityFlag ?? undefined,
        currentCountry: data.currentCountry ?? undefined,
        applyingPositions: data.applyingPositions ?? undefined,
        salaryExpectation: data.salaryExpectation !== undefined ? Number(data.salaryExpectation) : undefined,
        applyCountry: data.applyCountry ?? undefined,
        visaType: data.visaType ?? undefined,
        visaExpiry: data.visaExpiry ?? undefined,
        passportExpiry: data.passportExpiry ?? undefined,
        passportNumber: data.passportNumber ?? undefined,
        status: data.status ?? undefined,
        trackingCode: data.trackingCode ?? undefined,
        company: data.company ?? undefined,
        branch: data.branch ?? undefined,
        documents: data.documents !== undefined ? data.documents : undefined,
        statusHistory: data.statusHistory !== undefined ? data.statusHistory : undefined,
        clientName: data.clientName !== undefined ? data.clientName : undefined,
        clientPhoto: data.clientPhoto !== undefined ? data.clientPhoto : undefined,
        clientMobile: data.clientMobile !== undefined ? data.clientMobile : undefined,
        clientWhatsapp: data.clientWhatsapp !== undefined ? data.clientWhatsapp : undefined,
        clientEmail: data.clientEmail !== undefined ? data.clientEmail : undefined,
        memberActive: data.memberActive !== undefined ? data.memberActive : undefined
      }
    });

    // Auto-create Placement record when status becomes Placed
    if (data.status === "Placed" && existing.status !== "Placed") {
      const existingPlacement = await prisma.placement.findFirst({
        where: { applicantId: id }
      });

      if (!existingPlacement) {
        const clientCompany = await prisma.company.findFirst({
          where: { name: data.clientName || updated.clientName || "" }
        });

        await prisma.placement.create({
          data: {
            applicantId: id,
            applicantName: updated.fullName,
            companyId: clientCompany?.id || "unknown-client",
            companyName: data.clientName || updated.clientName || "Unknown Client Company",
            position: updated.applyingPositions && Array.isArray(updated.applyingPositions) && updated.applyingPositions[0] ? (updated.applyingPositions[0] as string) : "Staff Member",
            salary: Number(data.salary) || 0,
            placementDate: data.placementDate || new Date().toISOString().slice(0, 10),
            status: "Placed",
            company: updated.company,
            branch: updated.branch,
            createdAt: new Date().toISOString().slice(0, 10),
            agreementStatus: "Signed",
            passportNumber: updated.passportNumber || "",
            mobileNumber: updated.mobile || "",
            registrationDate: new Date().toISOString().slice(0, 10),
            placementDeadline: new Date().toISOString().slice(0, 10),
            registrationFee: 0,
            placementFee: 0,
            refundStatus: "Not Applicable",
            agreementAccepted: true,
            agreementHistory: [
              `Placement automatically created upon applicant status change to Placed.`,
              `Placed with company: ${data.clientName || updated.clientName || "Unknown Client"} on ${data.placementDate || new Date().toISOString().slice(0, 10)}.`
            ]
          }
        });
      }
    }

    // If status has changed, trigger real-time notifications
    if (data.status && data.status !== existing.status && updated.email) {
      if (updated.status === "Selected") {
        const positionsStr = Array.isArray(updated.applyingPositions) ? updated.applyingPositions.join(", ") : updated.applyingPositions;
        try {
          await sendEmail({
            to: updated.email,
            subject: `Job Offer Invitation: ${positionsStr}`,
            body: "Job Offer Details",
            candidateName: updated.fullName,
            company: updated.company,
            branch: updated.branch,
            type: "Offer",
            templateType: "Offer",
            templateData: {
              recipientName: updated.fullName,
              position: positionsStr,
              salary: updated.salaryExpectation ? String(updated.salaryExpectation) : "As agreed in interviews",
              joiningDate: "Immediate or as per visa processing",
              allowances: "Standard accommodation and transport as per UAE Labor Law",
              offerLetterLink: `http://localhost:3000/apply?code=${updated.trackingCode}`
            }
          });
        } catch (err) {
          console.error("Async offer letter email error:", err);
        }
      } else {
        const companyName = updated.company && updated.company !== "Not Placed" ? updated.company : "MS Human Resource Consultancies";
        const emailBody = `Please be informed that your application status has been updated to: **${updated.status}**.\n\n**Registration Summary:**\n- Candidate Name: ${updated.fullName}\n- Tracking Code: ${updated.trackingCode}\n- Position: ${Array.isArray(updated.applyingPositions) ? updated.applyingPositions.join(", ") : updated.applyingPositions}`;

        try {
          await sendEmail({
            to: updated.email,
            subject: `Application Status Updated: ${updated.status} - Tracking Code: ${updated.trackingCode}`,
            body: emailBody,
            candidateName: updated.fullName,
            company: companyName,
            branch: updated.branch,
            type: "Status Update",
            templateType: "System",
            templateData: {
              recipientName: updated.fullName,
              body: emailBody,
              actionLink: `http://localhost:3000/apply?code=${updated.trackingCode}`
            }
          });
        } catch (err) {
          console.error("Async status update email error:", err);
        }
      }
    } else if (updated.email && Object.keys(data).some(key => data[key] !== undefined && data[key] !== (existing as any)[key])) {
      // General profile update
      const companyName = updated.company && updated.company !== "Not Placed" ? updated.company : "MS Human Resource Consultancies";
      const emailBody = `This is to notify you that your application profile details have been updated in our recruitment system.\n\n**Profile Summary:**\n- Tracking Code: ${updated.trackingCode}\n- Position: ${Array.isArray(updated.applyingPositions) ? (updated.applyingPositions as string[]).join(", ") : updated.applyingPositions}`;

      try {
        await sendEmail({
          to: updated.email,
          subject: `Application Profile Updated - Tracking Code: ${updated.trackingCode}`,
          body: emailBody,
          candidateName: updated.fullName,
          company: companyName,
          branch: updated.branch,
          templateType: "System",
          templateData: {
            recipientName: updated.fullName,
            body: emailBody,
            actionLink: `http://localhost:3000/apply?code=${updated.trackingCode}`
          }
        });
      } catch (err) {
        console.error("Async general update email error:", err);
      }
    }

    if (data.status && data.status !== existing.status && (updated.whatsapp || updated.mobile)) {
      const waNumber = updated.whatsapp || updated.mobile;
      const waMessage = `Dear ${updated.fullName}, your application status has been updated to: ${updated.status}. You can track it using code: ${updated.trackingCode}.`;

      try {
        await sendWhatsApp({
          to: waNumber,
          message: waMessage,
          candidateName: updated.fullName,
          company: updated.company,
          branch: updated.branch
        });
      } catch (err) {
        console.error("Async status update WhatsApp error:", err);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT applicant error:", error);
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

    const existing = await prisma.applicant.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin") {
      if (existing.company !== user.company) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (user.role === "Branch Admin" && existing.branch !== user.branch) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.applicant.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Applicant deleted" });
  } catch (error: any) {
    console.error("DELETE applicant error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
