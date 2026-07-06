import nodemailer from "nodemailer";
import prisma from "./prisma";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";


const cleanEnvVar = (val: string | undefined) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, "");
};

// ─── HTML Email Template ──────────────────────────────────────────────────────
function buildHtmlEmail(
  subject: string, 
  body: string, 
  company = "MS Human Resource Consultancies",
  templateType?: 
    | "Interview" | "Interview_Initial" | "Interview_Online" | "Interview_Physical" | "Interview_Cancelled" | "Interview_Completed"
    | "Offer" | "Visa" | "Registration" | "Placement" | "Leave" | "Payroll" | "Birthday",
  companyEmail = "hr@safayar-msjobs.com",
  companyPhone = "+971 58 532 2913",
  companyAddress = "Industrial Area 2, Ajman, UAE",
  companyLogo = ""
): string {
  // Parse paragraphs and table items
  let meetingLink = "";
  let locationLink = "";

  const lines = body.split("\n");
  const tableRows: { key: string; val: string }[] = [];
  const normalParas: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    
    // Parse links if present
    if (trimmed.toLowerCase().startsWith("meeting link:")) {
      const match = trimmed.match(/https?:\/\/\S+/i);
      if (match) meetingLink = match[0];
      continue;
    }
    if (trimmed.toLowerCase().startsWith("location link:")) {
      const match = trimmed.match(/https?:\/\/\S+/i);
      if (match) locationLink = match[0];
      continue;
    }
    
    // Treat as key-value row if it contains ":" and isn't a link/greeting/salutation
    if (trimmed.includes(":") && 
        !trimmed.toLowerCase().includes("http:") && 
        !trimmed.toLowerCase().includes("https:") && 
        !trimmed.startsWith("Dear") && 
        !trimmed.startsWith("Hello") &&
        !trimmed.startsWith("Subject:")
    ) {
      const cleanLine = trimmed.replace(/^[-•*]\s*/, "");
      const colonIdx = cleanLine.indexOf(":");
      const key = cleanLine.substring(0, colonIdx).trim();
      const val = cleanLine.substring(colonIdx + 1).trim();
      if (key && val) {
        tableRows.push({ key, val });
        continue;
      }
    }
    
    normalParas.push(trimmed);
  }

  // Generate body introduction and footer greetings
  let introHtml = "";
  let closingHtml = "";
  let alertHtml = "";
  
  // Clean up candidate/user salutations & identify notice text
  for (const p of normalParas) {
    if (p.startsWith("Dear") || p.startsWith("Hello")) {
      introHtml += `<p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #1e293b;">${p}</p>`;
    } else if (p.toLowerCase().includes("pleased to invite") || p.toLowerCase().includes("welcome") || p.toLowerCase().includes("inform you")) {
      introHtml += `<p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.6;">${p}</p>`;
    } else if (p.toLowerCase().includes("unable to attend") || p.toLowerCase().includes("renew before the expiry") || p.toLowerCase().includes("keep your mobile number")) {
      const isWarning = p.toLowerCase().includes("renew") || p.toLowerCase().includes("expiry");
      const alertBg = isWarning ? "#fef2f2" : "#eff6ff";
      const alertBorder = isWarning ? "#fecaca" : "#bfdbfe";
      const alertColor = isWarning ? "#991b1b" : "#1e40af";
      const alertIcon = isWarning ? "⚠" : "🔔";
      
      alertHtml += `
        <table width="100%" cellpadding="0" cellspacing="0" style="background: ${alertBg}; border: 1px solid ${alertBorder}; border-radius: 12px; padding: 14px 16px; margin: 16px 0 20px 0;">
          <tr>
            <td width="6%" style="vertical-align: top; font-size: 18px; line-height: 1;">${alertIcon}</td>
            <td width="94%" style="font-size: 12px; font-weight: 600; color: ${alertColor}; line-height: 1.5;">${p}</td>
          </tr>
        </table>`;
    } else if (p.startsWith("Best Regards") || p.startsWith("Regards") || p.toLowerCase().includes("look forward") || p.toLowerCase().includes("thank you")) {
      closingHtml += `<p style="margin: 8px 0; font-size: 13px; color: #475569; line-height: 1.5;">${p}</p>`;
    } else {
      // General body text
      introHtml += `<p style="margin: 0 0 14px 0; font-size: 13px; color: #475569; line-height: 1.6;">${p}</p>`;
    }
  }

  const getIconForKey = (kName: string): string => {
    const k = kName.toLowerCase();
    if (k.includes("name")) return "👤";
    if (k.includes("position") || k.includes("role") || k.includes("job")) return "💼";
    if (k.includes("client") || k.includes("company")) return "🏢";
    if (k.includes("date")) return "📅";
    if (k.includes("time")) return "⏰";
    if (k.includes("location") || k.includes("address")) return "📍";
    if (k.includes("type") || k.includes("format")) return "👥";
    if (k.includes("person") || k.includes("conductor")) return "👤";
    if (k.includes("number") || k.includes("mobile") || k.includes("phone") || k.includes("whatsapp")) return "📞";
    if (k.includes("passport") || k.includes("visa")) return "🆔";
    if (k.includes("days") || k.includes("remaining")) return "⚠️";
    if (k.includes("instruction") || k.includes("remarks") || k.includes("notes") || k.includes("feedback")) return "ℹ️";
    return "🔹";
  };

  // Build the details table
  let tableHtml = "";
  if (tableRows.length > 0) {
    tableHtml += `
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0 24px 0; border-collapse: separate; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">`;
    tableRows.forEach((row, index) => {
      const isLast = index === tableRows.length - 1;
      const borderStyle = isLast ? "" : "border-bottom: 1px solid #f1f5f9;";
      const icon = getIconForKey(row.key);
      const isWarningField = row.key.toLowerCase().includes("expiry") || row.key.toLowerCase().includes("remaining") || row.key.toLowerCase().includes("expired");
      const valColor = isWarningField ? "#dc2626" : "#1e293b";
      
      tableHtml += `
        <tr style="background: #ffffff;">
          <td width="42%" style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #475569; ${borderStyle}">
            <span style="margin-right: 6px; font-size: 13px; vertical-align: middle;">${icon}</span>${row.key}
          </td>
          <td width="3%" style="padding: 10px 0; font-size: 12px; font-weight: 700; color: #94a3b8; ${borderStyle} text-align: center;">:</td>
          <td width="55%" style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: ${valColor}; ${borderStyle}">${row.val}</td>
        </tr>`;
    });
    tableHtml += `</table>`;
  }

  // Set titles and custom banners
  let bannerIcon = "📅";
  let bannerText = "NOTIFICATION";
  let bannerBg = "#eff6ff";
  let bannerBorder = "#bfdbfe";
  let bannerColor = "#1e40af";
  let showCallout = false;

  if (templateType?.startsWith("Interview")) {
    bannerIcon = "📅";
    bannerText = "INTERVIEW INVITATION";
    bannerBg = "#eff6ff";
    bannerBorder = "#bfdbfe";
    bannerColor = "#1e40af";
  } else if (templateType === "Offer") {
    bannerIcon = "🎉";
    bannerText = "JOB OFFER LETTER";
    bannerBg = "#f0fdf4";
    bannerBorder = "#bbf7d0";
    bannerColor = "#166534";
  } else if (templateType === "Visa") {
    bannerIcon = "🔔";
    bannerText = "VISA EXPIRY ALERT";
    bannerBg = "#fef2f2";
    bannerBorder = "#fecaca";
    bannerColor = "#991b1b";
    showCallout = true;
  } else if (templateType === "Registration") {
    bannerIcon = "✔";
    bannerText = "REGISTRATION COMPLETED";
    bannerBg = "#f0fdf4";
    bannerBorder = "#bbf7d0";
    bannerColor = "#166534";
  } else if (templateType === "Birthday") {
    bannerIcon = "🎂";
    bannerText = "HAPPY BIRTHDAY WISHES";
    bannerBg = "#fff7ed";
    bannerBorder = "#fed7aa";
    bannerColor = "#c2410c";
  }

  // Break company name dynamically for customized logo badges
  const nameParts = company.toUpperCase().split(" ");
  const logoText = companyLogo || (
    nameParts.length > 1 
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}` 
      : company.slice(0, 2).toUpperCase()
  );

  const logoLine1 = nameParts.slice(0, 2).join(" ");
  const logoLine2 = nameParts.slice(2).join(" ") || "MANAGEMENT SYSTEM";

  const domainMatch = companyEmail.match(/@(.+)$/);
  const webContact = domainMatch && !companyEmail.includes("gmail") && !companyEmail.includes("outlook") && !companyEmail.includes("yahoo")
    ? `www.${domainMatch[1]}`
    : "www.msjobs.net";

  // Generate call to action button
  let ctaHtml = "";
  if (templateType === "Registration") {
    ctaHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 10px 0; text-align: center;">
        <tr>
          <td>
            <a href="http://localhost:3000/apply" target="_blank" style="display: inline-block; background: #166534; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; font-family: 'Segoe UI',sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(22,101,52,0.15);">Track Application Status</a>
          </td>
        </tr>
      </table>`;
  } else if (meetingLink) {
    ctaHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 10px 0; text-align: center;">
        <tr>
          <td>
            <a href="${meetingLink}" target="_blank" style="display: inline-block; background: #1e3a8a; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; font-family: 'Segoe UI',sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(30,58,138,0.15);">Join Online Interview</a>
          </td>
        </tr>
      </table>`;
  } else if (locationLink) {
    ctaHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 10px 0; text-align: center;">
        <tr>
          <td>
            <a href="${locationLink}" target="_blank" style="display: inline-block; background: #1e3a8a; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; font-family: 'Segoe UI',sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(30,58,138,0.15);">View Office Location Map</a>
          </td>
        </tr>
      </table>`;
  } else if (templateType === "Visa") {
    ctaHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 10px 0; text-align: center;">
        <tr>
          <td>
            <a href="mailto:${companyEmail}" target="_blank" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; font-family: 'Segoe UI',sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(220,38,38,0.15);">Contact HR Support</a>
          </td>
        </tr>
      </table>`;
  }

  // NOTE: We now use Handlebars template files for full HTML templates.
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06); padding: 32px;">
          
          <!-- Premium Header -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
                <tr>
                  <td width="55%" align="left" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="background:#1e3a8a; color:#ffffff; font-weight:900; font-size:24px; padding:8px 12px; border-radius:6px; display:inline-block; margin-right:12px; font-family:'Segoe UI',sans-serif; letter-spacing:1px;">${logoText}</div>
                        </td>
                        <td>
                          <div style="font-size:15px; font-weight:800; color:#1e293b; text-transform:uppercase; letter-spacing:-0.2px; line-height:1.2;">${logoLine1}</div>
                          <div style="font-size:13px; font-weight:700; color:#2563eb; text-transform:uppercase; line-height:1.2;">${logoLine2}</div>
                          <div style="font-size:9px; color:#64748b; font-style:italic; margin-top:2px;">Right People. Right Opportunity.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="45%" align="right" style="font-size:11px; color:#475569; line-height:1.5; border-left:1px solid #e2e8f0; padding-left:16px; vertical-align: middle; font-family:'Segoe UI',sans-serif;">
                    <div style="margin-bottom:2px;">✉ ${companyEmail}</div>
                    <div style="margin-bottom:2px;">📞 ${companyPhone}</div>
                    <div style="margin-bottom:2px;">🌐 ${webContact}</div>
                    <div>📍 ${companyAddress}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Banner Title -->
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <div style="display:inline-block; background:${bannerBg}; border: 1px solid ${bannerBorder}; border-radius: 50px; padding: 6px 18px;">
                <span style="font-size: 14px; vertical-align: middle; margin-right: 6px;">${bannerIcon}</span>
                <span style="font-size: 12px; font-weight: 800; color: ${bannerColor}; text-transform: uppercase; letter-spacing: 0.5px;">${bannerText}</span>
              </div>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="font-family:'Segoe UI',sans-serif; text-align: left;">
              ${introHtml}
              ${tableHtml}
              ${ctaHtml}
              ${alertHtml}
              
              <!-- Optional Callout Support Widget -->
              ${showCallout ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 14px 16px; margin: 16px 0;">
                <tr>
                  <td width="10%" style="vertical-align: middle; font-size: 24px;">🎧</td>
                  <td width="90%" style="font-family:'Segoe UI',sans-serif; font-size: 11px; color: #991b1b; line-height: 1.4; padding-left: 10px;">
                    <div style="font-weight: 800;">Need Help?</div>
                    <div style="font-weight: 500; margin-top: 2px;">Contact our support team for assistance.</div>
                    <div style="font-weight: 800; font-size: 12px; margin-top: 2px;">${companyPhone}</div>
                  </td>
                </tr>
              </table>` : ""}

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="60%" style="vertical-align: bottom;">
                    ${closingHtml}
                  </td>
                  <td width="40%" align="right" style="vertical-align: bottom;">
                    <div style="font-family:'Brush Script MT', cursive, sans-serif; font-size: 26px; color:#2563eb; font-style:italic;">Thank You!</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Premium Stay Connected Footer -->
          <tr>
            <td>
              <div style="border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;"></div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="40%" align="left" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="background:#1e3a8a; color:#ffffff; font-weight:900; font-size:18px; padding:5px 8px; border-radius:4px; display:inline-block; margin-right:8px;">${logoText}</div>
                        </td>
                        <td>
                          <div style="font-size:10px; font-weight:800; color:#1e293b; text-transform:uppercase;">${logoLine1}</div>
                          <div style="font-size:8px; font-weight:700; color:#2563eb; text-transform:uppercase;">${logoLine2}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="30%" align="center" style="font-size: 10px; font-weight: 700; color: #64748b; vertical-align: middle;">
                    <div>Stay Connected</div>
                    <div style="margin-top: 6px;">
                      <a href="https://facebook.com" style="text-decoration:none; margin: 0 4px; display:inline-block; background:#1e3a8a; color:#ffffff; padding:4px 8px; border-radius:4px; font-size:9px; font-weight:bold;">FB</a>
                      <a href="https://linkedin.com" style="text-decoration:none; margin: 0 4px; display:inline-block; background:#2563eb; color:#ffffff; padding:4px 8px; border-radius:4px; font-size:9px; font-weight:bold;">LN</a>
                      <a href="https://wa.me/${companyPhone.replace(/[^0-9]/g, '')}" style="text-decoration:none; margin: 0 4px; display:inline-block; background:#166534; color:#ffffff; padding:4px 8px; border-radius:4px; font-size:9px; font-weight:bold;">WA</a>
                    </div>
                  </td>
                  <td width="30%" align="right" style="font-size:10px; color:#64748b; line-height:1.4; border-left:1px solid #e2e8f0; padding-left:12px; vertical-align: middle;">
                    <div>${companyEmail}</div>
                    <div>${companyPhone}</div>
                    <div>${webContact}</div>
                  </td>
                </tr>
              </table>
              
              <!-- Light Gray Confidentiality Disclaimer -->
              <div style="background:#f8fafc; padding:12px; border-radius:8px; font-size:9px; color:#94a3b8; text-align:center; line-height:1.4; border: 1px solid #f1f5f9;">
                This email is confidential and intended solely for the use of the individual to whom it is addressed.<br/>
                If you have received this email in error, please notify us and delete it from your system.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return htmlBody;
}

