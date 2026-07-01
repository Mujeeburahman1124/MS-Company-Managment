const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Configuring role-based default permissions for HR Manager & Recruiter...");

  // Define HR Manager module restrictions (only HR, no recruitment)
  const hrManagerPermissions = {
    "Applicants": { "view": false, "create": false, "edit": false, "delete": false },
    "Staff": { "view": true, "create": true, "edit": true, "delete": true },
    "Companies": { "view": false, "create": false, "edit": false, "delete": false },
    "Branches": { "view": true, "create": true, "edit": true, "delete": false },
    "Users": { "view": true, "create": true, "edit": true, "delete": false },
    "Roles": { "view": true, "create": false, "edit": false, "delete": false },
    "Tasks": { "view": true, "create": true, "edit": true, "delete": true },
    "Documents": { "view": true, "create": true, "edit": true, "delete": true },
    "Attendance": { "view": true, "create": true, "edit": true, "delete": true },
    "Payroll": { "view": true, "create": true, "edit": true, "delete": true },
    "Notifications": { "view": true, "create": true, "edit": true, "delete": true },
    "Activity Log": { "view": true, "create": true, "edit": true, "delete": false },
    "Placement": { "view": false, "create": false, "edit": false, "delete": false },
    "Members": { "view": true, "create": true, "edit": true, "delete": true },
    "Suppliers": { "view": true, "create": true, "edit": true, "delete": true },
    "Visa Expiry": { "view": true, "create": true, "edit": true, "delete": true },
    "Staff Birthdays": { "view": true, "create": true, "edit": true, "delete": true },
    "Leave Requests": { "view": true, "create": true, "edit": true, "delete": true },
    "Staff Requests": { "view": true, "create": true, "edit": true, "delete": true },
    "Interviews": { "view": false, "create": false, "edit": false, "delete": false },
    "Reports": { "view": true, "create": true, "edit": true, "delete": false },
    "Site Settings": { "view": false, "create": false, "edit": false, "delete": false },
    "Applicant Tracking": { "view": false, "create": false, "edit": false, "delete": false }
  };

  // Define Recruiter module restrictions (only recruitment, no HR)
  const recruiterPermissions = {
    "Applicants": { "view": true, "create": true, "edit": true, "delete": true },
    "Staff": { "view": false, "create": false, "edit": false, "delete": false },
    "Companies": { "view": true, "create": false, "edit": false, "delete": false },
    "Branches": { "view": true, "create": true, "edit": true, "delete": false },
    "Users": { "view": false, "create": false, "edit": false, "delete": false },
    "Roles": { "view": false, "create": false, "edit": false, "delete": false },
    "Tasks": { "view": true, "create": true, "edit": true, "delete": true },
    "Documents": { "view": true, "create": true, "edit": true, "delete": true },
    "Attendance": { "view": false, "create": false, "edit": false, "delete": false },
    "Payroll": { "view": false, "create": false, "edit": false, "delete": false },
    "Notifications": { "view": true, "create": true, "edit": true, "delete": true },
    "Activity Log": { "view": true, "create": true, "edit": true, "delete": false },
    "Placement": { "view": true, "create": true, "edit": true, "delete": true },
    "Members": { "view": false, "create": false, "edit": false, "delete": false },
    "Suppliers": { "view": false, "create": false, "edit": false, "delete": false },
    "Visa Expiry": { "view": false, "create": false, "edit": false, "delete": false },
    "Staff Birthdays": { "view": false, "create": false, "edit": false, "delete": false },
    "Leave Requests": { "view": false, "create": false, "edit": false, "delete": false },
    "Staff Requests": { "view": false, "create": false, "edit": false, "delete": false },
    "Interviews": { "view": true, "create": true, "edit": true, "delete": true },
    "Reports": { "view": true, "create": true, "edit": true, "delete": false },
    "Site Settings": { "view": false, "create": false, "edit": false, "delete": false },
    "Applicant Tracking": { "view": true, "create": true, "edit": true, "delete": true }
  };

  // Upsert HR Manager
  const existingHR = await prisma.role.findFirst({ where: { name: "HR Manager" } });
  if (existingHR) {
    await prisma.role.update({
      where: { id: existingHR.id },
      data: { permissions: hrManagerPermissions }
    });
  } else {
    await prisma.role.create({
      data: {
        id: "role-hr-manager",
        name: "HR Manager",
        description: "Manages all HR, staff, attendance, and payroll features",
        permissions: hrManagerPermissions
      }
    });
  }
  console.log("Updated HR Manager permissions.");

  // Upsert Recruiter
  const existingRecruiter = await prisma.role.findFirst({ where: { name: "Recruiter" } });
  if (existingRecruiter) {
    await prisma.role.update({
      where: { id: existingRecruiter.id },
      data: { permissions: recruiterPermissions }
    });
  } else {
    await prisma.role.create({
      data: {
        id: "role-recruiter",
        name: "Recruiter",
        description: "Manages candidates, interviews, and client placements",
        permissions: recruiterPermissions
      }
    });
  }
  console.log("Updated Recruiter permissions.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
