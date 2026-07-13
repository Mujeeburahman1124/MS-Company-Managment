import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("auth_token");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        { authenticated: false, error: "No active session found" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(tokenCookie.value);

    if (!payload || !payload.id) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Retrieve fresh user info from the database
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string }
    });

    if (!user || user.status !== "Active") {
      return NextResponse.json(
        { authenticated: false, error: "User is disabled or does not exist" },
        { status: 401 }
      );
    }

    // Fetch company info for logo
    let companyLogo = "/logo.png";
    let companyName = "MS Management";
    if (user.company && user.company !== "System") {
      const comp = await prisma.company.findFirst({ where: { name: user.company } });
      if (comp) {
        companyLogo = comp.logo || "/logo.png";
        companyName = comp.name;
      }
    } else if (user.company === "System") {
      const comp = await prisma.company.findFirst({ where: { name: "MS Horizon F.Z.E" } });
      if (comp) {
        companyLogo = comp.logo || "/logo.png";
        companyName = comp.name;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        branch: user.branch,
        status: user.status,
        photo: user.photo,
        theme: user.theme,
        permissions: user.permissions,
        companyLogo,
        companyName
      }
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
