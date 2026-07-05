export interface DocumentVersion {
  id: string;
  versionLabel: string;
  uploadedBy: string;
  uploadedDate: string;
  notes?: string;
  url?: string;
  type?: string;
}

export interface Document {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedDate: string;
  type: string;
  url?: string;
  versions?: DocumentVersion[];
}

export interface StatusHistory {
  oldStatus: string | null;
  newStatus: string;
  changedBy: string;
  date: string;
  reason?: string;
  companyName?: string;
}

export interface Applicant {
  id: string;
  photo: string | null;
  applicationDate: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  mobile: string;
  whatsapp: string;
  nationality: string;
  nationalityFlag: string;
  currentCountry: string;
  applyingPositions: string[];
  salaryExpectation: number;
  applyCountry: string;
  visaType: string;
  visaExpiry: string;
  passportExpiry: string;
  passportNumber: string;
  status: "Pending" | "Processing" | "Interview Scheduled" | "Selected" | "Visa Processing" | "Placed" | "Rejected" | "Returned";
  trackingCode: string;
  company: string;
  branch: string;
  createdBy: string;
  createdAt: string;
  documents: Document[];
  statusHistory: StatusHistory[];
  clientName?: string;
  clientPhoto?: string | null;
  clientMobile?: string;
  clientWhatsapp?: string;
  clientEmail?: string;
  memberActive?: boolean;
}

export interface Staff {
  id: string;
  photo: string | null;
  name: string;
  nationality: string;
  nationalityFlag: string;
  mobile: string;
  whatsapp: string;
  email: string;
  birthday: string;
  position: string;
  joiningDate: string;
  passportExpiry: string;
  visaExpiry: string;
  passportNumber: string;
  emiratesId: string;
  status: "Active" | "Inactive" | "Suspended";
  company: string;
  branch: string;
  createdBy: string;
  createdAt: string;
  documents: Document[];
  role?: string;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  overtimeRate?: number;
  shiftId?: string;
  salaryType?: string;
  permissions?: any;
}

export interface InternalCompany {
  id: string;
  name: string;
  logo: string | null;
  telephone: string;
  email: string;
  address: string;
  status: "Active" | "Inactive" | "Suspended";
  branches: number;
  staff: number;
  createdAt: string;
  createdBy: string;
  notes?: string;
  subscriptionPlan: "Basic" | "Pro" | "Enterprise";
  licenseExpiry: string;
  maxUsers: number;
  maxStorage: number;
  type?: "Main Company" | "Sub Company" | "";
  branch?: string;
  location?: string;
  country?: string;
  district?: string;
  province?: string;
  city?: string;
}

export interface JobDemand {
  id: string;
  title: string;
  headcount: number;
  offeredSalary: string;
  status: 'Open' | 'Fulfilled' | 'Cancelled';
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  telephone: string;
  hrMobile: string;
  ownerMobile: string;
  whatsapp: string;
  email: string;
  address: string;
  status: "Active" | "Inactive" | "Suspended";
  branches: number;
  staff: number;
  applicants: number;
  createdAt: string;
  createdBy: string;
  notes?: string;
  enabledModules?: Record<string, boolean>;
  googleMapLink?: string;
  documents?: Document[];
  jobDemands?: JobDemand[];
  tradeLicenseNumber?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  companyType?: string;
  ownerName?: string;
  emirateLocation?: string;
  trnNumber?: string;
  separateDatabase?: boolean;
  databaseStatus?: "Not Provisioned" | "Provisioning" | "Ready";
}

export interface Branch {
  id: string;
  name: string;
  company: string;
  companyId: string;
  address: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  staff: number;
  createdAt: string;
  tradeLicenseNumber?: string;
  location?: string;
  contactPerson?: string;
}

export interface LoginHistoryEntry {
  date: string;
  ip: string;
  status: string;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  email: string;
  requestedAt: string;
  status: "Pending" | "Sent" | "Completed" | "Failed";
  requestedBy: string;
  note: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  mobile: string;
  whatsapp: string;
  role: string;
  company: string;
  branch: string;
  status: "Active" | "Disabled" | "Suspended" | "Pending";
  lastLogin: string;
  photo: string | null;
  createdAt: string;
  loginHistory?: LoginHistoryEntry[];
  emailHistory?: EmailChangeRecord[];
  permissions?: any;
  theme?: string;
}

