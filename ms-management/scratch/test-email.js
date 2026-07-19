const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.error("Could not find .env file at:", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || "";
    // Remove quotes
    value = value.replace(/^["']|["']$/g, "").trim();
    env[key] = value;
  }
});

const host = env.SMTP_HOST;
const port = Number(env.SMTP_PORT) || 587;
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const from = env.SMTP_FROM || `"${user}" <${user}>`;

console.log("SMTP Config parsed:");
console.log("Host:", host);
console.log("Port:", port);
console.log("User:", user);
console.log("Pass Length:", pass ? pass.length : 0);
console.log("From:", from);

if (!host || !user || !pass) {
  console.error("Missing SMTP credentials in .env file.");
  process.exit(1);
}

async function run() {
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    console.log("Verifying connection to SMTP server...");
    await transporter.verify();
    console.log("SMTP Connection verified successfully!");

    console.log("Sending test email to mshorizonuae2026@gmail.com...");
    const info = await transporter.sendMail({
      from,
      to: "mshorizonuae2026@gmail.com",
      subject: "Test Email from MS Horizon Setup",
      text: "If you receive this, your SMTP email settings are working perfectly!",
      html: "<h3>Success!</h3><p>If you receive this, your SMTP email settings are working perfectly!</p>"
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (err) {
    console.error("SMTP Delivery Failed:");
    console.error(err);
  }
}

run();
