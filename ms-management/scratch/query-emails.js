const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const emails = await prisma.sentEmail.findMany();
  const statuses = {};
  emails.forEach(e => {
    statuses[e.deliveryStatus] = (statuses[e.deliveryStatus] || 0) + 1;
  });
  console.log("Email statuses:", statuses);
}

main().catch(err => {
  console.error("Prisma error:", err);
});