export interface EmailChangeRecord {
  date: string;
  admin: string;
  oldEmail: string;
  newEmail: string;
  reason: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low" | "Urgent";
  assignedTo: string;
  assignedToId: string;
  company: string;
  branch: string;
  assignedDate: string;
  deadline: string;
  status: "Pending" | "Processing" | "Completed" | "Incomplete" | "Reassigned" | "Cancelled";
  incompleteReason?: string;
  history?: { action: string; date: string; by: string; note?: string }[];
  createdBy: string;
  createdAt: string;
  applicantId?: string;
  applicantName?: string;
  targetDocument?: string;
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface Interview {
  id: string;
  type: "Interview" | "Meeting";
  conductPerson: string;
  personName: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  nationality?: string;
  nationalityFlag?: string;
  meetingType?: string;
  position?: string;
  dateTime: string;
  isOnline: boolean;
  mode: "Zoom" | "Google Meet" | "Microsoft Teams" | "WhatsApp" | "Phone call";
  meetingLink?: string | null;
  locationLink?: string | null;
  notes?: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  applicantId?: string;
  company: string;
  branch: string;
  createdBy: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  staffName: string;
  staffId: string;
  leaveType: "Annual" | "Sick" | "Emergency" | "Vacation" | "Unpaid";
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  attachment: string | null;
  status: "Pending" | "Processing" | "Approved" | "Rejected";
  appliedDate: string;
  company: string;
  branch: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectReason?: string;
  createdAt: string;
}

export interface StaffRequest {
  id: string;
  staffName: string;
  staffId: string;
  requestType: "Salary Advance" | "Vacation" | "Emergency Leave" | "Medical Leave" | "Cancel" | "Resign" | "Complaint" | "Company Loan" | "Other";
  description: string;
  status: "Pending" | "Processing" | "Approved" | "Rejected" | "Returned";
  date: string;
  attachment?: string | null;
  company: string;
  branch: string;
  reply: string | null;
  processedBy: string | null;
  rejectReason?: string;
  returnReason?: string;
  createdAt: string;
}

export interface VehicleAssignmentRecord {
  id: string;
  assignedTo: string;
  assignedToId: string;
  company: string;
  branch: string;
  assignedDate: string;
  assignedBy: string;
  conditionBefore?: string;
  pictureBefore?: string | null;
  startKm: number;
  returnDate?: string;
  conditionReturn?: string;
  pictureReturn?: string | null;
  returnKm?: number;
  notes?: string;
  drivenKm?: number;
  ratePerKm?: number;
  totalPayment?: number;
}

export interface Vehicle {
  id: string;
  vehicleType: string;
  brand: string;
  plateNumber: string;
  plateCode: string;
  registrationCountry: string;
  emirate: string;
  colour: string;
  km: number;
  picture: string | null;
  insuranceExpiry: string;
  registrationExpiry: string;
  licenseExpiry: string;
  assignedTo: string | null;
  assignedToId: string | null;
  notes?: string;
  company: string;
  branch: string;
  status: "Available" | "Assigned" | "Maintenance" | "Returned";
  createdBy: string;
  createdAt: string;
  documents?: Document[];
  statusHistory?: StatusHistory[];
  assignmentHistory?: VehicleAssignmentRecord[];
}

export interface VehicleReturn {
  id: string;
  vehicleId: string;
  plateNumber: string;
  plateCode: string;
  returnedBy: string;
  returnDate: string;
  returnKm: number;
  condition: string;
  reason: string;
}

export interface Supplier {
  id: string;
  name: string;
  nationality: string;
  nationalityFlag: string;
  mobile: string;
  whatsapp: string;
  email: string;
  notes: string;
  status: "Active" | "Inactive";
  documents: Document[];
  company: string;
  createdBy: string;
  createdAt: string;
}

export interface Placement {
  id: string;
  applicantName: string;
  applicantId: string;
  companyName: string;
  companyId?: string;
  position: string;
  placementDate: string;
  salary: number;
  status: "Registered" | "Interviews" | "Placed" | "Expired" | "Withdrawn" | "Terminated" | "Active" | "Completed";
  agreementStatus: "Pending" | "Sent" | "Signed";
  applicantSign?: string;
  companySign?: string;
  termsAndConditions?: string;
  agreementHistory?: string[];
  createdBy: string;
  createdAt: string;
  
