const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.findFirst({ where: { name: "HR Manager" } });
  console.log("HR Manager permissions:", JSON.stringify(role.permissions, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
