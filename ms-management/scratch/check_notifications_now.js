const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.notification.count();
  console.log("NOTIFICATIONS COUNT:", count);
  const notifs = await prisma.notification.findMany();
  console.log("ALL NOTIFICATIONS IN DB:", notifs);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
