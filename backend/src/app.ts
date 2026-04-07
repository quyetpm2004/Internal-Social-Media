import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ message: "API is running version 1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

export default app;
