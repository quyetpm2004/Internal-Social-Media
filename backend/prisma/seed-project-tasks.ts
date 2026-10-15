import { seedProjectTasks } from "./seeds/project-task.seed";
import prisma from "../src/shared/utils/prisma";

async function main() {
  await seedProjectTasks(prisma);
  console.log("Project task seed finished.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
