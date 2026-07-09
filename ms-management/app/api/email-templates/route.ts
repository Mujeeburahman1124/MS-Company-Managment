import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "Super Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { templateName: 'asc' }
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("GET email-templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "Super Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateName, subject, body: htmlBody, type, isEnabled } = body;

    const newTemplate = await prisma.emailTemplate.create({
      data: {
        templateName,
        subject: subject || templateName,
        body: htmlBody || "",
        type: type || null,
        isEnabled: isEnabled ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });

    return NextResponse.json(newTemplate);
  } catch (error: any) {
    console.error("POST email-templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
