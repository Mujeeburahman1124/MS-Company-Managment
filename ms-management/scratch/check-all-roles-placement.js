const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  console.log("Placement permission for all roles:");
  for (const role of roles) {
    const perms = role.permissions;
    console.log(`- Role: ${role.name} => Placement view: ${perms?.Placement?.view}`);
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
