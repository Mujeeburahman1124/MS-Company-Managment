const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Site Settings
  console.log("Creating default site settings...");
  await prisma.siteSettings.upsert({
    where: { id: "SETTINGS" },
    update: {},
    create: {
      id: "SETTINGS",
      siteName: "MS Horizon F.Z.E",
      email: "info@mshorizon.ae",
      phone: "+971 4 123 4567",
      whatsapp: "+971 50 123 4567",
      address: "Office 101, Business Bay, Dubai, UAE",
      footerText: "© 2026 MS Horizon F.Z.E. All Rights Reserved.",
      primaryColor: "#3B82F6",
      sidebarColor: "#0A0F1C"
    }
  });

  // 2. Hash Password for Super Admin
  const hashedPassword = bcrypt.hashSync("admin123", 10);

  // 3. Seed Super Admin User
  console.log("Creating Super Admin user...");
  await prisma.user.upsert({
    where: { email: "admin@system.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@system.com",
      password: hashedPassword,
      mobile: "+971500000000",
      whatsapp: "+971500000000",
      role: "Super Admin",
      company: "System",
      branch: "All",
      status: "Active",
      lastLogin: new Date().toISOString()
    }
  });

  // 4. Seed Default System Roles
  console.log("Creating default system roles...");
  const modules = [
    "Applicants", "Staff", "Companies", "Branches", "Users", "Roles", 
    "Tasks", "Documents", "Attendance", "Payroll", "Notifications", 
    "Activity Log", "Placement", "Members", "Suppliers", "Visa Expiry", 
    "Staff Birthdays", "Leave Requests", "Staff Requests", "Interviews", 
    "Reports", "Site Settings", "Applicant Tracking"
  ];

  const fullAccessPerms = {};
  const limitedAccessPerms = {};
  const staffAccessPerms = {};
  const vehicleCoordinatorPerms = {};
  const taskManagerPerms = {};
  const readOnlyPerms = {};

  modules.forEach(m => {
    fullAccessPerms[m] = { view: true, create: true, edit: true, delete: true };
    
    // For standard staff, mostly view their own, no delete
    if (["Tasks", "Leave Requests", "Staff Requests", "Attendance"].includes(m)) {
      staffAccessPerms[m] = { view: true, create: true, edit: true, delete: false };
    } else {
      staffAccessPerms[m] = { view: false, create: false, edit: false, delete: false };
    }

    // For managers (HR, Recruiter), give create/edit but no delete/user administration
    if (["Users", "Roles", "Site Settings", "Companies"].includes(m)) {
      limitedAccessPerms[m] = { view: true, create: false, edit: false, delete: false };
    } else {
      limitedAccessPerms[m] = { view: true, create: true, edit: true, delete: false };
    }

    // For Read Only User
    readOnlyPerms[m] = { view: true, create: false, edit: false, delete: false };

    // For Vehicle Coordinator
    if (m === "Vehicles") {
      vehicleCoordinatorPerms[m] = { view: true, create: true, edit: true, delete: true };
    } else if (["Staff", "Tasks", "Notifications", "Visa Expiry"].includes(m)) {
      vehicleCoordinatorPerms[m] = { view: true, create: false, edit: false, delete: false };
    } else {
      vehicleCoordinatorPerms[m] = { view: false, create: false, edit: false, delete: false };
    }

    // For Task Manager
    if (m === "Tasks") {
      taskManagerPerms[m] = { view: true, create: true, edit: true, delete: true };
    } else if (["Staff", "Notifications"].includes(m)) {
      taskManagerPerms[m] = { view: true, create: false, edit: false, delete: false };
    } else {
      taskManagerPerms[m] = { view: false, create: false, edit: false, delete: false };
    }
  });

  const defaultRoles = [
    { name: "Super Admin", description: "Full system access to all resources and tenant companies.", permissions: fullAccessPerms, isCustom: false },
    { name: "Company Admin", description: "Admin access scoped to their specific company.", permissions: fullAccessPerms, isCustom: false },
    { name: "Branch Admin", description: "Admin access scoped to their specific branch.", permissions: limitedAccessPerms, isCustom: false },
    { name: "HR Manager", description: "Manages staff, leaves, requests, and attendance.", permissions: limitedAccessPerms, isCustom: false },
    { name: "Recruiter", description: "Manages applicants, interviews, and placements.", permissions: limitedAccessPerms, isCustom: false },
    { name: "Accountant", description: "Manages payroll and records.", permissions: limitedAccessPerms, isCustom: false },
    { name: "Staff", description: "General employee with self-service dashboard access.", permissions: staffAccessPerms, isCustom: false },
    { name: "Vehicle Coordinator", description: "Manages company transport, drivers, and vehicles.", permissions: vehicleCoordinatorPerms, isCustom: false },
    { name: "Task Manager", description: "Assigns and tracks internal team tasks.", permissions: taskManagerPerms, isCustom: false },
    { name: "Read Only User", description: "View-only access to all modules without modification rights.", permissions: readOnlyPerms, isCustom: false }
  ];

  for (const role of defaultRoles) {
    const existing = await prisma.role.findFirst({
      where: { name: role.name, company: null }
    });
    if (!existing) {
      await prisma.role.create({
        data: role
      });
    } else {
      // Keep permissions updated if seed is re-run
      await prisma.role.update({
        where: { id: existing.id },
        data: { permissions: role.permissions }
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
