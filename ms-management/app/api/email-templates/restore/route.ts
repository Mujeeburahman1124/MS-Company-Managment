import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "Super Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateName } = await request.json();
    if (!templateName) {
      return NextResponse.json({ error: "templateName is required" }, { status: 400 });
    }

    const templatesDir = path.join(process.cwd(), "templates");
    let templatePath = path.join(templatesDir, `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(templatesDir, "system-notification.html");
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: "Template file not found in fallback." }, { status: 404 });
      }
    }

    const htmlContent = fs.readFileSync(templatePath, "utf8");

    // Attempt to extract subject from <title> if present
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    const subject = titleMatch && titleMatch[1] ? titleMatch[1] : `${templateName.replace(/-/g, " ").toUpperCase()} Notification`;

    const updatedTemplate = await prisma.emailTemplate.upsert({
      where: { templateName },
      update: {
        body: htmlContent,
        subject,
        updatedAt: new Date().toISOString()
      },
      create: {
        templateName,
        subject,
        body: htmlContent,
        type: templateName,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });

    return NextResponse.json({ success: true, template: updatedTemplate });
  } catch (error: any) {
    console.error("POST email-templates/restore error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
