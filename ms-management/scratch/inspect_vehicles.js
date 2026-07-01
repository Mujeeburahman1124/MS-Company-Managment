const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Creating a test vehicle in Prisma...");
  const newVehicle = await prisma.vehicle.create({
    data: {
      id: "VEH-TEST-999",
      plateNumber: "T-99999",
      model: "Sedan",
      make: "Toyota Camry",
      year: 2026,
      status: "Available",
      company: "Alpha Solutions LLC",
      branch: "Main Branch",
      createdAt: new Date().toISOString().slice(0, 19),
      vehicleType: "Sedan",
      brand: "Toyota Camry",
      plateCode: "Dubai",
      registrationCountry: "UAE",
      emirate: "Dubai",
      colour: "White",
      km: 12500,
      picture: null,
      insuranceExpiry: "2027-06-25",
      registrationExpiry: "2027-06-25",
      licenseExpiry: "2027-06-25",
      notes: "Test notes",
      createdBy: "Test User",
      assignmentHistory: []
    }
  });
  console.log("Created successfully:", newVehicle);

  console.log("Fetching all vehicles from DB:");
  const vehicles = await prisma.vehicle.findMany();
  console.log(JSON.stringify(vehicles, null, 2));

  console.log("Cleaning up test vehicle...");
  await prisma.vehicle.delete({ where: { id: "VEH-TEST-999" } });
  console.log("Cleanup complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
