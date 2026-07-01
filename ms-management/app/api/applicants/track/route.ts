import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const cleanQuery = q.trim();

    // Query for applicant matching trackingCode, email, or passportNumber
    const applicant = await prisma.applicant.findFirst({
      where: {
        OR: [
          { trackingCode: cleanQuery },
          { trackingCode: cleanQuery.toUpperCase() },
          { trackingCode: cleanQuery.toLowerCase() },
          { email: cleanQuery },
          { email: cleanQuery.toLowerCase() },
          { email: cleanQuery.toUpperCase() },
          { passportNumber: cleanQuery },
          { passportNumber: cleanQuery.toUpperCase() },
          { passportNumber: cleanQuery.toLowerCase() }
        ]
      }
    });

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    // Fetch matching interviews
    const interviews = await prisma.interview.findMany({
      where: {
        OR: [
          { applicantId: applicant.id },
          { personName: { equals: applicant.fullName } }
        ]
      }
    });

    return NextResponse.json({ applicant, interviews });
  } catch (error: any) {
    console.error("GET tracking error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
