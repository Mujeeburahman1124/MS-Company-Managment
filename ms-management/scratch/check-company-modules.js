const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { name: "MS COMPANY" } });
  console.log("MS COMPANY enabledModules:", JSON.stringify(company?.enabledModules, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
