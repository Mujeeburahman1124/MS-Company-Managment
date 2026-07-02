const http = require("http");
 
// Since we don't have cookies easily in a plain script, let's query the database directly to check if there are any duplicate values, or if we can find where STF151 is referenced in any other table.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
 
async function main() {
  const staff = await prisma.staff.findMany();
  console.log("Count:", staff.length);
  console.log("Staff IDs:", staff.map(s => s.id));
}
 
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
