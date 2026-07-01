const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== ROLES ===");
  const roles = await prisma.role.findMany();
  roles.forEach(r => {
    console.log(`Role: ${r.name}`);
    console.log(JSON.stringify(r.permissions, null, 2));
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
