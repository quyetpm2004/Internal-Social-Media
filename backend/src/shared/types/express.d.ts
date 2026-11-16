import { AuthUser } from "@/shared/utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validated?: any;
    }
  }
}

export {};
