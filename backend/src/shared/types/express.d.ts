import { JwtPayload } from "@/shared/utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      validated?: any;
    }
  }
}

export {};
