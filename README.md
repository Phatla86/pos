# Cafe Cherry POS - Full-stack Next.js + Express + PostgreSQL

Hệ thống quản lý bán hàng (POS) chuyên nghiệp cho quán Cafe với 10 bàn ăn, hỗ trợ thanh toán VietQR động, báo cáo doanh thu theo Ngày/Tháng/Năm, thông báo Gmail / Resend, và đồng bộ thời gian thực qua WebSocket.

## Công nghệ sử dụng
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, PostgreSQL Client (`pg`), WebSocket (`ws`), Nodemailer.
- **Database**: PostgreSQL 16 (Relational DDL, Indexes, JSONB for active table items).
- **DevOps**: Docker, Docker Compose, Multi-stage builds.

## Hướng dẫn cài đặt
Xem chi tiết tại tệp [Huong_Dan_Fullstack.md](./Huong_Dan_Fullstack.md).

```bash
# Khởi chạy bằng Docker
docker compose up -d

# Hoặc khởi chạy thủ công
# 1. Backend
cd server && npm install && npm start

# 2. Frontend
cd client && npm install && npm run dev
```
