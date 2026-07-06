import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";
import { sendEmail, sendWhatsApp, generateEmailContent } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine if the user's company is a Client Company
    const clientCompany = await prisma.company.findFirst({
      where: { name: user.company }
    });
    const isClient = !!clientCompany;

    let filter: any = {};
    if (user.role !== "Super Admin" && isClient) {
      filter = {
        OR: [
          { company: user.company },
          { clientName: user.company }
        ]
      };
      if (user.role === "Branch Admin" && user.branch && user.branch !== "All") {
        filter.branch = user.branch;
      }
    } else {
      // Internal recruitment agency users (e.g. MS Company Management Solutions) can see all applicants.
      // Filter by branch only if they are a Branch Admin.
      if (user.role === "Branch Admin" && user.branch && user.branch !== "All") {
        filter.branch = user.branch;
      }
    }

    const applicants = await prisma.applicant.findMany({
      where: filter,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(applicants);
  } catch (error: any) {
    console.error("GET applicants error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const data = await request.json();

    if (!data.fullName || !data.company || !data.branch) {
      return NextResponse.json(
        { error: "Full name, company, and branch are required" },
        { status: 400 }
      );
    }

    // Tenancy Check: only if session exists
    if (!user) {
      // Guest registering via public portal - validate selected company and branch
      if (!data.company || !data.branch) {
        return NextResponse.json({ error: "Company and branch selection is required for registration." }, { status: 400 });
      }
      const activeComp = await prisma.internalCompany.findFirst({
        where: { name: data.company, status: "Active" }
      });
      if (!activeComp) {
        return NextResponse.json({ error: "The selected company is invalid or inactive." }, { status: 400 });
      }
      const activeBranch = await prisma.branch.findFirst({
        where: { name: data.branch, company: data.company, status: "Active" }
      });
      if (!activeBranch) {
        return NextResponse.json({ error: "The selected branch is invalid or inactive." }, { status: 400 });
      }
    } else {
      if (user.role !== "Super Admin") {
        if (data.company !== user.company) {
          return NextResponse.json({ error: "Cannot create applicant for another company" }, { status: 403 });
        }
        if (user.role === "Branch Admin" && data.branch !== user.branch) {
          return NextResponse.json({ error: "Cannot create applicant for another branch" }, { status: 403 });
        }
      }
    }

    // Validate passport uniqueness in Staff and Applicant tables
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
        where: { passportNumber: { equals: passportTrimmed, mode: 'insensitive' } }
      });
      if (existingAppPassport) {
        return NextResponse.json(
          { error: `Passport number (${passportTrimmed}) is already registered for applicant ${existingAppPassport.fullName}.` },
          { status: 400 }
        );
      }
    }

    // Validate email uniqueness in Staff, Applicant, and User tables
    if (data.email && data.email.trim() !== "") {
      const emailLower = data.email.trim().toLowerCase();
      
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

      const existingApplicant = await prisma.applicant.findFirst({
        where: { email: emailLower }
      });
      if (existingApplicant) {
        return NextResponse.json(
          { error: "An applicant with this email address already exists." },
          { status: 400 }
        );
      }
    }

    // Check phone/whatsapp uniqueness in Staff and Applicant tables
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

    // Generate tracking code if not provided
    let trackingCode = data.trackingCode;
    if (!trackingCode) {
      const year = new Date().getFullYear();
      const count = await prisma.applicant.count();
      trackingCode = `TRK-${year}-${String(count + 1).padStart(3, "0")}`;
    }

    const applicant = await prisma.applicant.create({
      data: {
        id: data.id || undefined,
        photo: data.photo || null,
        applicationDate: data.applicationDate || new Date().toISOString().slice(0, 10),
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth || "",
        email: data.email ? data.email.trim().toLowerCase() : "",
        mobile: data.mobile || "",
        whatsapp: data.whatsapp || "",
        nationality: data.nationality || "",
        nationalityFlag: data.nationalityFlag || "",
        currentCountry: data.currentCountry || "",
        applyingPositions: data.applyingPositions || [],
        salaryExpectation: Number(data.salaryExpectation) || 0,
        applyCountry: data.applyCountry || "",
        visaType: data.visaType || "",
        visaExpiry: data.visaExpiry || "",
        passportExpiry: data.passportExpiry || "",
        passportNumber: data.passportNumber || "",
        status: data.status || "Pending",
        trackingCode: trackingCode,
        company: data.company,
        branch: data.branch,
        createdBy: user ? user.name : (data.fullName || "Online Application"),
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
        documents: data.documents || [],
        statusHistory: data.statusHistory || [],
        clientName: data.clientName || null,
        clientPhoto: data.clientPhoto || null,
        clientMobile: data.clientMobile || null,
        clientWhatsapp: data.clientWhatsapp || null,
        clientEmail: data.clientEmail || null,
        memberActive: data.memberActive || false
      }
    });
    const targetClientCompany = applicant.clientName || data.clientName;
    // 1. Notify Agency (Own Company) admins
    try {
      await prisma.notification.create({
        data: {
          title: "New Online Application Received",
          message: `Applicant ${applicant.fullName} has registered online. Next step: Click here to review details, documents, and schedule an interview.`,
          type: "Info",
          userId: "admin",
          company: "MS Company Management Solutions",
          link: `/applicants/${applicant.id}`,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error("Failed to create agency notification:", err);
    }

    // 2. Also notify the target Client Company admins if selected
    if (targetClientCompany && targetClientCompany !== "Not Placed" && targetClientCompany !== "System") {
      try {
        await prisma.notification.create({
          data: {
            title: "New Online Application Received",
            message: `Applicant ${applicant.fullName} has applied to your company. Next step: Review profile and schedule interview.`,
            type: "Info",
            userId: "admin",
            company: targetClientCompany,
            link: `/applicants/${applicant.id}`,
            createdAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error("Failed to create client company notification:", err);
      }
    }
    // Trigger real-time notifications asynchronously
    if (applicant.email && applicant.email.trim() !== "") {
      const companyName = applicant.company && applicant.company !== "Not Placed" ? applicant.company : "MS Human Resource Consultancies";
      const generated = generateEmailContent("Registration" as any, {
        applicantName: applicant.fullName,
        company: companyName,
        branch: applicant.branch || undefined,
        role: Array.isArray(applicant.applyingPositions) 
          ? (applicant.applyingPositions as string[]).join(", ") 
          : (applicant.applyingPositions ? String(applicant.applyingPositions) : undefined),
        extraDetails: applicant.trackingCode ? String(applicant.trackingCode) : undefined
      });

      try {
        await sendEmail({
          to: applicant.email,
          subject: generated.subject,
          body: generated.body,
          candidateName: applicant.fullName,
          company: companyName,
          branch: applicant.branch || undefined,
          templateType: "Registration",
          templateData: {
            recipientName: applicant.fullName,
            trackingCode: applicant.trackingCode || "",
            applicationDate: new Date().toISOString().split("T")[0],
            applyingPositions: Array.isArray(applicant.applyingPositions)
              ? (applicant.applyingPositions as string[]).join(", ")
              : (applicant.applyingPositions ? String(applicant.applyingPositions) : "")
          }
        });
      } catch (err) {
        console.error("Async email sending error:", err);
      }
    }

    // Link applicant with Client Company, create Placement + Agreement, and dispatch email alerts
    if (targetClientCompany && targetClientCompany !== "Not Placed" && targetClientCompany !== "System") {
      try {
        const clientCompany = await prisma.company.findFirst({
          where: { name: targetClientCompany }
        });

        if (clientCompany) {
          // 1. Sync the applicant profile's client fields to ensure they match clientCompany details
          await prisma.applicant.update({
            where: { id: applicant.id },
            data: {
              clientName: clientCompany.name,
              clientEmail: clientCompany.email,
              clientMobile: clientCompany.telephone || "",
              clientWhatsapp: clientCompany.whatsapp || "",
            }
          });

          // 2. Automatically create a Placement & Agreement record for this applicant and Client Company
          const placementId = `PLM-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;
          
          await prisma.placement.create({
            data: {
              id: placementId,
              applicantId: applicant.id,
              applicantName: applicant.fullName,
              companyId: clientCompany.id,
              companyName: clientCompany.name,
              position: (() => {
                const pos = applicant.applyingPositions;
                if (Array.isArray(pos) && pos.length > 0) {
                  return String(pos[0]);
                }
                if (pos && typeof pos === "string") {
                  return pos;
                }
                return "General Staff";
              })(),
              salary: Number(applicant.salaryExpectation) || 4000,
              placementDate: applicant.applicationDate || new Date().toISOString().slice(0, 10),
              status: "Trial", // Initial status
              company: applicant.company && applicant.company !== "Not Placed" ? applicant.company : "MS Company Management Solutions",
              branch: applicant.branch && applicant.branch !== "Not Placed" ? applicant.branch : "Dubai Main Branch",
              createdAt: applicant.createdAt || new Date().toISOString().slice(0, 10),
              agreementStatus: "Pending",
              termsAndConditions: `Standard Recruitment and Placement Agreement terms apply for ${clientCompany.name}.\n\nRegistration fee: AED 500, Placement fee: AED 1000.\nAll invoices are payable within 14 business days of candidates placement date.`,
              registrationFee: 500,
              placementFee: 1000,
              refundStatus: "Not Applicable",
              agreementAccepted: false,
              notes: `Auto-linked placement and agreement for client ${clientCompany.name}`,
              agreementHistory: [
                `Placement and Payment Agreement automatically initialized for candidate ${applicant.fullName} under hiring client ${clientCompany.name} on ${new Date().toISOString().slice(0, 10)}.`
              ],
              passportNumber: applicant.passportNumber || "",
              mobileNumber: applicant.mobile || "",
              registrationDate: applicant.applicationDate || "",
              placementDeadline: ""
            }
          });

          // 3. Prepare and send notification emails to Company Email & HR Email
          const recipients: string[] = [];
          if (clientCompany.email) {
            recipients.push(clientCompany.email.trim());
          }
          if (clientCompany.hrMobile && clientCompany.hrMobile.includes("@")) {
            recipients.push(clientCompany.hrMobile.trim());
          }

          const docsText = applicant.documents && Array.isArray(applicant.documents) && applicant.documents.length > 0
            ? applicant.documents.map((d: any) => `- ${d.type || 'Doc'}: ${d.name}`).join("\n")
            : "No documents uploaded.";

          const hrEmailBody = `Dear Team at ${clientCompany.name},\n\nA new online application has been registered for your company.\n\nCandidate Details:\n- Name: ${applicant.fullName}\n- Position Applied: ${Array.isArray(applicant.applyingPositions) ? applicant.applyingPositions.join(", ") : applicant.applyingPositions}\n- Nationality: ${applicant.nationality || "N/A"}\n- Mobile Number: ${applicant.mobile || "N/A"}\n- WhatsApp Number: ${applicant.whatsapp || "N/A"}\n- Email Address: ${applicant.email || "N/A"}\n- Application Date: ${applicant.applicationDate}\n- Tracking Code: ${applicant.trackingCode}\n\nUploaded Documents:\n${docsText}\n\nYou can view the full applicant details by clicking the link below:\nhttp://localhost:3000/applicants/${applicant.id}\n\nBest regards,\nMS Company Management Solutions Operations Team`;

          for (const recipient of recipients) {
            try {
              await sendEmail({
                to: recipient,
                subject: `[New Application] ${applicant.fullName} - ${clientCompany.name}`,
                body: hrEmailBody,
                candidateName: applicant.fullName,
                company: clientCompany.name,
                branch: applicant.branch && applicant.branch !== "Not Placed" ? applicant.branch : "Dubai Main Branch",
                sentBy: "System",
                type: "Email"
              });
            } catch (err) {
              console.error(`Error sending email to ${recipient}:`, err);
            }
          }
        }
      } catch (err) {
        console.error("Error creating linked placement agreement & dispatching notifications:", err);
      }
    }

    if (applicant.whatsapp || applicant.mobile) {
      const waNumber = applicant.whatsapp || applicant.mobile;
      const companyName = applicant.company && applicant.company !== "Not Placed" ? applicant.company : "MS Horizon F.Z.E";
      const waMessage = `Dear ${applicant.fullName}, your application for positions: ${Array.isArray(applicant.applyingPositions) ? applicant.applyingPositions.join(", ") : applicant.applyingPositions} has been registered successfully. Track your status using code: ${applicant.trackingCode}. Welcome to ${companyName}!`;

      try {
        await sendWhatsApp({
          to: waNumber,
          message: waMessage,
          candidateName: applicant.fullName,
          company: applicant.company,
          branch: applicant.branch
        });
      } catch (err) {
        console.error("Async WhatsApp sending error:", err);
      }
    }

    return NextResponse.json(applicant);
  } catch (error: any) {
    console.error("POST applicant error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