// Helper: load template by name
function loadTemplate(templateName: string) {
  const templatesDir = path.join(process.cwd(), "lib", "email-templates");
  const templatePath = path.join(templatesDir, "templates", `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templateName}`);
  return fs.readFileSync(templatePath, "utf8");
}

// Register partials (header/footer/components)
function registerPartials() {
  try {
    const componentsDir = path.join(process.cwd(), "lib", "email-templates", "components");
    const files = fs.readdirSync(componentsDir);
    files.forEach(f => {
      const content = fs.readFileSync(path.join(componentsDir, f), "utf8");
      const name = path.basename(f, path.extname(f));
      Handlebars.registerPartial(name, content);
    });
    // Helpers
    Handlebars.registerHelper('year', () => new Date().getFullYear());
    Handlebars.registerHelper('companyPrimaryColor', (fallback: string) => fallback || '#2563eb');
  } catch (err) {
    // ignore
  }
}

/**
 * Sends a real-time email with beautiful HTML formatting.
 * Falls back to simulated DB log if SMTP credentials are missing.
 */
export async function sendEmail({
  to,
  subject,
  body,
  candidateName,
  company,
  branch,
  deliveryStatus,
  sentBy,
  type,
  templateType,
  templateData,
}: {
  to: string;
  subject: string;
  body: string;
  candidateName?: string;
  company?: string;
  branch?: string;
  deliveryStatus?: string;
  sentBy?: string;
  type?: string;
  templateType?: 
    | "Interview" | "Interview_Initial" | "Interview_Online" | "Interview_Physical" | "Interview_Cancelled" | "Interview_Completed"
    | "Offer" | "Visa" | "Registration" | "Placement" | "Leave" | "Payroll" | "Birthday";
  templateData?: any;
}) {
  const host = cleanEnvVar(process.env.SMTP_HOST);
  const port = Number(cleanEnvVar(process.env.SMTP_PORT)) || 587;
  const user = cleanEnvVar(process.env.SMTP_USER);
  const pass = cleanEnvVar(process.env.SMTP_PASS);
  const from = cleanEnvVar(process.env.SMTP_FROM) || `"MS Horizon Support" <support@mshorizon.ae>`;

  console.log(`[EMAIL-SERVICE] Triggering email to: ${to} | Subject: ${subject}`);

  let realEmailSent = false;
  let statusStr = deliveryStatus || "Pending";

  // Look up sender company details in DB to keep the template branded (no hardcoded example placeholders)
  let companyEmail = "hr@safayar-msjobs.com";
  let companyPhone = "+971 58 532 2913";
  let companyAddress = "Industrial Area 2, Ajman, UAE";
  let companyLogo = "";

  if (company && company !== "System" && company !== "Not Placed") {
    try {
      // 1. Try finding in Company model
      const dbComp = await prisma.company.findFirst({
        where: { name: company }
      });
      if (dbComp) {
        if (dbComp.email) companyEmail = dbComp.email;
        if (dbComp.telephone || dbComp.whatsapp) {
          companyPhone = dbComp.telephone || dbComp.whatsapp;
        }
        if (dbComp.address) companyAddress = dbComp.address;
        if (dbComp.logo) companyLogo = dbComp.logo;
      } else {
        // 2. Try finding in InternalCompany model
        const dbIntComp = await prisma.internalCompany.findFirst({
          where: { name: company }
        });
        if (dbIntComp) {
          if (dbIntComp.email) companyEmail = dbIntComp.email;
          if (dbIntComp.telephone) companyPhone = dbIntComp.telephone;
          if (dbIntComp.address) companyAddress = dbIntComp.address;
          if (dbIntComp.logo) companyLogo = dbIntComp.logo;
        }
      }
    } catch (err) {
      console.error("Error looking up company info inside sendEmail:", err);
    }
  }

  // Register partials/helpers once
  registerPartials();

  let htmlContent = "";
  let usedTemplateName: string | null = null;

  // message tracking variables (initialized for all code paths)
  let sentMessageId: string | null = null;
  let sendError: string | null = null;

  if (templateType && templateData) {
    try {
      // Map templateType to file names we created
      const map: Record<string, string> = {
        Interview: "interview-invitation",
        Interview_Initial: "interview-invitation",
        Interview_Online: "interview-invitation",
        Interview_Physical: "interview-invitation",
        Interview_Cancelled: "interview-cancelled",
        Interview_Completed: "interview-invitation",
        Offer: "offer-letter",
        Visa: "visa-expiry-reminder",
        Registration: "applicant-registration-confirmation",
        Placement: "placement-confirmation",
        Placement_Agreement: "placement-agreement",
        Password_Reset: "password-reset",
        Staff_Registration: "staff-registration",
        User_Account_Created: "user-account-created",
        Leave: "leave-application-submitted",
        Leave_Approved: "leave-approved",
        Leave_Rejected: "leave-rejected",
        Staff_Request_Submitted: "staff-request-submitted",
        Staff_Request_Approved: "staff-request-approved",
        Staff_Request_Rejected: "staff-request-rejected",
        Task_Assigned: "task-assigned",
        Task_Deadline_Reminder: "task-deadline-reminder",
        Payroll: "payroll-generated",
        Payslip: "payslip-available",
        Birthday: "birthday-wishes",
        System: "system-notification",
      };

      const fileName = map[templateType] || map[templateType as any];
      if (!fileName) throw new Error(`No template mapping for ${templateType}`);
      usedTemplateName = fileName;

      const tpl = loadTemplate(fileName);
      const compiled = Handlebars.compile(tpl);

      const recipientName = templateData.recipientName || candidateName || templateData.applicantName || "Recipient";
      const logoText = (company || "").toUpperCase().split(" ").slice(0,2).map(s=>s.charAt(0)).join("") || "MS";

      const context = {
        recipientName,
        companyName: company || "MS Management",
        companyEmail,
        companyPhone,
        companyAddress,
        logoText,
        website: `https://${(companyEmail.match(/@(.+)$/)||["","msjobs.net"])[1]}`,
        year: new Date().getFullYear(),
        companyPrimaryColor: process.env.PRIMARY_COLOR || '#2563eb',
        ...templateData,
      };

      htmlContent = compiled(context);
    } catch (tplErr) {
      console.error(`[EMAIL-SERVICE] Template render error for ${templateType}:`, tplErr);
      // fallback to generic
      htmlContent = buildHtmlEmail(subject, body, company, templateType, companyEmail, companyPhone, companyAddress, companyLogo);
    }
  } else {
    htmlContent = buildHtmlEmail(subject, body, company, templateType, companyEmail, companyPhone, companyAddress, companyLogo);
  }

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: body,
        html: htmlContent,
      });

      console.log(`[EMAIL-SERVICE] Email sent successfully to ${to}`);
      realEmailSent = true;
      statusStr = "Sent";
      // capture messageId
      sentMessageId = info && (info as any).messageId ? String((info as any).messageId) : null;
    } catch (err: any) {
      console.error(`[EMAIL-SERVICE] SMTP error sending to ${to}:`, err);
      statusStr = "Failed";
      sendError = err?.toString?.() || JSON.stringify(err);
    }
  } else {
    console.warn(`[EMAIL-SERVICE] SMTP credentials not configured. Logged to DB only.`);
    statusStr = "Simulated"; // Simulated success
  }

  // Always log to DB for tracking regardless of real send
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
        deliveryStatus: statusStr,
        templateName: usedTemplateName,
        messageId: typeof sentMessageId !== 'undefined' ? sentMessageId : null,
        errorLog: typeof sendError !== 'undefined' ? sendError : null,
        sentBy: sentBy || "System",
        type: type || "Email",
      },
    });
  } catch (dbErr) {
    console.error(`[EMAIL-SERVICE] Failed to save SentEmail log:`, dbErr);
  }

  return realEmailSent;
}

