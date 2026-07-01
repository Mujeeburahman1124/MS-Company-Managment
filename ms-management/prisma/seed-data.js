const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Database with MS Company & Client Company details...");

  // 1. Seed Internal Company (Own Company)
  const ownCompany = await prisma.internalCompany.upsert({
    where: { id: "internal-ms-comp" },
    update: {
      name: "MS Company Management Solutions",
      status: "Active",
    },
    create: {
      id: "internal-ms-comp",
      name: "MS Company Management Solutions",
      telephone: "+97140000000",
      email: "aqeelamrahman@gmail.com",
      address: "Dubai, UAE",
      status: "Active",
      subscriptionPlan: "Enterprise",
      licenseExpiry: "2030-12-31",
      maxUsers: 100,
      maxStorage: 50,
      type: "Main Company",
      createdAt: "2026-06-30",
      createdBy: "System",
    },
  });
  console.log("Seed Own Company successful:", ownCompany.name);

  // 2. Seed Branches
  const branchesData = [
    {
      id: "DXB001",
      name: "Dubai Main Branch",
      company: "MS Company Management Solutions",
      companyId: "internal-ms-comp",
      address: "Dubai Main Office, UAE",
      phone: "+97140000001",
      email: "aqeelamrahman@gmail.com",
      status: "Active",
      createdAt: "2026-06-30",
    },
    {
      id: "AUH001",
      name: "Abu Dhabi Branch",
      company: "MS Company Management Solutions",
      companyId: "internal-ms-comp",
      address: "Abu Dhabi Branch Office, UAE",
      phone: "+97140000002",
      email: "Ms.safayar@outlook.com",
      status: "Active",
      createdAt: "2026-06-30",
    },
  ];

  for (const b of branchesData) {
    const branch = await prisma.branch.upsert({
      where: { id: b.id },
      update: {
        name: b.name,
        company: b.company,
        companyId: b.companyId,
        status: b.status,
      },
      create: b,
    });
    console.log("Seed Branch successful:", branch.name);
  }

  // 3. Seed Client Companies
  const clientCompanies = [
    {
      id: "client-al-noor",
      name: "Al Noor Trading LLC",
      telephone: "+97142678901",
      hrMobile: "rahmanmujeebur885@gmail.com", // Used for notification routing
      ownerMobile: "",
      whatsapp: "+971501111111",
      email: "mrfaqeela24@gmail.com", // Used for notification routing
      address: "Dubai Investment Park, Dubai, UAE",
      status: "Active",
      googleMapLink: "https://maps.google.com",
      notes: "HR Email: rahmanmujeebur885@gmail.com",
      createdAt: "2026-06-30",
      createdBy: "System",
      enabledModules: {
        Applicants: true,
        Staff: true,
        Tasks: true,
        Interviews: true,
        Attendance: true,
        Payroll: true,
        "Applicant Tracking": true,
      },
    },
    {
      id: "client-gulf-star",
      name: "Gulf Star Contracting LLC",
      telephone: "+97143334444",
      hrMobile: "rahmanbegam230@gmail.com", // Used for notification routing
      ownerMobile: "",
      whatsapp: "+971503333333",
      email: "muqsiaqee@gmail.com", // Used for notification routing
      address: "Musaffah Industrial Area, Abu Dhabi, UAE",
      status: "Active",
      googleMapLink: "https://maps.google.com",
      notes: "HR Email: rahmanbegam230@gmail.com",
      createdAt: "2026-06-30",
      createdBy: "System",
      enabledModules: {
        Applicants: true,
        Staff: true,
        Tasks: true,
        Interviews: true,
        Attendance: true,
        Payroll: true,
        "Applicant Tracking": true,
      },
    },
  ];

  for (const c of clientCompanies) {
    const comp = await prisma.company.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        email: c.email,
        hrMobile: c.hrMobile,
        status: c.status,
        whatsapp: c.whatsapp,
        address: c.address,
      },
      create: c,
    });
    console.log("Seed Client Company successful:", comp.name);
  }

  // 4. Seed System Users (Default Password: "123456")
  const hashedPassword = bcrypt.hashSync("123456", 10);
  const usersData = [
    {
      id: "usr-aqeela",
      name: "Aqeela Mujeebur Rahman",
      email: "aqeelamrahman@gmail.com",
      password: hashedPassword,
      mobile: "+971501234567",
      whatsapp: "+971501234567",
      role: "Super Admin",
      company: "MS Company Management Solutions",
      branch: "Dubai Main Branch",
      status: "Active",
      lastLogin: "-",
    },
    {
      id: "usr-mujeeb",
      name: "Mujeebur Rahman",
      email: "mujeeburahman2003@gmail.com",
      password: hashedPassword,
      mobile: "+971502222222",
      whatsapp: "+971502222222",
      role: "Company Admin",
      company: "MS Company Management Solutions",
      branch: "Dubai Main Branch",
      status: "Active",
      lastLogin: "-",
    },
    {
      id: "usr-safayar",
      name: "Safayar",
      email: "Ms.safayar@outlook.com",
      password: hashedPassword,
      mobile: "+971503333333",
      whatsapp: "+971503333333",
      role: "Branch Admin",
      company: "MS Company Management Solutions",
      branch: "Abu Dhabi Branch",
      status: "Active",
      lastLogin: "-",
    },
    {
      id: "usr-hrmanaged",
      name: "HR Manager",
      email: "mrfaqeela24@gmail.com",
      password: hashedPassword,
      mobile: "+971504444444",
      whatsapp: "+971504444444",
      role: "HR Manager",
      company: "MS Company Management Solutions",
      branch: "Dubai Main Branch",
      status: "Active",
      lastLogin: "-",
    },
    {
      id: "usr-recruiter",
      name: "Recruitment Officer",
      email: "muqsiaqee@gmail.com",
      password: hashedPassword,
      mobile: "+971505555555",
      whatsapp: "+971505555555",
      role: "Recruiter",
      company: "MS Company Management Solutions",
      branch: "Abu Dhabi Branch",
      status: "Active",
      lastLogin: "-",
    },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        company: u.company,
        branch: u.branch,
        status: u.status,
      },
      create: u,
    });
    console.log("Seed User successful:", user.name, `(${user.role})`);
  }

  console.log("Database Seeding Completed Successfully.");
}

main()
  .catch((e) => {
    console.error("Error executing database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
