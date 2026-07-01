import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth-helpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Query existing user to verify tenancy
    const existing = await prisma.user.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Tenancy/Role check:
    // 1. Super Admin can edit anyone.
    // 2. Company Admin can edit users in their own company.
    // 3. User can edit their own profile.
    const isSelf = currentUser.id === id;
    const isCompanyAdminOfSameCompany = currentUser.role === "Company Admin" && currentUser.company === existing.company;
    
    if (currentUser.role !== "Super Admin" && !isCompanyAdminOfSameCompany && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedCompany = data.company !== undefined ? data.company : existing.company;
    const updatedBranch = data.branch !== undefined ? data.branch : existing.branch;

    if (updatedCompany === "") {
      return NextResponse.json({ error: "Company cannot be empty" }, { status: 400 });
    }

    // Check if company has branches
    const companyBranches = await prisma.branch.findMany({
      where: { company: updatedCompany }
    });
    if (companyBranches.length > 0 && (!updatedBranch || updatedBranch === "")) {
      return NextResponse.json(
        { error: "Branch is required because the company has branches" },
        { status: 400 }
      );
    }

    // Build update payload
    const updateData: any = {
      name: data.name !== undefined ? data.name : undefined,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : undefined,
      mobile: data.mobile !== undefined ? data.mobile : undefined,
      whatsapp: data.whatsapp !== undefined ? data.whatsapp : undefined,
      role: data.role !== undefined ? data.role : undefined,
      company: data.company !== undefined ? data.company : undefined,
      branch: data.branch !== undefined ? data.branch : undefined,
      status: data.status !== undefined ? data.status : undefined,
      photo: data.photo !== undefined ? data.photo : undefined,
      permissions: data.permissions !== undefined ? data.permissions : undefined
    };

    // Hash new password if provided
    if (data.password && data.password.trim() !== "") {
      updateData.password = bcrypt.hashSync(data.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData
    });

    const { password, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error("PUT user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.user.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Tenancy/Role check: Company Admin can delete users of their own company, Super Admin can delete anyone
    const isCompanyAdminOfSameCompany = currentUser.role === "Company Admin" && currentUser.company === existing.company;
    
    if (currentUser.role !== "Super Admin" && !isCompanyAdminOfSameCompany) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent deleting oneself
    if (currentUser.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error: any) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
