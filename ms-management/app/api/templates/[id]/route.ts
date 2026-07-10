import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(request: Request, { params }: any) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id }
    });

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("GET template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: any) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        templateName: data.templateName,
        subject: data.subject,
        body: data.body,
        headerDesign: data.headerDesign,
        bannerImage: data.bannerImage,
        icon: data.icon,
        footerContent: data.footerContent,
        brandColors: data.brandColors,
        type: data.type,
        isEnabled: data.isEnabled,
        updatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("PUT template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: any) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.emailTemplate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE template error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
