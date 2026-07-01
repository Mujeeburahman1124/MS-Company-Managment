import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    const isAdmin = user.role === "Super Admin" || 
                    user.role === "Company Admin" || 
                    user.role === "Branch Admin" || 
                    user.role === "HR Manager" || 
                    user.role === "Admin" || 
                    user.role === "HR" ||
                    user.role === "Recruiter" ||
                    user.role === "Accountant";

    // Scoping check for Staff: Staff see only their own requests
    if (!isAdmin) {
      const staffMember = await prisma.staff.findFirst({
        where: { email: user.email }
      });
      filter["staffId"] = staffMember ? staffMember.id : "NOT_FOUND";
    }

    const requests = await prisma.staffRequest.findMany({
      where: filter,
      orderBy: { date: "desc" }
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("GET requests error:", error);
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

    if (!data.requestType || !data.description) {
      return NextResponse.json(
        { error: "Request type and description are required" },
        { status: 400 }
      );
    }

    const staffMember = await prisma.staff.findFirst({
      where: { email: user.email }
    });
    const staffId = staffMember ? staffMember.id : user.id;

    const newRequest = await prisma.staffRequest.create({
      data: {
        id: data.id || undefined,
        staffId: staffId,
        name: user.name,
        mobile: data.mobile || user.mobile || "",
        whatsapp: data.whatsapp || user.whatsapp || "",
        email: user.email,
        requestType: data.requestType,
        description: data.description,
        attachment: data.attachment || null,
        date: data.date || new Date().toISOString().slice(0, 10),
        signature: data.signature || null,
        status: "Pending", // Always starts as Pending
        reason: null,
        reply: null,
        company: user.company,
        branch: user.branch,
        history: [{ date: new Date().toISOString().replace("T", " ").slice(0, 19), action: "Created", user: user.name }]
      }
    });

    return NextResponse.json(newRequest);
  } catch (error: any) {
    console.error("POST request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
