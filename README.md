# CollabNet — Mạng xã hội công ty nội bộ


### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã cài và đang chạy

### Chuẩn bị file môi trường

Trước khi chạy Docker, cần có `backend/.env` (copy từ `backend/.env.example` và điền AWS S3 + JWT secret).

`docker-compose` tự cấu hình MariaDB, Redis và host DB cho container — **không cần** cài MySQL trên máy.

### Chạy

```bash
docker compose up --build
```

Lần đầu build có thể mất vài phút. Khi thấy log `Server running at http://localhost:8080` là sẵn sàng.

| Dịch vụ   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:5173      |
| Backend   | http://localhost:8080      |

### Tài khoản demo (sau khi seed)

| Email               | Mật khẩu |
|---------------------|----------|
| admin@company.com   | 123456   |
| employee13@company.com   | 123456   |
| employee1@company.com   | 123456   |

### Dừng

```bash
docker compose down
```

Xóa cả dữ liệu DB (chạy lại từ đầu):

```bash
docker compose down -v
```

---

## Chạy local (phát triển)

### Backend

```bash
cd backend
cp .env.example .env   # điền giá trị thật
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Cấu trúc Docker

```
docker-compose.yml      # MariaDB + Redis + Backend + Frontend
backend/Dockerfile      # API — tự migrate + seed khi khởi động
frontend/Dockerfile     # Build React + nginx
```
