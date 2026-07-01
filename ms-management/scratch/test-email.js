const nodemailer = require("nodemailer");

async function main() {
  const host = "smtp.gmail.com";
  const port = 465;
  const user = "aqeelamrahman@gmail.com";
  const pass = "nljyesrdrzumcunb";
  const from = "MS Horizon Support <aqeelamrahman@gmail.com>";

  console.log("Creating transporter...");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  console.log("Sending mail...");
  try {
    const info = await transporter.sendMail({
      from,
      to: "aqeelamrahman@gmail.com",
      subject: "Test Email from MS Horizon Support",
      text: "This is a test email.",
    });
    console.log("Email sent successfully:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

main();
