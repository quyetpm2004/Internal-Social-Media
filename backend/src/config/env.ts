import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  port: number;
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 8000,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
};
