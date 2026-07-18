import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter, hasPermissionBackend, createAuditLog } from "@/lib/auth-helpers";
import { sendWhatsApp } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermissionBackend(user, "emails", "view"))) {
      await createAuditLog(user, "Status Changed", "emails", null, "Unauthorized attempt to view WhatsApp logs", request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    const whatsappLogs = await prisma.sentWhatsApp.findMany({
      where: filter,
      orderBy: { sentAt: "desc" }
    });

    return NextResponse.json(whatsappLogs);
  } catch (error: any) {
    console.error("GET whatsapp logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermissionBackend(user, "emails", "create"))) {
      await createAuditLog(user, "Status Changed", "emails", null, "Unauthorized attempt to send WhatsApp message", request.headers.get("x-forwarded-for"));
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    const data = await request.json();

    // ── Bulk send: array of recipients ──────────────────────────────────────
    if (Array.isArray(data.recipients)) {
      const results: Array<{ success: boolean; to: string; logged?: any; error?: string }> = [];
      for (const item of data.recipients) {
        if (!item.to || !item.message) continue;
        try {
          await sendWhatsApp({
            to: item.to,
            message: item.message,
            candidateName: item.candidateName || null,
            company: data.company || user.company,
            branch: data.branch || user.branch,
          });
          let formatted = item.to.replace(/[^0-9+]/g, "");
          if (!formatted.startsWith("+")) formatted = `+${formatted}`;
          const logged = await prisma.sentWhatsApp.findFirst({
            where: { to: formatted },
            orderBy: { sentAt: "desc" },
          });
          results.push({ success: true, to: item.to, logged });
        } catch (e: any) {
          results.push({ success: false, to: item.to, error: e.message });
        }
      }
      return NextResponse.json({ bulk: true, results });
    }

    // ── Single send ──────────────────────────────────────────────────────────
    if (!data.to || !data.message) {
      return NextResponse.json({ error: "to and message are required" }, { status: 400 });
    }

    await sendWhatsApp({
      to: data.to,
      message: data.message,
      candidateName: data.candidateName || null,
      company: data.company || user.company,
      branch: data.branch || user.branch,
    });

    let formattedNumber = data.to.replace(/[^0-9+]/g, "");
    if (!formattedNumber.startsWith("+")) formattedNumber = `+${formattedNumber}`;

    const logged = await prisma.sentWhatsApp.findFirst({
      where: { to: formattedNumber },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json(logged);
  } catch (error: any) {
    console.error("POST whatsapp error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