/**
 * Render a template preview without sending.
 */
export async function previewEmail({
  subject,
  body,
  company,
  templateType,
  templateData,
}: {
  subject?: string;
  body?: string;
  company?: string;
  templateType?: string;
  templateData?: any;
}) {
  // reuse partials
  registerPartials();

  if (templateType && templateData) {
    try {
      const map: Record<string, string> = {
        Interview: "interview-invitation",
        Interview_Initial: "interview-invitation",
        Interview_Online: "interview-invitation",
        Interview_Physical: "interview-invitation",
        Interview_Cancelled: "interview-cancelled",
        Offer: "offer-letter",
        Visa: "visa-expiry-reminder",
        Registration: "applicant-registration-confirmation",
        Placement: "placement-confirmation",
        Placement_Agreement: "placement-agreement",
        Password_Reset: "password-reset",
        Staff_Registration: "staff-registration",
        User_Account_Created: "user-account-created",
        Leave: "leave-application-submitted",
        Leave_Approved: "leave-approved",
        Leave_Rejected: "leave-rejected",
        Staff_Request_Submitted: "staff-request-submitted",
        Staff_Request_Approved: "staff-request-approved",
        Staff_Request_Rejected: "staff-request-rejected",
        Task_Assigned: "task-assigned",
        Task_Deadline_Reminder: "task-deadline-reminder",
        Payroll: "payroll-generated",
        Payslip: "payslip-available",
        Birthday: "birthday-wishes",
        System: "system-notification",
      };
      const fileName = map[templateType] || templateType;
      const tpl = loadTemplate(fileName);
      const compiled = Handlebars.compile(tpl);
      const context = {
        recipientName: templateData.recipientName || templateData.applicantName || "Recipient",
        companyName: company || templateData.company || "MS Management",
        companyEmail: templateData.companyEmail || "hr@example.com",
        companyPhone: templateData.companyPhone || "+971000000",
        companyAddress: templateData.companyAddress || "",
        logoText: (company || "MS").slice(0,2).toUpperCase(),
        website: `https://${(templateData.companyEmail||'msjobs.net').match(/@(.+)$/)?.[1]||'msjobs.net'}`,
        year: new Date().getFullYear(),
        companyPrimaryColor: process.env.PRIMARY_COLOR || '#2563eb',
        ...templateData,
      };
      return compiled(context);
    } catch (err) {
      return buildHtmlEmail(subject || "", body || "", company || "", undefined, undefined, undefined, undefined, "");
    }
  }

  return buildHtmlEmail(subject || "", body || "", company || "");
}

