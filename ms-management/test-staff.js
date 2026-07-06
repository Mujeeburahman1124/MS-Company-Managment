const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.staff.create({
      data: {
        name: "Test Staff",
        company: "Test Co",
        branch: "Main",
        nationality: "India",
        nationalityFlag: "🏳️",
        mobile: "",
        whatsapp: "",
        email: "test@example.com",
        birthday: "1990-01-01",
        position: "Manager",
        joiningDate: "2023-01-01",
        passportExpiry: "",
        visaExpiry: "",
        passportNumber: "",
        emiratesId: "",
        status: "Active",
        createdBy: "System",
        createdAt: new Date().toISOString(),
        documents: [],
        basicSalary: NaN, // Will this throw?
        housingAllowance: 1000,
        transportAllowance: 500,
        overtimeRate: 15,
        shiftId: "",
        salaryType: "Monthly"
      }
    });
    console.log("Success:", res.id);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
main();
