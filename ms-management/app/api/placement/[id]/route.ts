import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.placement.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.placement.update({
      where: { id },
      data: {
        applicantId: data.applicantId ?? undefined,
        applicantName: data.applicantName ?? undefined,
        companyId: data.companyId ?? undefined,
        companyName: data.companyName ?? undefined,
        position: data.position ?? undefined,
        salary: data.salary !== undefined ? Number(data.salary) : undefined,
        placementDate: data.placementDate ?? undefined,
        status: data.status ?? undefined,
        company: data.company ?? undefined,
        branch: data.branch ?? undefined,
        agreementStatus: data.agreementStatus ?? undefined,
        applicantSign: data.applicantSign ?? undefined,
        companySign: data.companySign ?? undefined,
        applicantSignDate: data.applicantSignDate ? new Date(data.applicantSignDate) : undefined,
        applicantSignIp: data.applicantSignIp ?? undefined,
        applicantSignDevice: data.applicantSignDevice ?? undefined,
        termsAndConditions: data.termsAndConditions ?? undefined,
        agreementHistory: data.agreementHistory ?? undefined,
        passportNumber: data.passportNumber ?? undefined,
        mobileNumber: data.mobileNumber ?? undefined,
        registrationDate: data.registrationDate ?? undefined,
        placementDeadline: data.placementDeadline ?? undefined,
        registrationFee: data.registrationFee !== undefined ? Number(data.registrationFee) : undefined,
        placementFee: data.placementFee !== undefined ? Number(data.placementFee) : undefined,
        refundStatus: data.refundStatus ?? undefined,
        agreementAccepted: data.agreementAccepted !== undefined ? Boolean(data.agreementAccepted) : undefined,
        notes: data.notes ?? undefined
      }
    });

    if (updated.status === "Placed" && existing.status !== "Placed") {
      const applicant = await prisma.applicant.findUnique({
        where: { id: updated.applicantId }
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
          reason: `Placed with company: ${updated.companyName} on ${updated.placementDate}`
        };

        await prisma.applicant.update({
          where: { id: updated.applicantId },
          data: {
            status: "Placed",
            clientName: updated.companyName,
            statusHistory: [newHistoryItem, ...currentHistory] as any
          }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT placement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.placement.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.placement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Placement deleted" });
  } catch (error: any) {
    console.error("DELETE placement error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
