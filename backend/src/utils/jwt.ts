import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  fullName: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiresIn as SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn as SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.accessTokenSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.refreshTokenSecret) as JwtPayload;
};