/**
 * Sends a WhatsApp message via Twilio.
 * Falls back to simulated DB log if credentials are missing or are placeholder values.
 */
export async function sendWhatsApp({
  to,
  message,
  candidateName,
  company,
  branch,
}: {
  to: string;
  message: string;
  candidateName?: string;
  company?: string;
  branch?: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  let formattedNumber = to.replace(/[^0-9+]/g, "");
  if (!formattedNumber.startsWith("+")) {
    formattedNumber = `+${formattedNumber}`;
  }

  console.log(`[WHATSAPP-SERVICE] Triggering WhatsApp to: ${formattedNumber}`);

  let realWaSent = false;

  // Only attempt real send if credentials are not placeholders
  const hasRealCreds =
    accountSid &&
    authToken &&
    !accountSid.startsWith("ACXXX") &&
    authToken !== "your-twilio-auth-token";

  if (hasRealCreds) {
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
        console.log(`[WHATSAPP-SERVICE] Sent successfully via Twilio to ${formattedNumber}`);
        realWaSent = true;
      } else {
        const errorData = await response.json();
        console.error(`[WHATSAPP-SERVICE] Twilio API error:`, errorData);
      }
    } catch (err) {
      console.error(`[WHATSAPP-SERVICE] Error sending via Twilio:`, err);
    }
  } else {
    console.warn(
      `[WHATSAPP-SERVICE] Twilio credentials not configured. Set real TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN in .env`
    );
  }

  // Always log to DB
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

