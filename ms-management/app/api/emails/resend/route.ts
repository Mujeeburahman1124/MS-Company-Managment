import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasRole } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user, ["Super Admin", "Admin", "HR", "Manager"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const record = await prisma.sentEmail.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // prevent accidental duplicates: optional check — allow resend
    await sendEmail({
      to: record.to,
      subject: record.subject,
      body: record.body,
      company: record.company || user.company,
      branch: record.branch || user.branch,
      sentBy: user.name,
      type: record.type || "Email",
      templateType: record.templateName ? undefined : undefined,
      templateData: null,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Resend failed" }, { status: 500 });
  }
}
