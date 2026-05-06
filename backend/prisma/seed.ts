import { seedDepartments } from "./seeds/department.seed";
import { seedPositions } from "./seeds/position.seed";
import { seedUsers } from "./seeds/user.seed";
import { seedGroups } from "./seeds/group.seed";
import { seedPosts } from "./seeds/post.seed";

import prisma from "../src/utils/prisma";

async function main() {
  console.log("🚀 Start seeding...");

  try {
    // Thứ tự cực kỳ quan trọng do ràng buộc khóa ngoại (FK)
    await seedDepartments(prisma);
    await seedPositions(prisma);
    await seedUsers(prisma);
    await seedGroups(prisma);
    await seedPosts(prisma);

    console.log("✨ Seeding finished successfully.");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
