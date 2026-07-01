const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== ALL APPLICANTS ===");
  const applicants = await prisma.applicant.findMany({
    orderBy: { createdAt: "desc" }
  });
  console.log(JSON.stringify(applicants.map(a => ({ id: a.id, name: a.fullName, email: a.email, createdAt: a.createdAt })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
