import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import departmentRoutes from "./routes/department.routes";
import positionRoutes from "./routes/position.routes";
import dotenv from "dotenv";
import postRoutes from "./routes/post.route";
import commentRoutes from "./routes/comment.route";

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

export default app;
