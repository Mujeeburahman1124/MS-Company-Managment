import { NextResponse } from "next/server";
import { getSessionUser, hasRole } from "@/lib/auth-helpers";
import { previewEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user, ["Super Admin", "Admin", "HR", "Manager"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const html = await previewEmail({
      subject: data.subject,
      body: data.body,
      company: data.company || user.company,
      templateType: data.templateType,
      templateData: data.templateData,
    });

    return NextResponse.json({ html });
  } catch (err: any) {
    console.error("Preview email error:", err);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
