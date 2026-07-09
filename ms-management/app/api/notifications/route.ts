import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {};

    if (user.role === "Super Admin") {
      whereClause = {};
    } else if (user.role === "Company Admin") {
      whereClause = {
        OR: [
          { company: user.company },
          { userId: user.id }
        ]
      };
    } else if (user.role === "Branch Admin" || user.role === "HR Manager" || user.role === "Recruiter") {
      whereClause = {
        OR: [
          { company: user.company, branch: user.branch },
          { userId: user.id }
        ]
      };
    } else {
      // Staff, Accountant, etc. should ONLY see notifications specifically addressed to them
      whereClause = {
        userId: user.id
      };
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("GET notifications error:", error);
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

    if (!data.title || !data.message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        id: data.id || undefined,
        title: data.title,
        message: data.message,
        type: data.type || "Info",
        read: data.read || false,
        createdAt: data.createdAt || new Date().toISOString(),
        userId: data.userId || user.id,
        company: data.company || user.company || null,
        link: data.link || null,
        branch: data.branch || null
      }
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error("POST notification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
