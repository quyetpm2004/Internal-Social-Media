// shared/middlewares/validate.middleware.ts
import { z } from "zod";
import { Request, Response, NextFunction } from "express";
export const validate =
  (schema: z.ZodTypeAny, source: "body" | "query" | "params") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: result.error.flatten(),
      });
    }

    // Gán dữ liệu đã validate (đã ép kiểu/loại bỏ trường thừa) vào req
    req.validated = result.data;
    next();
  };

export const validateBody = <T>(schema: z.ZodType<T, any, any>) =>
  validate(schema, "body");

export const validateQuery = <T>(schema: z.ZodType<T, any, any>) =>
  validate(schema, "query");

export const validateParams = <T>(schema: z.ZodType<T, any, any>) =>
  validate(schema, "params");
