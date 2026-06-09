import type { AppIOServer } from "@/socket/types";

let io: AppIOServer | null = null;

export const getIO = (): AppIOServer | null => io;

export const setIO = (server: AppIOServer): void => {
  io = server;
};
