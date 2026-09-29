import prisma from "../src/shared/utils/prisma";
import { seedProjectTemplates } from "./seeds/project-template.seed";

async function main() {
  await seedProjectTemplates(prisma);
  console.log("Project template seed finished.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