/**
 * Generates the email subject and body strictly based on the template type.
 * Prevents multiple templates from being concatenated or triggered at the same time.
 */
export function generateEmailContent(
  templateType: "Interview" | "Interview_Initial" | "Interview_Online" | "Interview_Physical" | "Interview_Cancelled" | "Interview_Completed" | "Offer" | "Visa",
  data: {
    applicantName?: string;
    company?: string;
    branch?: string;
    date?: string;
    role?: string;
    link?: string;
    notes?: string;
    extraDetails?: string;
  }
): { subject: string; body: string } {
  const name = data.applicantName || "Candidate";
  const company = data.company || "Company";
  const branch = data.branch || "Branch";

  switch (templateType) {
    case "Interview":
    case "Interview_Initial":
      return {
        subject: `Initial Interview Invitation: ${data.role || "Discussion"} - ${name}`,
        body: `Dear ${name},

We are pleased to invite you for an Initial screening interview for the position of ${data.role || "the open role"} at ${company}.

Details:
- Position: ${data.role || "discussion"}
- Company: ${company}
- Branch: ${branch}
- Date & Time: ${data.date || "TBD"}

Notes: ${data.notes || "Please prepare to discuss your experience, qualifications, and expectations."}

We look forward to speaking with you.

Best regards,
${company} HR Team`,
      };
    case "Interview_Online":
      return {
        subject: `Online Interview Invitation: ${data.role || "Discussion"} - ${name}`,
        body: `Dear ${name},

We are pleased to invite you for an Online Virtual Interview for the position of ${data.role || "the open role"} at ${company}.

Online Interview Details:
- Meeting Platform & Link: ${data.link || "Will be shared shortly"}
- Date & Time: ${data.date || "TBD"}

Notes: ${data.notes || ""}

Virtual Meeting Tips:
- Ensure a stable internet connection and quiet space.
- Keep your camera enabled.
- Join the link 5 minutes prior to the schedule.

Best regards,
${company} HR Team`,
      };
    case "Interview_Physical":
      return {
        subject: `Office Interview Invitation: ${data.role || "Discussion"} - ${name}`,
        body: `Dear ${name},

We are pleased to invite you for an In-person/Physical Interview for the position of ${data.role || "the open role"} at ${company}.

Physical Office Details:
- Location / Address: ${data.link || "Our Main Office Address"}
- Branch Office: ${branch}
- Date & Time: ${data.date || "TBD"}

Notes: ${data.notes || ""}

Candidate Guidelines:
- Please carry a copy of your CV and valid ID.
- Register at the front desk upon arrival.
- Dress code is professional business attire.

Best regards,
${company} HR Team`,
      };
    case "Interview_Cancelled":
      return {
        subject: `Interview Cancelled: ${data.role || "Scheduled Interview"} - ${name}`,
        body: `Dear ${name},

We regret to inform you that your ${data.role || "scheduled interview"} at ${company} on ${data.date || "the scheduled date"} has been cancelled.

${data.notes ? `Reason: ${data.notes}` : "Please contact our HR department for further information."}

We apologize for any inconvenience caused. We may reach out to you to reschedule.

Best regards,
${company} HR Team`,
      };
    case "Interview_Completed":
      return {
        subject: `Interview Completed - Thank You: ${name}`,
        body: `Dear ${name},

Thank you for attending your interview${data.role ? ` for the position of ${data.role}` : ""} at ${company} on ${data.date || "the scheduled date"}.

We appreciate the time you invested and your interest in joining our team. Our HR team will review your profile and get back to you regarding the next steps.

${data.notes ? `Feedback Notes: ${data.notes}` : ""}

Best regards,
${company} HR Team`,
      };
    case "Offer":
      return {
        subject: `Job Offer: ${data.role || "Position"} at ${company}`,
        body: `Dear ${name},

We are thrilled to offer you the position of ${data.role || "the open role"} at ${company}.

Expected Joining Date: ${data.date || "To be discussed"}
Branch: ${branch}

Please review the attached terms and reply to this email to accept the offer.

Congratulations and welcome to the team!

Best regards,
${company} HR Team`,
      };
    case "Visa":
      return {
        subject: `URGENT: Visa Expiration Alert - ${name}`,
        body: `Dear ${name},

This is an automated alert regarding your visa status. Your visa is expiring soon on ${data.date || "the upcoming date"}.

Please coordinate with the HR department at ${branch} branch immediately to initiate the renewal process and avoid any penalties.

${data.extraDetails || ""}

Best regards,
${company} Notification System`,
      };
    case "Registration" as any:
      return {
        subject: `Registration Completed: Thank You for Joining Us! - ${name}`,
        body: `Dear ${name},
 
Thank you for registering your application with ${company}.
Your application has been successfully received. Our recruitment team will review your profile and contact you if your qualifications match any suitable vacancies.
 
Here are your registration details:
- Candidate Name: ${name}
- Position(s) Applied: ${data.role || "N/A"}
- Application Tracking Code: ${data.extraDetails || "N/A"}
 
Please keep your mobile number and email active for further updates. You can track your status anytime at http://localhost:3000/apply.
 
We look forward to helping you find the right opportunity.
 
Best regards,
${company} Team`,
      };
    default:
      throw new Error("Invalid templateType");
  }
}
