"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Notification, SentEmail, SentWhatsApp } from "@/lib/types";

// Helper to calculate days left
const getDaysLeft = (dateStr: string) => {
  if (!dateStr) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  const diff = exp.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Helper to check if today is birthday
const isBirthdayToday = (dobStr: string) => {
  if (!dobStr) return false;
  const today = new Date();
  const dob = new Date(dobStr);
  return today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth();
};

export default function ReminderEngine() {
  const isStoreLoaded = useAuthStore((s) => s.isStoreLoaded);
  const applicants = useAuthStore((s) => s.applicants);
  const staff = useAuthStore((s) => s.staff);
  const tasks = useAuthStore((s) => s.tasks);
  const leaveRequests = useAuthStore((s) => s.leaveRequests);
  const staffRequests = useAuthStore((s) => s.staffRequests);
  const vehicles = useAuthStore((s) => s.vehicles);
  const payroll = useAuthStore((s) => s.payroll);
  const interviews = useAuthStore((s) => s.interviews);
  const overtimeRequests = useAuthStore((s) => s.overtimeRequests);
  const attendanceCorrections = useAuthStore((s) => s.attendanceCorrections);

  const isScanningRef = useRef(false);
  const isFirstScanDoneRef = useRef(false);

  useEffect(() => {
    if (!isStoreLoaded) return;
    // Prevent concurrent overlaps
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    const state = useAuthStore.getState();
    const {
      currentUser,
      notifications,
      sentEmails,
      sentWhatsApp,
      whatsappEnabled,
      addNotification,
      addSentEmail,
      addSentWhatsApp,
      addActivityLog,
    } = state;

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const currentYear = new Date().getFullYear().toString();

    // Helper to add dashboard notification if not existing
    const triggerDashboardNotification = (
      id: string,
      type: "visa_expiry" | "passport_expiry" | "birthday" | "task" | "leave" | "request" | "vehicle_expiry" | "payment",
      title: string,
      message: string,
      link: string,
      company?: string
    ) => {
      const userUniqueId = `${id}-${currentUser.id}`;
      const exists = notifications.some((n) => n.id === userUniqueId);
      if (!exists) {
        const notif: Notification = {
          id: userUniqueId,
          type,
          title,
          message,
          time: new Date().toISOString().replace("T", " ").slice(0, 16),
          read: false,
          link,
          company,
        };
        addNotification(notif);
        if (isFirstScanDoneRef.current) {
          toast.info(`${title}: ${message}`, {
            duration: 5000,
          });
        }
      }
    };

    // Helper to send automated email alert
    const triggerAutomatedEmail = (
      id: string,
      to: string,
      subject: string,
      body: string,
      company: string,
      branch: string,
      candidateName: string
    ) => {
      const exists = sentEmails.some((e) => e.id === id);
      if (!exists) {
        const email: SentEmail = {
          id,
          to,
          subject,
          body,
          sentAt: new Date().toISOString().replace("T", " ").slice(0, 16),
          company,
          branch,
          candidateName,
        };
        addSentEmail(email);

        // Log in Activity Logs
        addActivityLog({
          id: `LOG-${id}-email`,
          dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
          userName: "System Scheduler",
          role: "System",
          company,
          branch,
          action: "Email Sent",
          module: "Notifications",
          oldValue: null,
          newValue: `Automated alert email sent to: ${to} (Subject: ${subject})`,
          ipAddress: "127.0.0.1",
        });

        toast.success(`Automated email alert sent to ${candidateName} (${to})`);
      }
    };

    // Helper to send automated WhatsApp alert
    const triggerAutomatedWhatsApp = (
      id: string,
      to: string,
      message: string,
      company: string,
      branch: string,
      candidateName: string
    ) => {
      if (!whatsappEnabled) return;
      const exists = sentWhatsApp.some((w) => w.id === id);
      if (!exists) {
        const wa: SentWhatsApp = {
          id,
          to,
          message,
          sentAt: new Date().toISOString().replace("T", " ").slice(0, 16),
          company,
          branch,
          candidateName,
        };
        addSentWhatsApp(wa);

        // Log in Activity Logs
        addActivityLog({
          id: `LOG-${id}-whatsapp`,
          dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
          userName: "System Scheduler",
          role: "System",
          company,
          branch,
          action: "Status Changed",
          module: "Notifications",
          oldValue: null,
          newValue: `Automated WhatsApp alert sent to: ${to} (Message: ${message.slice(0, 40)}...)`,
          ipAddress: "127.0.0.1",
        });

        toast.success(`Automated WhatsApp API alert sent to ${to}`);
      }
    };

    // ─── 1. VISA EXPIRIES ───
    // Applicants Expiry
    applicants.forEach((app) => {
      if (app.visaExpiry) {
        const days = getDaysLeft(app.visaExpiry);
        if (days <= 30) {
          triggerDashboardNotification(
            `NOT-visa-app-${app.id}-${app.visaExpiry}`,
            "visa_expiry",
            "Visa Expiring Soon (Applicant)",
            `${app.fullName}'s visa expires in ${days} days (Date: ${app.visaExpiry}).`,
            `/applicants/${app.id}`,
            app.company
          );
        }
        if (days <= 20) {
          const emailId = `EMAIL-visa-app-${app.id}-${app.visaExpiry}`;
          const companyEmail = `hr@${(app.company || "company").toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
          const branchEmail = `${(app.branch || "main").toLowerCase().replace(/[^a-z0-9]/g, "")}@${(app.company || "company").toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
          const toAddress = `${app.email}, ${companyEmail}, ${branchEmail}`;

          const emailBody = `Dear ${app.fullName},\n\n` +
            `This is an automated alert that your visa is expiring in ${days} days (Date: ${app.visaExpiry}). Please coordinate with the branch (${app.branch}) immediately to initiate the renewal process.\n\n` +
            `Dear Branch Admin (${app.branch}) & Company HR (${app.company}),\n` +
            `Kindly note that Applicant ${app.fullName} (ID: ${app.id}) has a visa expiry in 20 days or less. Renewal processing is required.\n\n` +
            `Best regards,\nMS Manager Notification System`;

          triggerAutomatedEmail(
            emailId,
            toAddress,
            `URGENT: Visa Expiration Alert - 20 Days Left (Applicant: ${app.fullName})`,
            emailBody,
            app.company,
            app.branch,
            app.fullName
          );

          triggerAutomatedWhatsApp(
            `WA-visa-app-${app.id}-${app.visaExpiry}`,
            app.mobile,
            `Dear ${app.fullName}, your visa expires in ${days} days (${app.visaExpiry}). Please contact ${app.branch} branch to initiate renewal. - MS Manager API`,
            app.company,
            app.branch,
            app.fullName
          );
        }
      }
    });

    // Staff Expiry
    staff.forEach((s) => {
      if (s.visaExpiry) {
        const days = getDaysLeft(s.visaExpiry);
        if (days <= 30) {
          triggerDashboardNotification(
            `NOT-visa-stf-${s.id}-${s.visaExpiry}`,
            "visa_expiry",
            "Visa Expiring Soon (Staff)",
            `${s.name}'s visa expires in ${days} days (Date: ${s.visaExpiry}).`,
            `/staff/${s.id}`,
            s.company
          );
        }
        if (days <= 20) {
          const emailId = `EMAIL-visa-stf-${s.id}-${s.visaExpiry}`;
          const companyEmail = `hr@${(s.company || "company").toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
          const branchEmail = `${(s.branch || "main").toLowerCase().replace(/[^a-z0-9]/g, "")}@${(s.company || "company").toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
          const toAddress = `${s.email}, ${companyEmail}, ${branchEmail}`;

          const emailBody = `Dear ${s.name},\n\n` +
            `This is an automated alert that your employee visa is expiring in ${days} days (Date: ${s.visaExpiry}). Please coordinate with the branch office (${s.branch}) immediately to complete renewal formalities.\n\n` +
            `Dear Branch Admin (${s.branch}) & Company HR (${s.company}),\n` +
            `Kindly note that employee ${s.name} (ID: ${s.id}) has a visa expiry in 20 days or less. Renewal processing is required immediately to prevent immigration penalties.\n\n` +
            `Best regards,\nMS Manager Notification System`;

          triggerAutomatedEmail(
            emailId,
            toAddress,
            `URGENT: Visa Expiration Alert - 20 Days Left (Staff: ${s.name})`,
            emailBody,
            s.company,
            s.branch,
            s.name
          );

          triggerAutomatedWhatsApp(
            `WA-visa-stf-${s.id}-${s.visaExpiry}`,
            s.mobile,
            `Dear ${s.name}, your employee visa expires in ${days} days (${s.visaExpiry}). Please coordinate with ${s.branch} branch to initiate renewal. - MS Manager API`,
            s.company,
            s.branch,
            s.name
          );
        }
      }
    });

    // ─── 2. PASSPORT EXPIRIES ───
    applicants.forEach((app) => {
      if (app.passportExpiry) {
        const days = getDaysLeft(app.passportExpiry);
        if (days <= 30) {
          triggerDashboardNotification(
            `NOT-passport-app-${app.id}-${app.passportExpiry}`,
            "passport_expiry",
            "Passport Expiring Soon (Applicant)",
            `${app.fullName}'s passport expires in ${days} days (Date: ${app.passportExpiry}).`,
            `/applicants/${app.id}`,
            app.company
          );
        }
      }
    });

    staff.forEach((s) => {
      if (s.passportExpiry) {
        const days = getDaysLeft(s.passportExpiry);
        if (days <= 30) {
          triggerDashboardNotification(
            `NOT-passport-stf-${s.id}-${s.passportExpiry}`,
            "passport_expiry",
            "Passport Expiring Soon (Staff)",
            `${s.name}'s passport expires in ${days} days (Date: ${s.passportExpiry}).`,
            `/staff/${s.id}`,
            s.company
          );
        }
      }
    });

    // ─── 3. BIRTHDAYS ───
    staff.forEach((s) => {
      if (s.birthday && isBirthdayToday(s.birthday)) {
        triggerDashboardNotification(
          `NOT-birthday-stf-${s.id}-${currentYear}`,
          "birthday",
          "Birthday Today! 🎉",
          `Today is ${s.name}'s birthday! Send them wishes.`,
          `/staff/${s.id}`,
          s.company
        );
      }
    });

    // ─── 4. INTERVIEWS / MEETINGS ───
    interviews.forEach((int) => {
      if (int.dateTime && int.dateTime.slice(0, 10) === todayDateStr) {
        triggerDashboardNotification(
          `NOT-interview-${int.id}`,
          "task", // General task/event notification type
          `Upcoming ${int.type} Today`,
          `Scheduled ${int.type} with ${int.personName} at ${int.dateTime.slice(11)}. Mode: ${int.mode}.`,
          `/interviews`,
          int.company
        );
      }
    });

    // ─── 5. TASK DEADLINES ───
    tasks.forEach((t) => {
      if (t.deadline && t.status !== "Completed") {
        const days = getDaysLeft(t.deadline);
        if (days < 0) {
          triggerDashboardNotification(
            `NOT-task-overdue-${t.id}-${t.deadline}`,
            "task",
            "Task Overdue ⚠️",
            `Task '${t.title}' is past its deadline (Due: ${t.deadline}).`,
            `/tasks`,
            t.company
          );
        } else if (days <= 1) {
          triggerDashboardNotification(
            `NOT-task-due-${t.id}-${t.deadline}`,
            "task",
            "Task Due Tomorrow",
            `Task '${t.title}' is due in ${days} day(s).`,
            `/tasks`,
            t.company
          );
        }
      }
    });

    // ─── 6. LEAVE REQUEST STATUS ───
    leaveRequests.forEach((l) => {
      if (l.status !== "Pending") {
        triggerDashboardNotification(
          `NOT-leave-${l.id}-${l.status}`,
          "leave",
          `Leave Request ${l.status}`,
          `Leave request for ${l.staffName} (${l.leaveType}) was ${l.status.toLowerCase()}.`,
          `/leave`,
          l.company
        );
      }
    });

    // ─── 7. REQUEST STATUS ───
    staffRequests.forEach((r) => {
      if (r.status !== "Pending") {
        triggerDashboardNotification(
          `NOT-request-${r.id}-${r.status}`,
          "request",
          `Staff Request ${r.status}`,
          `Request for ${r.requestType} from ${r.staffName} was ${r.status.toLowerCase()}.`,
          `/requests`,
          r.company
        );
      }
    });

    // ─── 8. VEHICLE EXPIRIES ───
    vehicles.forEach((v) => {
      if (v.insuranceExpiry) {
        const days = getDaysLeft(v.insuranceExpiry);
        if (days <= 30) {
          triggerDashboardNotification(
            `NOT-vehicle-ins-${v.id}-${v.insuranceExpiry}`,
            "vehicle_expiry",
            "Vehicle Insurance Expiring",
            `Vehicle ${v.brand} (${v.plateNumber}) insurance expires in ${days} days.`,
            `/vehicles`,
            v.company
          );
        }
      }
      if (v.registrationExpiry) {
        const days = getDaysLeft(v.registrationExpiry);
        if (days <= 30) {
          triggerDashboardNotification(
            `NOT-vehicle-reg-${v.id}-${v.registrationExpiry}`,
            "vehicle_expiry",
            "Vehicle Registration Expiring",
            `Vehicle ${v.brand} (${v.plateNumber}) registration expires in ${days} days.`,
            `/vehicles`,
            v.company
          );
        }
      }
      if (v.licenseExpiry) {
        const days = getDaysLeft(v.licenseExpiry);
        if (days <= 30) {
          triggerDashboardNotification(
            `NOT-vehicle-lic-${v.id}-${v.licenseExpiry}`,
            "vehicle_expiry",
            "Vehicle License Expiring",
            `Vehicle ${v.brand} (${v.plateNumber}) license expires in ${days} days.`,
            `/vehicles`,
            v.company
          );
        }
      }
    });

    // ─── 9. PAYMENT DUE (PAYROLL) ───
    payroll.forEach((p) => {
      if (p.status === "Draft" || p.status === "Pending Approval") {
        triggerDashboardNotification(
          `NOT-payroll-${p.id}-${p.status}`,
          "payment",
          `Payroll Action Required`,
          `Payroll payslip for ${p.staffName} is ${p.status.toLowerCase()} for ${p.month}/${p.year}.`,
          `/payroll`,
          p.company
        );
      }
    });

    // ─── 10. ATTENDANCE CORRECTIONS ───
    attendanceCorrections.forEach((ac) => {
      const employee = staff.find((s) => s.id === ac.staffId || s.name === ac.staffName);
      const empEmail = employee?.email || "";
      const empMobile = employee?.mobile || employee?.whatsapp || "";
      const companyName = ac.company || employee?.company || "Company";
      const branchName = ac.branch || employee?.branch || "Main Office";

      if (ac.status === "Pending") {
        triggerDashboardNotification(
          `NOT-attendance-correction-${ac.id}-${ac.status}`,
          "request",
          `Attendance Correction Pending`,
          `Correction request from ${ac.staffName} for date ${ac.date} is pending approval.`,
          `/attendance`,
          ac.company
        );

        // Automated alerts to HR and Branch Admins
        const companyEmail = `hr@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
        const branchEmail = `${branchName.toLowerCase().replace(/[^a-z0-9]/g, "")}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
        const toAddress = `${companyEmail}, ${branchEmail}`;

        const emailId = `EMAIL-correction-pending-${ac.id}`;
        const emailBody = `Dear HR & Branch Admin,\n\n` +
          `A new attendance correction request has been submitted by ${ac.staffName} (ID: ${ac.staffId}) for the date ${ac.date}.\n` +
          `Reason: ${ac.reason}\n` +
          `Status: Pending Approval\n\n` +
          `Please log into the system to approve or reject this request.\n\n` +
          `Best regards,\nMS Manager Notification System`;

        triggerAutomatedEmail(
          emailId,
          toAddress,
          `ACTION REQUIRED: Attendance Correction Request - ${ac.staffName}`,
          emailBody,
          companyName,
          branchName,
          ac.staffName
        );

        // Automated alert to employee confirming submission is pending review
        if (empMobile) {
          triggerAutomatedWhatsApp(
            `WA-correction-pending-${ac.id}`,
            empMobile,
            `Dear ${ac.staffName}, your attendance correction request for date ${ac.date} is pending approval. - MS Manager API`,
            companyName,
            branchName,
            ac.staffName
          );
        }
      } else if (ac.status === "Approved" || ac.status === "Rejected") {
        triggerDashboardNotification(
          `NOT-attendance-correction-${ac.id}-${ac.status}`,
          "request",
          `Attendance Correction ${ac.status}`,
          `Correction request from ${ac.staffName} for date ${ac.date} was ${ac.status.toLowerCase()}${ac.rejectReason ? `: ${ac.rejectReason}` : ""}.`,
          `/attendance`,
          companyName
        );

        // Email alert to employee
        if (empEmail) {
          const statusEmailId = `EMAIL-correction-status-${ac.id}-${ac.status}`;
          const statusEmailBody = `Dear ${ac.staffName},\n\n` +
            `Your attendance correction request for date ${ac.date} has been ${ac.status.toUpperCase()}.\n` +
            (ac.rejectReason ? `Reason: ${ac.rejectReason}\n` : "") +
            `Approved/Processed By: ${ac.approvedBy || "Admin"}\n\n` +
            `Please check the system for details.\n\n` +
            `Best regards,\nMS Manager Notification System`;

          triggerAutomatedEmail(
            statusEmailId,
            empEmail,
            `ALERT: Attendance Correction Request ${ac.status} - ${ac.staffName}`,
            statusEmailBody,
            companyName,
            branchName,
            ac.staffName
          );
        }

        // WhatsApp alert to employee
        if (empMobile) {
          triggerAutomatedWhatsApp(
            `WA-correction-status-${ac.id}-${ac.status}`,
            empMobile,
            `Dear ${ac.staffName}, your attendance correction request for date ${ac.date} has been ${ac.status.toLowerCase()}${ac.rejectReason ? ` (Reason: ${ac.rejectReason})` : ""}. - MS Manager API`,
            companyName,
            branchName,
            ac.staffName
          );
        }
      }
    });

    // ─── 11. OVERTIME REQUESTS ───
    overtimeRequests.forEach((ot) => {
      const employee = staff.find((s) => s.id === ot.staffId || s.name === ot.staffName);
      const empEmail = employee?.email || "";
      const empMobile = employee?.mobile || employee?.whatsapp || "";
      const companyName = ot.company || employee?.company || "Company";
      const branchName = ot.branch || employee?.branch || "Main Office";

      if (ot.status === "Pending") {
        triggerDashboardNotification(
          `NOT-overtime-request-${ot.id}-${ot.status}`,
          "request",
          `Overtime Request Pending`,
          `Overtime request from ${ot.staffName} for ${ot.hours} hours on ${ot.date} is pending approval.`,
          `/attendance`,
          ot.company
        );

        // Automated alerts to HR and Branch Admins
        const companyEmail = `hr@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
        const branchEmail = `${branchName.toLowerCase().replace(/[^a-z0-9]/g, "")}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.ae`;
        const toAddress = `${companyEmail}, ${branchEmail}`;

        const emailId = `EMAIL-overtime-pending-${ot.id}`;
        const emailBody = `Dear HR & Branch Admin,\n\n` +
          `A new overtime request has been submitted by ${ot.staffName} (ID: ${ot.staffId}) for ${ot.hours} hours on date ${ot.date}.\n` +
          `Reason: ${ot.reason}\n` +
          `Status: Pending Approval\n\n` +
          `Please log into the system to approve or reject this request.\n\n` +
          `Best regards,\nMS Manager Notification System`;

        triggerAutomatedEmail(
          emailId,
          toAddress,
          `ACTION REQUIRED: Overtime Request - ${ot.staffName}`,
          emailBody,
          companyName,
          branchName,
          ot.staffName
        );

        // Automated alert to employee confirming submission is pending review
        if (empMobile) {
          triggerAutomatedWhatsApp(
            `WA-overtime-pending-${ot.id}`,
            empMobile,
            `Dear ${ot.staffName}, your overtime request for ${ot.hours} hours on date ${ot.date} is pending approval. - MS Manager API`,
            companyName,
            branchName,
            ot.staffName
          );
        }
      } else if (ot.status === "Approved" || ot.status === "Rejected") {
        triggerDashboardNotification(
          `NOT-overtime-request-${ot.id}-${ot.status}`,
          "request",
          `Overtime Request ${ot.status}`,
          `Overtime request from ${ot.staffName} for ${ot.hours} hours on ${ot.date} was ${ot.status.toLowerCase()}${ot.rejectReason ? `: ${ot.rejectReason}` : ""}.`,
          `/attendance`,
          ot.company
        );

        // Email alert to employee
        if (empEmail) {
          const statusEmailId = `EMAIL-overtime-status-${ot.id}-${ot.status}`;
          const statusEmailBody = `Dear ${ot.staffName},\n\n` +
            `Your overtime request for ${ot.hours} hours on date ${ot.date} has been ${ot.status.toUpperCase()}.\n` +
            (ot.rejectReason ? `Reason: ${ot.rejectReason}\n` : "") +
            `Approved/Processed By: ${ot.approvedBy || "Admin"}\n\n` +
            `Please check the system for details.\n\n` +
            `Best regards,\nMS Manager Notification System`;

          triggerAutomatedEmail(
            statusEmailId,
            empEmail,
            `ALERT: Overtime Request ${ot.status} - ${ot.staffName}`,
            statusEmailBody,
            companyName,
            branchName,
            ot.staffName
          );
        }

        // WhatsApp alert to employee
        if (empMobile) {
          triggerAutomatedWhatsApp(
            `WA-overtime-status-${ot.id}-${ot.status}`,
            empMobile,
            `Dear ${ot.staffName}, your overtime request for ${ot.hours} hours on date ${ot.date} has been ${ot.status.toLowerCase()}${ot.rejectReason ? ` (Reason: ${ot.rejectReason})` : ""}. - MS Manager API`,
            companyName,
            branchName,
            ot.staffName
          );
        }
      }
    });

    isFirstScanDoneRef.current = true;
    isScanningRef.current = false;
  }, [
    isStoreLoaded,
    applicants,
    staff,
    tasks,
    leaveRequests,
    staffRequests,
    vehicles,
    payroll,
    interviews,
    overtimeRequests,
    attendanceCorrections,
  ]);

  return null;
}
