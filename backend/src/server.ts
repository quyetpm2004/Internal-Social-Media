import http from "http";
import { env } from "./config/env";
import app from "./app";
import prisma from "./utils/prisma";
import { initSocket } from "./socket";

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    const httpServer = http.createServer(app);

    initSocket(httpServer);
    console.log("Socket.IO initialized");

    httpServer.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