  // MS Horizon F.Z.E Extensions
  passportNumber?: string;
  mobileNumber?: string;
  registrationDate?: string;
  placementDeadline?: string;
  registrationFee?: number;
  placementFee?: number;
  refundStatus?: "Not Applicable" | "Pending Review" | "Eligible" | "Refunded" | "Forfeited";
  agreementAccepted?: boolean;
  notes?: string;
}

export interface Notification {
  id: string;
  type: "visa_expiry" | "passport_expiry" | "birthday" | "task" | "leave" | "request" | "vehicle_expiry" | "payment" | "company_registration" | "vehicle_return" | "request_rejected" | "activity" | "transport";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
  company?: string;
  branch?: string;
}

export interface ActivityLog {
  id: string;
  dateTime: string;
  userName: string;
  role: string;
  company: string;
  branch: string;
  action: "Created" | "Edited" | "Deleted" | "Status Changed" | "Email Changed" | "Password Reset" | "Document Uploaded" | "Document Downloaded" | "Role Changed" | "Permission Changed" | "Login" | "Logout" | "Email Sent";
  module: string;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string;
}

export interface Role {
  id: string;
  name: string;
  userCount: number;
  isSystem?: boolean;
  isCustom?: boolean;
  company?: string | null;
  description?: string;
  permissions: {
    [moduleName: string]: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      download?: boolean;
      upload?: boolean;
      export?: boolean;
      print?: boolean;
      approve?: boolean;
      reject?: boolean;
      assign?: boolean;
      statusChange?: boolean;
      restore?: boolean;
    };
  };
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  clockIn?: string;
  clockOut?: string;
  gracePeriod: number;
  breakDuration: number;
  description?: string;
  assignedEmployees: string[];
  company: string;
  branch: string;
  createdBy: string;
  createdAt: string;
  overtimeEligible?: string;
  status?: string;
}

export interface OvertimeRequest {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  hours: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  company: string;
  branch: string;
  createdAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectReason?: string;
}

export interface AttendanceCorrection {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  attachment?: string | null;
  company: string;
  branch: string;
  createdAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectReason?: string;
}

export interface AttendanceRecord {
  date: string;
  status: "Present" | "Absent" | "Late" | "Leave" | "Half Day" | "Holiday" | "Weekend" | "Work From Home";
  checkIn: string;
  checkOut: string;
  lateReason?: string;
  overtime: number;
  workingHours?: number;
  breakHours?: number;
  notes?: string;
}

export interface StaffAttendance {
  staffId: string;
  staffName: string;
  month: string;
  year: number;
  records: AttendanceRecord[];
}

export interface SalarySetup {
  staffId: string;
  basic: number;
  housing: number;
  transport: number;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  position: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  allowanceDetails?: { name: string; amount: number }[] | null;
  deductionDetails?: { name: string; amount: number }[] | null;
  advanceDeduction: number;
  loanDeduction: number;
  overtimeHours?: number;
  overtimeRate?: number;
  overtime: number;
  netSalary: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Paid";
  company: string;
  branch: string;
  createdAt?: string;
}

export interface SiteSettings {
  id?: string;
  siteName: string;
  logo: string | null;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  footerText: string;
  primaryColor: string;
  sidebarColor: string;
  linkedin?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  website?: string | null;
}

export interface RecentPage {
  path: string;
  title: string;
  icon: string;
  visitedAt: string;
}

export interface SearchResult {
  id: string;
  name: string;
  module: string;
  link: string;
  subInfo: string;
  status?: string;
}

export interface ModuleFilter {
  search: string;
  mobileSearch: string;
  whatsappSearch: string;
  emailSearch: string;
  status: string;
  company: string;
  branch: string;
  nationality: string;
  createdBy: string;
  assignedTo: string;
  fromDate: string;
  toDate: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
  interviewType?: string;
  clientCompany?: string;
}

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt?: string;
  createdAt?: string;
  sentBy?: string;
  type?: string;
  company?: string;
  branch?: string;
  candidateName?: string;
  templateType?: "Interview" | "Offer" | "Visa";
  templateData?: any;
}
 
export interface SentWhatsApp {
  id: string;
  to: string;
  message: string;
  sentAt?: string;
  createdAt?: string;
  company?: string;
  branch?: string;
  candidateName?: string;
}

export interface PayrollRules {
  deductAbsences: boolean;
  absenceMultiplier: number;
  deductHalfDays: boolean;
  halfDayMultiplier: number;
  leaveDeductionRule: "unpaid" | "all" | "none";
  leaveMultiplier: number;
  overtimeHourlyRate: number;
  overtimeMultiplier: number;
}

