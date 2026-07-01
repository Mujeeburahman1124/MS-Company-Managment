const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, company: u.company, branch: u.branch })));
  
  const staff = await prisma.staff.findMany();
  console.log("Staff:", staff.map(s => ({ id: s.id, name: s.name, email: s.email, position: s.position, company: s.company, branch: s.branch })));

  const roles = await prisma.role.findMany();
  console.log("Roles:", roles.map(r => ({ id: r.id, name: r.name, description: r.description, isCustom: r.isCustom, company: r.company })));
}

main().catch(err => {
  console.error("Prisma error:", err);
});
