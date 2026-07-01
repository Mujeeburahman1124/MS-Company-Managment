import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let roles;
    if (user.role === "Super Admin") {
      // Super Admin sees all system roles and all company custom roles
      roles = await prisma.role.findMany({
        orderBy: { name: "asc" }
      });
    } else {
      // Company admins and others see global system roles (company is null)
      // plus custom roles created specifically for their company
      roles = await prisma.role.findMany({
        where: {
          OR: [
            { company: null },
            { company: user.company }
          ]
        },
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error("GET roles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin and Company Admin can create custom roles
    if (user.role !== "Super Admin" && user.role !== "Company Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name || !data.permissions) {
      return NextResponse.json(
        { error: "Role name and permissions are required" },
        { status: 400 }
      );
    }

    const newRole = await prisma.role.create({
      data: {
        id: data.id || undefined,
        name: data.name,
        description: data.description || "",
        permissions: data.permissions,
        isCustom: data.isCustom !== undefined ? data.isCustom : true,
        company: user.role === "Super Admin" ? (data.company || null) : user.company
      }
    });

    return NextResponse.json(newRole);
  } catch (error: any) {
    console.error("POST role error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
