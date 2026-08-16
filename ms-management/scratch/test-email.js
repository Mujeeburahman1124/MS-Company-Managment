const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("Testing Hostinger SMTP connection...");
  const host = "smtp.hostinger.com";
  const port = 465;
  const user = "info@safayar-msjobs.com";
  const pass = "Safayar1992";

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    console.log("Verifying connection to SMTP server...");
    await transporter.verify();
    console.log("SMTP connection verified successfully!");

    // Send a test mail to the user's email or a dummy one
    console.log("Attempting to send a test email...");
    const info = await transporter.sendMail({
      from: `"MS Horizon Support" <${user}>`,
      to: "info@safayar-msjobs.com",
      subject: "SMTP Test Connection",
      text: "This is a test email to verify SMTP settings.",
      html: "<p>This is a test email to verify SMTP settings.</p>",
    });
    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (error) {
    console.error("SMTP Test failed!");
    console.error(error);
  }
}

testEmail();
