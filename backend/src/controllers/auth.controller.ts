import { Request, Response } from "express";
import * as authService from "../services/auth.service";
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
