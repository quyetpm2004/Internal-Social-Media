import { Request, Response } from "express";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "@/modules/auth/auth.cookie";
import type { LoginInput, RegisterInput } from "@/modules/auth/auth.schema";
import * as authService from "@/modules/auth/auth.service";
import { markUserOffline } from "@/socket";
import { verifyAccessToken } from "@/shared/utils/jwt";

const getRefreshTokenFromRequest = (req: Request): string | undefined =>
  req.cookies?.refreshToken || req.body?.refreshToken;

export async function register(req: Request, res: Response) {
  const { fullName, email, password, role } = req.validated as RegisterInput;

  const result = await authService.register(fullName, email, password, role);

  setRefreshTokenCookie(res, result.refreshToken);

  const { refreshToken: _, ...responseData } = result;

  res.status(201).json({
    message: "Đăng ký thành công",
    data: responseData,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.validated as LoginInput;

  const result = await authService.login(email, password);

  setRefreshTokenCookie(res, result.refreshToken);

  const { refreshToken: _, ...responseData } = result;

  res.status(200).json({
    message: "Đăng nhập thành công",
    data: responseData,
  });
}

export async function refreshToken(req: Request, res: Response) {
  const token = getRefreshTokenFromRequest(req);
  const result = await authService.refresh(token ?? "");

  setRefreshTokenCookie(res, result.refreshToken);

  const { refreshToken: _, ...responseData } = result;

  res.status(200).json({
    message: "Làm mới token thành công",
    data: responseData,
  });
}

export async function logout(req: Request, res: Response) {
  const token = getRefreshTokenFromRequest(req);
  await authService.logout(token ?? "");

  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = verifyAccessToken(authHeader.slice(7));
      await markUserOffline(decoded.id);
    } catch {
      // Token hết hạn vẫn cho logout bình thường
    }
  }

  clearRefreshTokenCookie(res);

  res.status(200).json({
    message: "Đăng xuất thành công",
  });
}

export async function getMe(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.id);

  res.status(200).json({
    message: "Lấy thông tin người dùng thành công",
    data: user,
  });
}
