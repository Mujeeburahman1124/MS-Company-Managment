import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    const emails = await prisma.sentEmail.findMany({
      where: filter,
      orderBy: { sentAt: "desc" }
    });

    return NextResponse.json(emails);
  } catch (error: any) {
    console.error("GET emails error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.to || !data.subject || !data.body) {
      return NextResponse.json({ error: "To, subject, and body are required" }, { status: 400 });
    }

    // sendEmail handles both SMTP sending and Prisma SentEmail DB creation
    await sendEmail({
      to: data.to,
      subject: data.subject,
      body: data.body,
      candidateName: data.candidateName || null,
      company: data.company || user.company,
      branch: data.branch || user.branch
    });

    const logged = await prisma.sentEmail.findFirst({
      where: { to: data.to, subject: data.subject },
      orderBy: { sentAt: "desc" }
    });

    return NextResponse.json(logged);
  } catch (error: any) {
    console.error("POST email error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
