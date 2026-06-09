import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "@/modules/auth/auth.routes";
import userRoutes from "@/modules/user/user.routes";
import departmentRoutes from "@/modules/department/department.routes";
import positionRoutes from "@/modules/position/position.routes";
import { errorMiddleware } from "@/shared/middlewares/error.middleware";
import dotenv from "dotenv";
import postRoutes from "@/routes/post.routes";
import commentRoutes from "@/routes/comment.route";
import uploadRoutes from "@/routes/upload.routes";
import fileRoutes from "@/modules/file/file.routes";
import groupRoutes from "@/routes/group.routes";
import searchRoutes from "@/routes/search.routes";
import chatRoutes from "@/routes/chat.routes";
import notificationRoutes from "@/routes/notification.routes";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.URL_FRONTEND,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.json({ message: "API is running version 1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/file-url", fileRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorMiddleware);

export default app;
