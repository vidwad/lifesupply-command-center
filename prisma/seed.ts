import { PrismaClient } from "@prisma/client";

import { seedAuth } from "./seed/auth";
import { seedManagement } from "./seed/management";
import { seedOperating } from "./seed/operating";
import { seedTransactions } from "./seed/transactions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LifeSupply Command Center database...\n");

  const admin = await seedAuth(prisma);
  await seedOperating(prisma);
  await seedTransactions(prisma);
  await seedManagement(prisma);

  console.log("\nSeed complete.");
  console.log(`\nDev login: ${admin.email} / ${admin.password}`);
  console.log("Override with DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD env vars.");
}

main()
  .catch((err) => {
    console.error("\nSeed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
