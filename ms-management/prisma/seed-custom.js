const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Manually load env variables from .env if present
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      let val = parts.slice(1).join("=").trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

async function sendEmail({ to, subject, body, candidateName, company, branch }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"MS Horizon Support" <support@mshorizon.ae>`;

  console.log(`[EMAIL-SERVICE] Triggering email notification to: ${to}`);
  let realEmailSent = false;

  if (host && user && pass && !user.includes("your-smtp-email")) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br/>"),
      });

      console.log(`[EMAIL-SERVICE] Email sent successfully to ${to}`);
      realEmailSent = true;
    } catch (err) {
      console.error(`[EMAIL-SERVICE] Error sending email via SMTP:`, err);
    }
  } else {
    console.warn(`[EMAIL-SERVICE] SMTP credentials not fully configured in .env. Simulated email log created.`);
  }

  try {
    await prisma.sentEmail.create({
      data: {
        to,
        subject,
        body,
        sentAt: new Date().toISOString(),
        candidateName: candidateName || "System",
        company: company || "System",
        branch: branch || "Main",
      },
    });
  } catch (dbErr) {
    console.error(`[EMAIL-SERVICE] Failed to save SentEmail log:`, dbErr);
  }
}

async function sendWhatsApp({ to, message, candidateName, company, branch }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  console.log(`[WHATSAPP-SERVICE] Triggering WhatsApp notification to: ${to}`);
  let realWaSent = false;
  let formattedNumber = to.replace(/[^0-9+]/g, "");
  if (!formattedNumber.startsWith("+")) {
    formattedNumber = `+${formattedNumber}`;
  }

  if (accountSid && authToken && !accountSid.startsWith("ACXXXXXX")) {
    try {
      const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: authHeader,
          },
          body: new URLSearchParams({
            From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
            To: `whatsapp:${formattedNumber}`,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        console.log(`[WHATSAPP-SERVICE] WhatsApp sent successfully to ${formattedNumber}`);
        realWaSent = true;
      } else {
        const errorData = await response.json();
        console.error(`[WHATSAPP-SERVICE] Twilio API error:`, errorData);
      }
    } catch (err) {
      console.error(`[WHATSAPP-SERVICE] Error sending WhatsApp via Twilio:`, err);
    }
  } else {
    console.warn(`[WHATSAPP-SERVICE] Twilio credentials not set or placeholder in .env. Simulated WhatsApp log created.`);
  }

  try {
    await prisma.sentWhatsApp.create({
      data: {
        to: formattedNumber,
        message,
        sentAt: new Date().toISOString(),
        candidateName: candidateName || "System",
        company: company || "System",
        branch: branch || "Main",
      },
    });
  } catch (dbErr) {
    console.error(`[WHATSAPP-SERVICE] Failed to save SentWhatsApp log:`, dbErr);
  }
}

async function main() {
  console.log("Starting custom database seeding...");

  // 1. Seed Own Company (InternalCompany)
  console.log("Seeding own company: MS COMPANY...");
  const ownCompany = await prisma.internalCompany.upsert({
    where: { id: "internal-ms-company" },
    update: {},
    create: {
      id: "internal-ms-company",
      name: "MS COMPANY",
      telephone: "0750351668",
      email: "muqsiaqee@gmail.com",
      address: "UAE Office",
      status: "Active",
      subscriptionPlan: "Enterprise",
      licenseExpiry: "2030-12-31",
      maxUsers: 50,
      maxStorage: 20,
      type: "Main Company",
      branch: "UAE",
      location: "Dubai",
      country: "UAE",
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: "System",
    },
  });

  // 2. Seed Client Company (Company)
  console.log("Seeding client company: Alpha company...");
  const clientCompany = await prisma.company.upsert({
    where: { id: "client-alpha-company" },
    update: {},
    create: {
      id: "client-alpha-company",
      name: "Alpha company",
      telephone: "0750351668",
      hrMobile: "0750351668",
      ownerMobile: "0750351668",
      whatsapp: "0750351668",
      email: "aplha@gmail.com",
      address: "Qatar Branch Office",
      status: "Active",
      branches: 1,
      staff: 3,
      applicants: 3,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: "System",
      enabledModules: {
        Applicants: true,
        Staff: true,
        Tasks: true,
        Interviews: true,
        Attendance: true,
      },
    },
  });

  // 3. Seed 3 Staff Members
  console.log("Seeding 3 staff members...");
  const staffData = [
    {
      id: "staff-aqeela",
      name: "Aqeela",
      email: "aqeelamrahman@gmail.com",
      mobile: "0761271647",
      whatsapp: "0761271647",
      position: "Full Stack Developer",
      nationality: "Srilankan",
      nationalityFlag: "🇱🇰",
      birthday: "1998-05-15",
      joiningDate: "2026-07-01",
      passportExpiry: "2032-10-20",
      visaExpiry: "2028-07-01",
      passportNumber: "N1234567",
      emiratesId: "784-1998-1234567-1",
      status: "Active",
      company: "MS COMPANY",
      branch: "UAE",
      createdBy: "System",
      createdAt: new Date().toISOString().slice(0, 10),
    },
    {
      id: "staff-david",
      name: "David Miller",
      email: "david.miller@mshorizon.ae",
      mobile: "+971502223331",
      whatsapp: "+971502223331",
      position: "QA Lead",
      nationality: "Canadian",
      nationalityFlag: "🇨🇦",
      birthday: "1990-09-12",
      joiningDate: "2026-03-01",
      passportExpiry: "2030-05-15",
      visaExpiry: "2027-03-01",
      passportNumber: "CA987654",
      emiratesId: "784-1990-7654321-2",
      status: "Active",
      company: "MS COMPANY",
      branch: "UAE",
      createdBy: "System",
      createdAt: new Date().toISOString().slice(0, 10),
    },
    {
      id: "staff-yusuf",
      name: "Yusuf Rahman",
      email: "yusuf.rahman@mshorizon.ae",
      mobile: "+971502223332",
      whatsapp: "+971502223332",
      position: "UI/UX Designer",
      nationality: "Srilankan",
      nationalityFlag: "🇱🇰",
      birthday: "1995-12-05",
      joiningDate: "2026-06-15",
      passportExpiry: "2031-01-10",
      visaExpiry: "2028-06-15",
      passportNumber: "SL876543",
      emiratesId: "784-1995-8765432-3",
      status: "Active",
      company: "MS COMPANY",
      branch: "UAE",
      createdBy: "System",
      createdAt: new Date().toISOString().slice(0, 10),
    },
  ];

  for (const staff of staffData) {
    const s = await prisma.staff.upsert({
      where: { id: staff.id },
      update: {},
      create: staff,
    });
    console.log(`Inserted staff: ${s.name}`);

    // Trigger real-time notifications for staff
    if (s.email) {
      const emailBody = `Dear ${s.name},

Welcome to the team at ${s.company}!

Here are your details as registered in our system:
- Name: ${s.name}
- Position: ${s.position}
- Company: ${s.company}
- Branch: ${s.branch}
- Joining Date: ${s.joiningDate}

We are excited to have you on board!

Best regards,
${s.company} HR Team`;

      await sendEmail({
        to: s.email,
        subject: `Welcome to the team at ${s.company} - Staff Registration Success`,
        body: emailBody,
        candidateName: s.name,
        company: s.company,
        branch: s.branch,
      });
    }

    if (s.whatsapp || s.mobile) {
      const waNumber = s.whatsapp || s.mobile;
      const waMessage = `Dear ${s.name}, welcome to ${s.company}! Your staff registration is complete as a ${s.position}. We are excited to have you with us!`;

      await sendWhatsApp({
        to: waNumber,
        message: waMessage,
        candidateName: s.name,
        company: s.company,
        branch: s.branch,
      });
    }
  }

  // 4. Seed 3 Applicants
  console.log("Seeding 3 applicants...");
  const applicantsData = [
    {
      id: "applicant-ahmad",
      fullName: "Ahmad Khan",
      email: "muqsiaqee@gmail.com", // user's email so they can receive real email alerts
      mobile: "0750351668",
      whatsapp: "0750351668",
      applyingPositions: ["Software Engineer"],
      salaryExpectation: 7500,
      nationality: "Pakistani",
      nationalityFlag: "🇵🇰",
      currentCountry: "UAE",
      applyCountry: "UAE",
      visaType: "Employment",
      status: "Pending",
      trackingCode: "TRK-2026-001",
      company: "MS COMPANY",
      branch: "UAE",
      createdBy: "System",
      createdAt: new Date().toISOString().slice(0, 10),
      applicationDate: new Date().toISOString().slice(0, 10),
      dateOfBirth: "1995-05-10",
      visaExpiry: "2027-06-22",
      passportExpiry: "2031-10-15",
      passportNumber: "PK7766554",
    },
    {
      id: "applicant-michael",
      fullName: "Michael Green",
      email: "michael.green@example.com",
      mobile: "+971509998881",
      whatsapp: "+971509998881",
      applyingPositions: ["Project Manager"],
      salaryExpectation: 12000,
      nationality: "British",
      nationalityFlag: "🇬🇧",
      currentCountry: "UK",
      applyCountry: "UAE",
      visaType: "Tourist",
      status: "Pending",
      trackingCode: "TRK-2026-002",
      company: "MS COMPANY",
      branch: "UAE",
      createdBy: "System",
      createdAt: new Date().toISOString().slice(0, 10),
      applicationDate: new Date().toISOString().slice(0, 10),
      dateOfBirth: "1988-11-20",
      visaExpiry: "2026-09-22",
      passportExpiry: "2029-04-12",
      passportNumber: "GB1122334",
    },
    {
      id: "applicant-fatima",
      fullName: "Fatima Al-Saeed",
      email: "fatima.s@example.com",
      mobile: "+971509998882",
      whatsapp: "+971509998882",
      applyingPositions: ["HR Administrator"],
      salaryExpectation: 6500,
      nationality: "Emirati",
      nationalityFlag: "🇦🇪",
      currentCountry: "UAE",
      applyCountry: "UAE",
      visaType: "National",
      status: "Pending",
      trackingCode: "TRK-2026-003",
      company: "MS COMPANY",
      branch: "UAE",
      createdBy: "System",
      createdAt: new Date().toISOString().slice(0, 10),
      applicationDate: new Date().toISOString().slice(0, 10),
      dateOfBirth: "1997-03-15",
      visaExpiry: "2035-12-31",
      passportExpiry: "2032-05-18",
      passportNumber: "AE9988776",
    },
  ];

  for (const app of applicantsData) {
    const a = await prisma.applicant.upsert({
      where: { id: app.id },
      update: {},
      create: app,
    });
    console.log(`Inserted applicant: ${a.fullName}`);

    // Trigger real-time notifications for applicants
    if (a.email) {
      const emailBody = `Dear ${a.fullName},

Thank you for registering your application with MS Horizon F.Z.E.

Here are your registration details:
- Applicant Name: ${a.fullName}
- Position(s) Applied: ${a.applyingPositions.join(", ")}
- Application Tracking Code: ${a.trackingCode}

You can track your application status anytime at http://localhost:3000/apply by entering your email or tracking code.

Best regards,
MS Horizon F.Z.E Recruitment Team`;

      await sendEmail({
        to: a.email,
        subject: `Application Registered successfully - Tracking Code: ${a.trackingCode}`,
        body: emailBody,
        candidateName: a.fullName,
        company: a.company,
        branch: a.branch,
      });
    }

    if (a.whatsapp || a.mobile) {
      const waNumber = a.whatsapp || a.mobile;
      const waMessage = `Dear ${a.fullName}, your application for positions: ${a.applyingPositions.join(", ")} has been registered successfully. Track your status using code: ${a.trackingCode}. Welcome to MS Horizon F.Z.E!`;

      await sendWhatsApp({
        to: waNumber,
        message: waMessage,
        candidateName: a.fullName,
        company: a.company,
        branch: a.branch,
      });
    }
  }

  console.log("Custom database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error running custom seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
