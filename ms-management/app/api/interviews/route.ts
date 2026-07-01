import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    // Interviews are for recruiters/managers, staff don't see them usually.
    // In this dashboard we return interviews based on tenancy filter
    const interviews = await prisma.interview.findMany({
      where: filter,
      orderBy: { dateTime: "asc" }
    });

    const mapped = interviews.map((i: any) => ({
      id: i.id,
      applicantId: i.applicantId || undefined,
      applicantName: i.applicantName,
      type: i.type,
      conductPerson: i.conductPersonName,
      personName: i.personName,
      mobile: i.mobileNumber,
      whatsapp: i.whatsAppNumber,
      email: i.emailId,
      nationality: i.nationality,
      meetingType: i.meetingType || undefined,
      position: i.interviewPosition || undefined,
      dateTime: i.dateTime,
      isOnline: i.onlinePhysical === "Online",
      mode: i.meetingMode,
      meetingLink: i.meetingLink,
      locationLink: i.googleMapLink,
      notes: i.notes || undefined,
      status: i.status,
      company: i.company,
      branch: i.branch
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("GET interviews error:", error);
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

    if (!data.personName || !data.dateTime || !data.type) {
      return NextResponse.json(
        { error: "Person name, type, and date/time are required" },
        { status: 400 }
      );
    }

    // Tenancy Check
    let company = data.company || user.company;
    let branch = data.branch || user.branch;

    if (user.role !== "Super Admin" && company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conductPersonName = data.conductPerson || data.conductPersonName || user.name;
    const emailId = data.email || data.emailId || "";
    const mobileNumber = data.mobile || data.mobileNumber || "";
    const whatsAppNumber = data.whatsapp || data.whatsAppNumber || "";
    const interviewPosition = data.position || data.interviewPosition || null;
    const onlinePhysical = data.isOnline !== undefined ? (data.isOnline ? "Online" : "Physical") : (data.onlinePhysical || "Online");
    const meetingMode = data.mode || data.meetingMode || "Zoom";
    const googleMapLink = data.locationLink || data.googleMapLink || null;

    const interview = await prisma.interview.create({
      data: {
        id: data.id || undefined,
        applicantId: data.applicantId || null,
        applicantName: data.applicantName || "",
        type: data.type,
        conductPersonName,
        personName: data.personName,
        mobileNumber,
        whatsAppNumber,
        emailId,
        nationality: data.nationality || "",
        meetingType: data.meetingType || null,
        interviewPosition,
        dateTime: data.dateTime,
        onlinePhysical,
        meetingMode,
        meetingLink: data.meetingLink || null,
        googleMapLink,
        notes: data.notes || null,
        status: data.status || "Scheduled",
        company,
        branch
      }
    });

    if (interview.applicantId) {
      const applicant = await prisma.applicant.findUnique({
        where: { id: interview.applicantId }
      });
      if (applicant) {
        let currentHistory: any[] = [];
        try {
          if (applicant.statusHistory) {
            currentHistory = typeof applicant.statusHistory === 'string'
              ? JSON.parse(applicant.statusHistory)
              : (applicant.statusHistory as any[]);
          }
        } catch (e) {
          console.error("Parse status history error:", e);
        }

        const newHistoryItem = {
          oldStatus: applicant.status,
          newStatus: "Interview Scheduled",
          changedBy: user.name,
          date: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reason: `Interview scheduled on ${interview.dateTime.replace("T", " ")} (${interview.type})`
        };

        await prisma.applicant.update({
          where: { id: interview.applicantId },
          data: {
            status: "Interview Scheduled",
            statusHistory: [newHistoryItem, ...currentHistory] as any
          }
        });
      }
    }

    const mappedResponse = {
      id: interview.id,
      applicantId: interview.applicantId || undefined,
      applicantName: interview.applicantName,
      type: interview.type,
      conductPerson: interview.conductPersonName,
      personName: interview.personName,
      mobile: interview.mobileNumber,
      whatsapp: interview.whatsAppNumber,
      email: interview.emailId,
      nationality: interview.nationality,
      meetingType: interview.meetingType || undefined,
      position: interview.interviewPosition || undefined,
      dateTime: interview.dateTime,
      isOnline: interview.onlinePhysical === "Online",
      mode: interview.meetingMode,
      meetingLink: interview.meetingLink,
      locationLink: interview.googleMapLink,
      notes: interview.notes || undefined,
      status: interview.status,
      company: interview.company,
      branch: interview.branch
    };

    // Trigger real-time notifications for the scheduled interview/meeting
    if (mappedResponse.email) {
      const isOnline = mappedResponse.isOnline;
      const locationInfo = isOnline 
        ? `Mode: ${mappedResponse.mode}\nMeeting Link: ${mappedResponse.meetingLink || "To be provided"}`
        : `Location: Physical Address / Google Maps: ${mappedResponse.locationLink || "To be provided"}`;

      const emailBody = `Dear ${mappedResponse.personName},

We have scheduled a ${mappedResponse.type} with you at MS Horizon F.Z.E.

Here are the details of your schedule:
- Position/Subject: ${mappedResponse.position || "Discussion"}
- Date & Time: ${mappedResponse.dateTime.replace("T", " ")}
- Type: ${mappedResponse.isOnline ? "Online" : "Physical"}
- ${locationInfo}
- Conducted By: ${mappedResponse.conductPerson}

${mappedResponse.notes ? `Additional Notes:\n${mappedResponse.notes}\n` : ""}
If you have any questions or need to reschedule, please contact us.

Best regards,
MS Horizon F.Z.E Recruitment Team`;

      sendEmail({
        to: mappedResponse.email,
        subject: `Schedule Confirmed: ${mappedResponse.type} on ${mappedResponse.dateTime.replace("T", " ")}`,
        body: emailBody,
        candidateName: mappedResponse.personName,
        company: company,
        branch: branch
      }).catch(err => console.error("Async interview email error:", err));
    }

    if (mappedResponse.whatsapp || mappedResponse.mobile) {
      const waNumber = mappedResponse.whatsapp || mappedResponse.mobile;
      const isOnline = mappedResponse.isOnline;
      const locationText = isOnline 
        ? `Online via ${mappedResponse.mode} (${mappedResponse.meetingLink || "Link to be provided"})`
        : `Physical (${mappedResponse.locationLink || "Location map to be provided"})`;

      const waMessage = `Dear ${mappedResponse.personName}, your ${mappedResponse.type} is scheduled on ${mappedResponse.dateTime.replace("T", " ")}. Type: ${mappedResponse.isOnline ? "Online" : "Physical"} - ${locationText}. Conducted by: ${mappedResponse.conductPerson}.`;

      sendWhatsApp({
        to: waNumber,
        message: waMessage,
        candidateName: mappedResponse.personName,
        company: company,
        branch: branch
      }).catch(err => console.error("Async interview WhatsApp error:", err));
    }

    return NextResponse.json(mappedResponse);
  } catch (error: any) {
    console.error("POST interview error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
