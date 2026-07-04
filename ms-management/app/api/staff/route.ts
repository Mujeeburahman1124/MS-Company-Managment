import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    const staff = await prisma.staff.findMany({
      where: filter,
      orderBy: { name: "asc" }
    });

    return NextResponse.json(staff);
  } catch (error: any) {
    console.error("GET staff error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.name || !data.company || !data.branch) {
      return NextResponse.json(
        { error: "Name, company, and branch are required" },
        { status: 400 }
      );
    }

    // Tenancy Check: Company Admin / Branch Admin can only create staff for their company/branch
    if (user.role !== "Super Admin") {
      if (data.company !== user.company) {
        return NextResponse.json({ error: "Cannot create staff for another company" }, { status: 403 });
      }
      if (user.role === "Branch Admin" && data.branch !== user.branch) {
        return NextResponse.json({ error: "Cannot create staff for another branch" }, { status: 403 });
      }
    }

    // Validate email uniqueness in Staff, Applicant, and User tables
    if (data.email && data.email.trim() !== "") {
      const emailLower = data.email.trim().toLowerCase();
      
      const existingUser = await prisma.user.findUnique({
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

    // Auto-generate temporary password if email is provided and they have system access
    let temporaryPassword = "";
    let hashedPassword = "";
    const hasSystemAccess = data.role === undefined || data.role !== "";
    if (data.email && data.email.trim() !== "" && hasSystemAccess) {
      // Generate a secure 8-character random password
      temporaryPassword = Math.random().toString(36).slice(-8);
      hashedPassword = bcrypt.hashSync(temporaryPassword, 10);
    }

    const newStaff = await prisma.staff.create({
      data: {
        id: data.id || undefined,
        photo: data.photo || null,
        name: data.name,
        nationality: data.nationality || "",
        nationalityFlag: data.nationalityFlag || "",
        mobile: data.mobile || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        birthday: data.birthday || "",
        position: data.position || "",
        joiningDate: data.joiningDate || "",
        passportExpiry: data.passportExpiry || "",
        visaExpiry: data.visaExpiry || "",
        passportNumber: data.passportNumber || "",
        emiratesId: data.emiratesId || "",
        status: data.status || "Active",
        company: data.company,
        branch: data.branch,
        createdBy: user.name,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
        documents: data.documents || [],
        basicSalary: data.basicSalary !== undefined ? parseFloat(data.basicSalary) : 3000,
        housingAllowance: data.housingAllowance !== undefined ? parseFloat(data.housingAllowance) : 1000,
        transportAllowance: data.transportAllowance !== undefined ? parseFloat(data.transportAllowance) : 500,
        overtimeRate: data.overtimeRate !== undefined ? parseFloat(data.overtimeRate) : 15,
        shiftId: data.shiftId || "",
        salaryType: data.salaryType || "Monthly",
        permissions: data.permissions || null
      }
    });

    // Create a corresponding User account for logins if email is provided and system access is enabled
    if (newStaff.email && newStaff.email.trim() !== "" && hasSystemAccess) {
      let role = data.role;
      if (!role) {
        // Fallback to position guessing if role was not selected/passed
        role = "Staff";
        const pos = (newStaff.position || "").toLowerCase();
        if (pos.includes("hr manager") || pos.includes("hr")) role = "HR Manager";
        else if (pos.includes("recruiter")) role = "Recruiter";
        else if (pos.includes("accountant")) role = "Accountant";
        else if (pos.includes("branch admin")) role = "Branch Admin";
        else if (pos.includes("admin")) role = "Admin";
      }

      await prisma.user.create({
        data: {
          name: newStaff.name,
          email: newStaff.email.trim().toLowerCase(),
          password: hashedPassword,
          mobile: newStaff.mobile || "",
          whatsapp: newStaff.whatsapp || "",
          role,
          company: newStaff.company,
          branch: newStaff.branch,
          status: "Active",
          lastLogin: "",
          permissions: data.permissions || null
        }
      });
    }

    // Trigger real-time notifications for staff
    if (newStaff.email) {
      let emailBody = `Dear ${newStaff.name},

Welcome to the team at ${newStaff.company}!

Here are your details as registered in our system:
- Name: ${newStaff.name}
- Position: ${newStaff.position}
- Company: ${newStaff.company}
- Branch: ${newStaff.branch}
- Joining Date: ${newStaff.joiningDate}`;

      if (temporaryPassword) {
        emailBody += `

We have automatically generated a user login account for you:
- Login Email: ${newStaff.email}
- Temporary Password: ${temporaryPassword}

Please log in and update your password immediately by clicking on your profile avatar in the sidebar.`;
      } else {
        emailBody += `

Please note: A system login account was not requested for your profile. If you require access to the employee portal in the future, please contact your HR or System Administrator.`;
      }

      emailBody += `

We are excited to have you on board!

Best regards,
${newStaff.company} HR Team`;

      await sendEmail({
        to: newStaff.email,
        subject: `Welcome to the team at ${newStaff.company} - Staff Registration Success`,
        body: emailBody,
        candidateName: newStaff.name,
        company: newStaff.company,
        branch: newStaff.branch
      }).catch(err => console.error("Async staff email sending error:", err));
    }

    if (newStaff.whatsapp || newStaff.mobile) {
      const waNumber = newStaff.whatsapp || newStaff.mobile;
      let waMessage = `Dear ${newStaff.name}, welcome to ${newStaff.company}! Your staff registration is complete as a ${newStaff.position}.`;
      if (temporaryPassword) {
        waMessage += ` Your temporary portal password is: ${temporaryPassword}. Please log in and change it.`;
      }

      await sendWhatsApp({
        to: waNumber,
        message: waMessage,
        candidateName: newStaff.name,
        company: newStaff.company,
        branch: newStaff.branch
      }).catch(err => console.error("Async staff WhatsApp sending error:", err));
    }

    return NextResponse.json(newStaff);
  } catch (error: any) {
    console.error("POST staff error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
