// Seed script to create the initial admin user
// Run: node seed-admin.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@managedad.com";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists. Skipping.");
    return;
  }

  const hashedPassword = await bcrypt.hash("ManagedAd@2026", 12);

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email,
      hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin user created successfully!");
  console.log("  Email:    admin@managedad.com");
  console.log("  Password: ManagedAd@2026");
  console.log("  Role:     ADMIN");
  console.log("");
  console.log("IMPORTANT: Change this password after first login!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
