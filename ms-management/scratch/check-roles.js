const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  console.log("Roles and their permissions:");
  for (const role of roles) {
    console.log(`- Role: ${role.name}`);
    console.log(JSON.stringify(role.permissions, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
