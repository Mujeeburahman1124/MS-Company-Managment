import nodemailer from "nodemailer";
import prisma from "./prisma";


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
    | "Offer" | "Visa" | "Registration" | "Placement" | "Leave" | "Payroll" | "Birthday"
): string {
  // Parse body key-value pairs
  let detailsTableHtml = "";
  const cleanedBodyRows: string[] = [];
  const lines = body.split("\n");
  const detailRows: Array<{ key: string; val: string; icon: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith("- ") || trimmed.startsWith("• ")) && trimmed.includes(":")) {
      const parts = trimmed.substring(2).split(":");
      const key = parts[0].trim();
      const val = parts.slice(1).join(":").trim();
      
      // Determine the icon for the key
      let icon = "📋";
      const kLower = key.toLowerCase();
      if (kLower.includes("position") || kLower.includes("role") || kLower.includes("job")) icon = "💼";
      else if (kLower.includes("company") || kLower.includes("client")) icon = "🏢";
      else if (kLower.includes("date") || kLower.includes("expiry")) icon = "📅";
      else if (kLower.includes("time")) icon = "🕒";
      else if (kLower.includes("location") || kLower.includes("address") || kLower.includes("venue")) icon = "📍";
      else if (kLower.includes("type") || kLower.includes("mode")) icon = "👥";
      else if (kLower.includes("person") || kLower.includes("contact person")) icon = "👤";
      else if (kLower.includes("number") || kLower.includes("phone") || kLower.includes("contact")) icon = "📞";
      else if (kLower.includes("passport")) icon = "🪪";
      else if (kLower.includes("visa")) icon = "🛂";
      else if (kLower.includes("days") || kLower.includes("remaining")) icon = "⚠️";
      else if (kLower.includes("instruction") || kLower.includes("remark") || kLower.includes("note")) icon = "ℹ️";

      detailRows.push({ key, val, icon });
    } else {
      cleanedBodyRows.push(line);
    }
  }

  if (detailRows.length > 0) {
    detailsTableHtml = `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:20px 0;background:#ffffff;border-collapse:collapse;box-shadow:0 1px 3px rgba(0,0,0,0.02);">`;
    detailRows.forEach((row, i) => {
      detailsTableHtml += `
        <tr style="border-bottom:1px solid #f3f4f6;${i === detailRows.length - 1 ? 'border-bottom:none;' : ''}">
          <td style="padding:12px 16px;width:24px;text-align:center;font-size:16px;vertical-align:middle;">${row.icon}</td>
          <td style="padding:12px 8px;font-family:sans-serif;font-size:13px;font-weight:700;color:#4b5563;width:160px;vertical-align:middle;">${row.key}</td>
          <td style="padding:12px 4px;font-family:sans-serif;font-size:13px;color:#9ca3af;width:10px;text-align:center;vertical-align:middle;">:</td>
          <td style="padding:12px 16px;font-family:sans-serif;font-size:13px;font-weight:700;color:#1f2937;vertical-align:middle;">${row.val}</td>
        </tr>`;
    });
    detailsTableHtml += `</table>`;
  }

  const htmlBody = cleanedBodyRows
    .join("\n")
    .split("\n\n")
    .map(para => {
      const pTrim = para.trim();
      if (pTrim === "") return "";
      
      // If it contains "Dear", make it bold or prominent
      if (pTrim.startsWith("Dear")) {
        return `<p style="margin:0 0 16px 0;font-family:sans-serif;font-size:15px;font-weight:700;color:#1f2937;">${pTrim}</p>`;
      }
      return `<p style="margin:0 0 14px 0;line-height:1.7;color:#374151;font-family:sans-serif;font-size:14px;">${pTrim.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");

  const dividerColor = templateType === "Visa" ? "#ef4444" : "#2563eb";

  // Template Type Headers
  let templateHeader = "";
  if (templateType?.startsWith("Interview")) {
    templateHeader = `
      <div style="text-align:center;margin:24px 0 16px 0;">
        <table cellpadding="0" cellspacing="0" style="display:inline-table;margin-bottom:10px;">
          <tr>
            <td style="background:#eff6ff;width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;color:#2563eb;font-size:20px;border:1px solid #dbeafe;">📅</td>
          </tr>
        </table>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:900;color:#1e3a8a;letter-spacing:1px;text-transform:uppercase;">INTERVIEW INVITATION</div>
      </div>
    `;
  } else if (templateType === "Visa") {
    templateHeader = `
      <div style="text-align:center;margin:24px 0 16px 0;">
        <table cellpadding="0" cellspacing="0" style="display:inline-table;margin-bottom:10px;">
          <tr>
            <td style="background:#fef2f2;width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;color:#ef4444;font-size:20px;border:1px solid #fee2e2;">🔔</td>
          </tr>
        </table>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:900;color:#991b1b;letter-spacing:1px;text-transform:uppercase;">VISA EXPIRY ALERT</div>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;color:#374151;margin-top:4px;">Action Required</div>
      </div>
    `;
  } else if (templateType === "Registration") {
    templateHeader = `
      <div style="text-align:center;margin:24px 0 16px 0;">
        <table cellpadding="0" cellspacing="0" style="display:inline-table;margin-bottom:10px;">
          <tr>
            <td style="background:#eff6ff;width:40px;height:40px;border-radius:10px;text-align:center;vertical-align:middle;color:#2563eb;font-size:20px;border:1px solid #dbeafe;">✓</td>
          </tr>
        </table>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:900;color:#1e3a8a;letter-spacing:1px;">Registration Completed Successfully!</div>
      </div>
    `;
  } else {
    templateHeader = `
      <div style="text-align:center;margin:24px 0 16px 0;">
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:900;color:#1e3a8a;letter-spacing:1px;text-transform:uppercase;">${subject}</div>
      </div>
    `;
  }

  // Notice Banners
  let noticeBanner = "";
  if (templateType === "Visa") {
    noticeBanner = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fee2e2;border-radius:12px;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;color:#991b1b;font-family:sans-serif;font-size:12px;font-weight:700;line-height:1.4;">
            <span style="font-size:16px;margin-right:8px;vertical-align:middle;">⚠️</span>
            <span style="vertical-align:middle;">Kindly ensure the visa is renewed before the expiry date to avoid overstay fines and legal issues.</span>
          </td>
        </tr>
      </table>
    `;
  } else if (templateType?.startsWith("Interview")) {
    noticeBanner = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;color:#1e40af;font-family:sans-serif;font-size:12px;font-weight:700;line-height:1.4;">
            <span style="font-size:16px;margin-right:8px;vertical-align:middle;">🔔</span>
            <span style="vertical-align:middle;">If you are unable to attend the interview on the above date and time, please inform us as soon as possible.</span>
          </td>
        </tr>
      </table>
    `;
  } else if (templateType === "Registration") {
    noticeBanner = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;margin:20px 0;">
        <tr>
          <td style="padding:14px 20px;color:#1e40af;font-family:sans-serif;font-size:12px;font-weight:700;line-height:1.4;">
            <span style="font-size:16px;margin-right:8px;vertical-align:middle;">🔔</span>
            <span style="vertical-align:middle;">Please keep your mobile number and email active for further updates. You can also log in to your account to check status.</span>
          </td>
        </tr>
      </table>
    `;
  }

  // Attachments HTML
  let attachmentsHtml = "";
  if (templateType?.startsWith("Interview")) {
    attachmentsHtml = `
      <div style="margin-top:24px;border-top:1px dashed #e5e7eb;padding-top:16px;">
        <div style="font-family:sans-serif;font-size:11px;font-weight:700;color:#4b5563;margin-bottom:10px;">Attachments:</div>
        <table cellpadding="0" cellspacing="0" style="display:inline-table;margin-right:10px;margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;background:#f9fafb;font-family:sans-serif;font-size:11px;">
              <span style="color:#ef4444;font-size:14px;margin-right:4px;">📄</span>
              <strong style="color:#374151;">Location Map.pdf</strong>
              <span style="color:#9ca3af;font-size:8px;margin-left:4px;">(245 KB)</span>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="display:inline-table;margin-right:10px;margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;background:#f9fafb;font-family:sans-serif;font-size:11px;">
              <span style="color:#ef4444;font-size:14px;margin-right:4px;">📄</span>
              <strong style="color:#374151;">Company Profile.pdf</strong>
              <span style="color:#9ca3af;font-size:8px;margin-left:4px;">(512 KB)</span>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" style="display:inline-table;margin-right:10px;margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;background:#f9fafb;font-family:sans-serif;font-size:11px;">
              <span style="color:#ef4444;font-size:14px;margin-right:4px;">📄</span>
              <strong style="color:#374151;">Job Description.pdf</strong>
              <span style="color:#9ca3af;font-size:8px;margin-left:4px;">(189 KB)</span>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

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
        <table width="100%" style="max-width:650px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e5e7eb;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Left side: logo -->
                  <td style="vertical-align:middle;text-align:left;">
                    <table cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle;margin-right:12px;">
                      <tr>
                        <td style="background:#111827;width:40px;height:40px;border-radius:8px;transform:rotate(45deg);text-align:center;vertical-align:middle;">
                          <div style="transform:rotate(-45deg);color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:950;line-height:40px;text-align:center;width:40px;height:40px;margin:0 auto;">MS</div>
                        </td>
                      </tr>
                    </table>
                    <div style="display:inline-block;vertical-align:middle;text-align:left;">
                      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:900;color:#111827;line-height:1.1;letter-spacing:-0.5px;">MS HUMAN RESOURCE</div>
                      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:900;color:#2563eb;line-height:1.1;">CONSULTANCIES</div>
                      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:9px;font-weight:600;color:#6b7280;margin-top:2px;">Right People. Right Opportunity.</div>
                    </div>
                  </td>
                  <!-- Right side: contact details -->
                  <td style="width:1px;background:#e5e7eb;height:50px;padding:0;vertical-align:middle;"></td>
                  <td style="padding-left:20px;vertical-align:middle;text-align:left;font-family:sans-serif;font-size:10px;color:#4b5563;line-height:1.4;width:190px;">
                    ✉ <a href="mailto:hr@safayar-msjobs.com" style="color:#4b5563;text-decoration:none;font-weight:600;">hr@safayar-msjobs.com</a><br/>
                    📞 <span style="font-weight:600;">+971 58 532 2913</span><br/>
                    🌐 <a href="https://www.msjobs.net" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:600;">www.msjobs.net</a><br/>
                    📍 <span style="font-weight:600;">Ajman, UAE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER LINE -->
          <tr>
            <td style="background:${dividerColor};height:3px;padding:0;font-size:0;line-height:0;"></td>
          </tr>

          <!-- TEMPLATE HEADER (Dynamic invitation/expiry text) -->
          <tr>
            <td style="padding:10px 32px 0 32px;">
              ${templateHeader}
            </td>
          </tr>

          <!-- BODY SECTION -->
          <tr>
            <td style="padding:20px 32px 32px 32px;">
              
              <!-- Greeting and Intro -->
              ${htmlBody}

              <!-- Details Table (Key-Value Grid) -->
              ${detailsTableHtml}

              <!-- Action Notification Banner -->
              ${noticeBanner}

              <!-- Signature block + Handdrawn Thank You -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="font-family:sans-serif;font-size:14px;color:#374151;line-height:1.7;vertical-align:middle;">
                    We look forward to working with you.<br/>
                    Best Regards,<br/>
                    <strong style="color:#1e3a8a;">MS Human Resource Consultancies Team</strong>
                  </td>
                  <td align="right" style="vertical-align:bottom;width:120px;">
                    <span style="font-family:'Georgia',serif;font-style:italic;font-size:24px;color:#2563eb;font-weight:bold;white-space:nowrap;letter-spacing:-0.5px;">Thank You!</span>
                  </td>
                </tr>
              </table>

              <!-- Document attachments indicator -->
              ${attachmentsHtml}

            </td>
          </tr>

          <!-- FOOTER DIVIDER -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>

          <!-- FOOTER INFO BLOCK -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Left side: logo replica -->
                  <td style="vertical-align:middle;text-align:left;width:45%;">
                    <table cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle;margin-right:8px;">
                      <tr>
                        <td style="background:#111827;width:30px;height:30px;border-radius:6px;transform:rotate(45deg);text-align:center;vertical-align:middle;">
                          <div style="transform:rotate(-45deg);color:#ffffff;font-family:sans-serif;font-size:12px;font-weight:900;line-height:30px;text-align:center;width:30px;height:30px;margin:0 auto;">MS</div>
                        </td>
                      </tr>
                    </table>
                    <div style="display:inline-block;vertical-align:middle;text-align:left;">
                      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;color:#111827;line-height:1.1;">MS HUMAN RESOURCE</div>
                      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:9px;font-weight:800;color:#2563eb;line-height:1.1;">CONSULTANCIES</div>
                    </div>
                  </td>
                  <!-- Middle: Stay Connected -->
                  <td style="vertical-align:middle;text-align:center;width:25%;">
                    <div style="font-family:sans-serif;font-size:10px;font-weight:700;color:#6b7280;margin-bottom:6px;">Stay Connected</div>
                    <table cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 2px;">
                      <tr>
                        <td style="background:#3b5998;width:20px;height:20px;border-radius:10px;text-align:center;vertical-align:middle;color:#ffffff;font-family:sans-serif;font-size:10px;font-weight:bold;">f</td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 2px;">
                      <tr>
                        <td style="background:#0077b5;width:20px;height:20px;border-radius:10px;text-align:center;vertical-align:middle;color:#ffffff;font-family:sans-serif;font-size:10px;font-weight:bold;">in</td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 2px;">
                      <tr>
                        <td style="background:#25d366;width:20px;height:20px;border-radius:10px;text-align:center;vertical-align:middle;color:#ffffff;font-family:sans-serif;font-size:10px;font-weight:bold;">w</td>
                      </tr>
                    </table>
                  </td>
                  <!-- Right: address and contacts -->
                  <td style="vertical-align:middle;text-align:right;font-family:sans-serif;font-size:9px;color:#4b5563;line-height:1.4;width:30%;">
                    ✉ <a href="mailto:hr@safayar-msjobs.com" style="color:#4b5563;text-decoration:none;">hr@safayar-msjobs.com</a><br/>
                    📞 +971 58 532 2913<br/>
                    🌐 www.msjobs.net<br/>
                    📍 Real Group Building, Ajman
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BOTTOM DISCLAIMER -->
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:12px;border-radius:0 0 16px 16px;text-align:center;">
                <tr>
                  <td style="font-family:sans-serif;font-size:9px;color:#9ca3af;line-height:1.4;">
                    This email is confidential and intended solely for the use of the individual to whom it is addressed.<br/>
                    If you have received this email in error, please notify us and delete it from your system.
                  </td>
                </tr>
              </table>
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

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      const htmlContent = buildHtmlEmail(subject, body, company, templateType);

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
    default:
      throw new Error("Invalid templateType");
  }
}
