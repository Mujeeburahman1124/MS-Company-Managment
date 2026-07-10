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
        notes: data.notes || "",
        createdBy: data.createdBy,
        nationality: data.nationality,
        whatsappNumber: data.whatsappNumber,
        emailAddress: data.emailAddress,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        currentAddress: data.currentAddress,
        currentCountry: data.currentCountry,
        clientTradeLicense: data.clientTradeLicense,
        clientAddress: data.clientAddress,
        clientCountry: data.clientCountry,
        clientContactPerson: data.clientContactPerson,
        clientContactNumber: data.clientContactNumber,
        clientEmail: data.clientEmail,
        clientLogo: data.clientLogo,
        department: data.department,
        workLocation: data.workLocation,
        city: data.city,
        joiningDate: data.joiningDate,
        contractDuration: data.contractDuration,
        probationPeriod: data.probationPeriod,
        workingHours: data.workingHours,
        weeklyOff: data.weeklyOff,
        shiftDetails: data.shiftDetails,
        currency: data.currency,
        paymentFrequency: data.paymentFrequency,
        foodAllowance: data.foodAllowance,
        accommodation: data.accommodation,
        transportation: data.transportation,
        overtime: data.overtime,
        medicalInsurance: data.medicalInsurance,
        airTicket: data.airTicket,
        annualLeave: data.annualLeave,
        otherBenefits: data.otherBenefits,
        visaStatus: data.visaStatus,
        placementVisaType: data.placementVisaType,
        visaNumber: data.visaNumber,
        visaExpiryDate: data.visaExpiryDate,
        visaProcessingStage: data.visaProcessingStage,
        medicalStatus: data.medicalStatus,
        emiratesIdStatus: data.emiratesIdStatus,
        labourContractStatus: data.labourContractStatus,
        joiningStatus: data.joiningStatus,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        receiptNumber: data.receiptNumber,
        dueAmount: data.dueAmount !== undefined ? Number(data.dueAmount) : undefined,
        paidAmount: data.paidAmount !== undefined ? Number(data.paidAmount) : undefined

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
