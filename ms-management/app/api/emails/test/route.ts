import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const cleanEnvVar = (val: string | undefined) => {
  if (!val) return val;
  return val.trim().replace(/^["']|["']$/g, "").trim();
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") || "mshorizonuae2026@gmail.com";

  const rawHost = process.env.SMTP_HOST;
  const rawPort = process.env.SMTP_PORT;
  const rawUser = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;

  const host = cleanEnvVar(rawHost);
  const port = Number(cleanEnvVar(rawPort)) || 587;
  const user = cleanEnvVar(rawUser);
  const pass = cleanEnvVar(rawPass);

  const maskPass = (p: string | undefined) => {
    if (!p) return "UNDEFINED";
    if (p.length <= 4) return "****";
    return p.substring(0, 2) + "*".repeat(p.length - 4) + p.substring(p.length - 2);
  };

  const diagnostics = {
    raw: {
      SMTP_HOST: rawHost || "NOT SET",
      SMTP_PORT: rawPort || "NOT SET",
      SMTP_USER: rawUser || "NOT SET",
      SMTP_PASS: maskPass(rawPass),
    },
    cleaned: {
      host: host || "NOT SET",
      port: port,
      user: user || "NOT SET",
      pass: maskPass(pass),
    }
  };

  if (!host || !user || !pass) {
    return NextResponse.json({
      success: false,
      message: "SMTP configuration is incomplete.",
      diagnostics
    });
  }

  try {
    const transporter = host === "smtp.gmail.com"
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });

    // Test connection
    await transporter.verify();

    // Send test email
    const info = await transporter.sendMail({
      from: `"MS Horizon Diagnostics" <${user}>`,
      to,
      subject: "MS Horizon SMTP Diagnostic Test",
      text: `SMTP Diagnostic test was successful!\n\nDiagnostics Information:\nHost: ${host}\nPort: ${port}\nUser: ${user}`,
      html: `<h3>SMTP Diagnostic Success</h3><p>SMTP connection verified and test email sent successfully to <b>${to}</b>.</p><pre>${JSON.stringify(diagnostics.cleaned, null, 2)}</pre>`
    });

    return NextResponse.json({
      success: true,
      message: `Diagnostic connection verified and email sent successfully to ${to}.`,
      diagnostics,
      info
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: "SMTP Diagnostic failed.",
      diagnostics,
      error: {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
        responseCode: err.responseCode,
        stack: err.stack
      }
    });
  }
}
