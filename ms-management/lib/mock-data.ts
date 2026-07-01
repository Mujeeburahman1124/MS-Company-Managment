import { Applicant, Staff, Company, Branch, User, Role, Task, Interview, LeaveRequest, StaffRequest, Vehicle, Supplier, Placement, ActivityLog, StaffAttendance, PayrollRecord, SiteSettings, Notification, PasswordResetRequest, Shift, OvertimeRequest, AttendanceCorrection } from "./types";

export const MOCK_SITE_SETTINGS: SiteSettings = {
  siteName: "MS Horizon F.Z.E",
  email: "info@mshorizon.ae",
  phone: "+971 4 123 4567",
  whatsapp: "+971 50 123 4567",
  address: "Office 101, Business Bay, Dubai, UAE",
  footerText: "© 2026 MS Horizon F.Z.E. All Rights Reserved.",
  primaryColor: "#3B82F6",
  sidebarColor: "#0A0F1C",
  linkedin: null,
  twitter: null,
  facebook: null,
  instagram: null,
  logo: null
};

export const MOCK_COMPANIES: Company[] = [];
export const MOCK_BRANCHES: Branch[] = [];
export const MOCK_USERS: User[] = [];
export const MOCK_STAFF: Staff[] = [];
export const MOCK_APPLICANTS: Applicant[] = [];
export const MOCK_TASKS: Task[] = [];
export const MOCK_INTERVIEWS: Interview[] = [];
export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
export const MOCK_STAFF_REQUESTS: StaffRequest[] = [];
export const MOCK_VEHICLES: Vehicle[] = [];
export const MOCK_SUPPLIERS: Supplier[] = [];
export const MOCK_PLACEMENTS: Placement[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [];
export const MOCK_ATTENDANCE: StaffAttendance[] = [];
export const MOCK_PAYROLL: PayrollRecord[] = [];
export const MOCK_SHIFTS: Shift[] = [];
export const MOCK_OVERTIME_REQUESTS: OvertimeRequest[] = [];
export const MOCK_ATTENDANCE_CORRECTIONS: AttendanceCorrection[] = [];
export const MOCK_ROLES: Role[] = [];
export const MOCK_PASSWORD_RESET_REQUESTS: PasswordResetRequest[] = [];
