const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testMail() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"MS Horizon Support" <support@mshorizon.ae>`;

  console.log("SMTP Config:", { host, port, user, pass: pass ? "****" : "missing", from });

  if (!host || !user || !pass) {
    console.error("Missing SMTP credentials in .env!");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  try {
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from,
      to: user, // send to self
      subject: "SMTP Test Email",
      text: "This is a test email to verify SMTP configuration.",
      html: "<h1>SMTP Test</h1><p>This is a test email to verify SMTP configuration.</p>",
    });
    console.log("Email sent successfully!", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testMail();
