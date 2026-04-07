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

    res.status(201).json({
      message: "Đăng ký thành công",
      data: result,
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

    res.status(200).json({
      message: "Đăng nhập thành công",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refresh(refreshToken);

    res.status(200).json({
      message: "Làm mới token thành công",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      message: error instanceof Error ? error.message : "Refresh failed",
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.status(200).json({
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Logout failed",
    });
  }
}
