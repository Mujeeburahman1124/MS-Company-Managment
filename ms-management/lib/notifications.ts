import nodemailer from "nodemailer";
import prisma from "./prisma";


const cleanEnvVar = (val: string | undefined) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, "");
};

// ─── HTML Email Template ──────────────────────────────────────────────────────
function buildHtmlEmail(subject: string, body: string, company = "MS Horizon F.Z.E"): string {
  const htmlBody = body
    .split("\n\n")
    .map(para => {
      const lines = para
        .split("\n")
        .map(line => {
          if (line.startsWith("- ") || line.startsWith("• ")) {
            return `<li style="margin:4px 0;color:#374151;">${line.replace(/^[-•]\s*/, "")}</li>`;
          }
          if (line.trim() === "") return "";
          return `<span style="display:block;color:#374151;line-height:1.7;">${line}</span>`;
        })
        .join("");

      if (lines.includes("<li")) {
        return `<ul style="margin:8px 0 8px 20px;padding:0;">${lines}</ul>`;
      }
      return `<p style="margin:0 0 14px 0;">${lines}</p>`;
    })
    .join("");

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${company}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;font-weight:500;">HR Management System</div>
            </td>
          </tr>
          <!-- Subject Banner -->
          <tr>
            <td style="background:#eff6ff;padding:16px 40px;border-bottom:1px solid #dbeafe;">
              <div style="font-size:15px;font-weight:700;color:#1d4ed8;">${subject}</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;font-size:14px;color:#374151;line-height:1.7;">
              ${htmlBody}
            </td>
          </tr>
          <!-- Sharing Section -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
                Share or Forward this Update
              </div>
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(subject + '\n\n' + body)}" 
                 target="_blank" 
                 style="display:inline-block;background:#25d366;color:#ffffff;padding:8px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;margin:0 4px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                Share via WhatsApp
              </a>
              <a href="mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}" 
                 style="display:inline-block;background:#3b82f6;color:#ffffff;padding:8px 16px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;margin:0 4px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                Forward Email
              </a>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;background:#f9fafb;">
              <div style="font-size:12px;color:#9ca3af;line-height:1.6;">
                This is an automated notification from <strong>${company}</strong> HR System.<br/>
                Please do not reply directly to this email.<br/>
                &copy; ${year} ${company}. All Rights Reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
}) {
  const host = cleanEnvVar(process.env.SMTP_HOST);
  const port = Number(cleanEnvVar(process.env.SMTP_PORT)) || 587;
  const user = cleanEnvVar(process.env.SMTP_USER);
  const pass = cleanEnvVar(process.env.SMTP_PASS);
  const from = cleanEnvVar(process.env.SMTP_FROM) || `"MS Horizon Support" <support@mshorizon.ae>`;

  console.log(`[EMAIL-SERVICE] Triggering email to: ${to} | Subject: ${subject}`);

  let realEmailSent = false;
  let statusStr = deliveryStatus || "Pending";

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      const htmlContent = buildHtmlEmail(subject, body, company);

      await transporter.sendMail({
        from,
        to,
        subject,
        text: body,
        html: htmlContent,
      });

      console.log(`[EMAIL-SERVICE] Email sent successfully to ${to}`);
      realEmailSent = true;
      statusStr = "Sent";
    } catch (err) {
      console.error(`[EMAIL-SERVICE] SMTP error sending to ${to}:`, err);
      statusStr = "Failed";
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
  templateType: "Interview" | "Offer" | "Visa",
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
      return {
        subject: `Interview Invitation: ${data.role || "Discussion"} - ${name}`,
        body: `Dear ${name},\n\nWe are pleased to invite you for an interview for the position of ${data.role || "the open role"} at ${company}.\n\nDate & Time: ${data.date || "TBD"}\nLocation/Link: ${data.link || "N/A"}\n\nNotes: ${data.notes || "Please be available at the scheduled time."}\n\nWe look forward to speaking with you.\n\nBest regards,\n${company} HR Team`,
      };
    case "Offer":
      return {
        subject: `Job Offer: ${data.role || "Position"} at ${company}`,
        body: `Dear ${name},\n\nWe are thrilled to offer you the position of ${data.role || "the open role"} at ${company}.\n\nExpected Joining Date: ${data.date || "To be discussed"}\nBranch: ${branch}\n\nPlease review the attached terms and reply to this email to accept the offer.\n\nCongratulations and welcome to the team!\n\nBest regards,\n${company} HR Team`,
      };
    case "Visa":
      return {
        subject: `URGENT: Visa Expiration Alert - ${name}`,
        body: `Dear ${name},\n\nThis is an automated alert regarding your visa status. Your visa is expiring soon on ${data.date || "the upcoming date"}.\n\nPlease coordinate with the HR department at ${branch} branch immediately to initiate the renewal process and avoid any penalties.\n\n${data.extraDetails || ""}\n\nBest regards,\n${company} Notification System`,
      };
    default:
      throw new Error("Invalid templateType");
  }
}
