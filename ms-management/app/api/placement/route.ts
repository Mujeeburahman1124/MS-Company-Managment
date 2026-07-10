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

    const placements = await prisma.placement.findMany({
      where: filter,
      orderBy: { placementDate: "desc" }
    });

    return NextResponse.json(placements);
  } catch (error: any) {
    console.error("GET placements error:", error);
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

    if (!data.applicantId || !data.applicantName || !data.companyId || !data.companyName || !data.company || !data.branch) {
      return NextResponse.json(
        { error: "ApplicantId, applicantName, companyId, companyName, company and branch are required" },
        { status: 400 }
      );
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && data.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const placement = await prisma.placement.create({
      data: {
        id: data.id || undefined,
        applicantId: data.applicantId,
        applicantName: data.applicantName,
        companyId: data.companyId,
        companyName: data.companyName,
        position: data.position || "",
        salary: Number(data.salary) || 0,
        placementDate: data.placementDate || new Date().toISOString().slice(0, 10),
        status: data.status || "Placed",
        company: data.company,
        branch: data.branch,
        createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
        agreementStatus: data.agreementStatus || "Pending",
        applicantSign: data.applicantSign || "",
        companySign: data.companySign || "",
        termsAndConditions: data.termsAndConditions || "",
        agreementHistory: data.agreementHistory || [],
        passportNumber: data.passportNumber || "",
        mobileNumber: data.mobileNumber || "",
        registrationDate: data.registrationDate || "",
        placementDeadline: data.placementDeadline || "",
        registrationFee: data.registrationFee !== undefined ? Number(data.registrationFee) : 0,
        placementFee: data.placementFee !== undefined ? Number(data.placementFee) : 0,
        refundStatus: data.refundStatus || "Not Applicable",
        agreementAccepted: data.agreementAccepted !== undefined ? Boolean(data.agreementAccepted) : false,
        applicantSignDate: data.applicantSignDate ? new Date(data.applicantSignDate) : undefined,
        applicantSignIp: data.applicantSignIp || undefined,
        applicantSignDevice: data.applicantSignDevice || undefined,
        notes: data.notes || ""
      }
    });

    if (placement.status === "Placed") {
      const applicant = await prisma.applicant.findUnique({
        where: { id: placement.applicantId }
      });
      if (applicant) {
        let currentHistory: any[] = [];
        try {
          if (applicant.statusHistory) {
            currentHistory = typeof applicant.statusHistory === 'string'
              ? JSON.parse(applicant.statusHistory)
              : (applicant.statusHistory as any[]);
          }
        } catch (e) {}

        const newHistoryItem = {
          oldStatus: applicant.status,
          newStatus: "Placed",
          changedBy: user.name,
          date: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reason: `Placed with company: ${placement.companyName} on ${placement.placementDate}`
        };

        await prisma.applicant.update({
          where: { id: placement.applicantId },
          data: {
            status: "Placed",
            clientName: placement.companyName,
            statusHistory: [newHistoryItem, ...currentHistory] as any
          }
        });
      }
    }

    return NextResponse.json(placement);
  } catch (error: any) {
    console.error("POST placement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
