import { env } from "./config/env";
import app from "./app";
import prisma from "./utils/prisma";

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
