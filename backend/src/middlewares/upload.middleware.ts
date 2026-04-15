import multer from "multer";
import path from "path";
import fs from "fs";

type UploadType = "avatar" | "post";

export const createUploadMiddleware = (type: UploadType) => {
  const uploadPath = path.join("public", "uploads", type);

  // Tạo folder nếu chưa tồn tại
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
      cb(null, uploadPath);
    },
    filename: function (_req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  });

  return multer({ storage });
};
