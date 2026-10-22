import { seedProjects } from "./seeds/project.seed";
import prisma from "../src/shared/utils/prisma";

async function main() {
  await seedProjects(prisma);
  console.log("Đã tạo xong dự án và công việc.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
