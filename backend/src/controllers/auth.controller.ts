import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { markUserOffline } from "../socket";
import { verifyAccessToken } from "../utils/jwt";
import { Role } from "@prisma/client";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, password, role } = req.body;
    const result = await authService.register(
      fullName,
      email,
      password,
      role as Role,
    );
    // Set refreshToken in HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    // Remove refreshToken from response body
    const { refreshToken, ...responseData } = result;
    res.status(201).json({
      message: "Đăng ký thành công",
      data: responseData,
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Register failed",
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    // Set refreshToken in HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    // Remove refreshToken from response body
    const { refreshToken, ...responseData } = result;
    res.status(200).json({
      message: "Đăng nhập thành công",
      data: responseData,
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // Lấy refreshToken từ cookie
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const result = await authService.refresh(refreshToken);
    // Set new refreshToken in HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    // Remove refreshToken from response body
    const { refreshToken: _, ...responseData } = result;
    res.status(200).json({
      message: "Làm mới token thành công",
      data: responseData,
    });
  } catch (error) {
    res.status(401).json({
      message: error instanceof Error ? error.message : "Refresh failed",
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Lấy refreshToken từ cookie hoặc body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    await authService.logout(refreshToken);

    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = verifyAccessToken(authHeader.slice(7));
        await markUserOffline(decoded.id);
      } catch {
        // Token hết hạn vẫn cho logout bình thường
      }
    }

    // Xóa cookie refreshToken
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.status(200).json({
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Logout failed",
    });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }
    const user = await authService.getMe(userId);
    res.status(200).json({
      message: "Lấy thông tin người dùng thành công",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Get user info failed",
    });
  }
}
