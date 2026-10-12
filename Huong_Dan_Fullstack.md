# HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG FULL-STACK CAFE POS
**Next.js 14 (Frontend) + Node.js Express (Backend) + PostgreSQL (Database)**

---

## 🌟 1. Cấu Trúc Dự Án
```
cafe-pos-fullstack/
├── database/
│   ├── schema.sql            # Cấu trúc bảng PostgreSQL (Tables, Orders, Items, Menu, Settings)
│   └── seed.sql              # Dữ liệu thực đơn 14 món Cafe Cherry & cấu hình MBBank
├── server/                   # Backend Express + WebSocket + PostgreSQL
│   ├── src/
│   │   ├── config/db.js      # Kết nối PostgreSQL Pool & Tự động chạy Migration
│   │   ├── controllers/      # Điều khiển Bàn, Món ăn, Đơn hàng, Doanh thu, Cài đặt
│   │   ├── routes/api.js     # Danh sách RESTful API
│   │   ├── services/         # Dịch vụ gửi Email (Gmail/Resend) & WebSocket Realtime
│   │   └── index.js          # File chạy máy chủ
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── client/                   # Frontend Next.js 14 App Router + Tailwind CSS
│   ├── src/
│   │   ├── app/              # Trang chính, layout, css
│   │   ├── components/       # TableGrid, ProductCatalog, OrderPanel, VietQRModal, MenuStudio, Reports, Settings
│   │   ├── hooks/            # usePOS (quản lý state), useWebSocket (đồng bộ realtime)
│   │   ├── lib/              # VietQR generator, Sound generator
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local.example
├── docker-compose.yml        # Chạy toàn bộ hệ thống bằng 1 lệnh duy nhất
└── Huong_Dan_Fullstack.md    # Hướng dẫn chi tiết này
```

---

## 🚀 2. Cách Chạy Trên Máy Tính (Với VS Code)

### Bước 1: Chuẩn bị Cơ Sở Dữ Liệu PostgreSQL (Chọn 1 trong 2 cách)

#### 👉 Cách A: Dùng PostgreSQL Đám Mây Miễn Phí (Dễ nhất, khuyên dùng)
Bạn không cần cài đặt phần mềm PostgreSQL nặng máy, hãy dùng **Neon.tech** hoặc **Supabase** (hoàn toàn miễn phí 100%):
1. Vào trang web [https://neon.tech](https://neon.tech) hoặc [https://supabase.com](https://supabase.com) tạo tài khoản miễn phí.
2. Tạo 1 dự án (Project) mới mang tên `cafepos`.
3. Sao chép đường dẫn kết nối **Connection String (PostgreSQL URL)**, ví dụ:
   ```
   postgresql://neondb_owner:matkhau@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

#### 👉 Cách B: Dùng PostgreSQL Cài Trên Máy Tính
Nếu máy bạn đã cài PostgreSQL (qua pgAdmin hoặc Docker):
```
postgresql://postgres:matkhau@localhost:5432/cafepos
```

---

### Bước 2: Khởi Chạy Backend (Express Server)

1. Mở thư mục dự án trong **VS Code**.
2. Mở cửa sổ **Terminal thứ nhất** (Terminal 1) trong VS Code:
   ```bash
   cd server
   ```
3. Tạo tệp `.env` bằng cách sao chép từ `.env.example`:
   - Dán đường dẫn PostgreSQL của bạn vào dòng `DATABASE_URL`:
     ```env
     PORT=8080
     DATABASE_URL=postgresql://neondb_owner:matkhau@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     CLIENT_ORIGIN=http://localhost:3000
     ```
4. Cài đặt thư viện và khởi động máy chủ:
   ```bash
   npm install
   npm start
   ```
   *(Backend sẽ tự động kết nối PostgreSQL, tự động nạp `schema.sql` và `seed.sql` tạo sẵn 10 bàn và 14 món cho bạn!)*

---

### Bước 3: Khởi Chạy Frontend (Next.js 14)

1. Mở thêm một **Terminal thứ hai** (Terminal 2) trong VS Code (bấm dấu `+` ở góc trên Terminal):
   ```bash
   cd client
   ```
2. Tạo tệp `.env.local` từ `.env.local.example`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
   ```
3. Cài đặt thư viện và chạy chế độ phát triển:
   ```bash
   npm install
   npm run dev
   ```
4. Mở trình duyệt web truy cập:
   ```
   http://localhost:3000
   ```
   🎉 Giao diện POS Next.js hiện đại, hiển thị 10 bàn, thực đơn Cafe Cherry, VietQR và báo cáo doanh thu sẽ sẵn sàng hoạt động!

---

## 🐳 3. Cách Chạy Bằng Docker Compose (Chỉ 1 Lệnh)
Nếu máy bạn có cài **Docker Desktop**, bạn chỉ cần mở Terminal tại thư mục gốc `cafe-pos-fullstack/` và gõ:
```bash
docker compose up -d
```
Docker sẽ tự động tải PostgreSQL 16, nạp bảng biểu, chạy Backend cổng `8080` và chạy Frontend cổng `3000`. Bạn chỉ việc mở trình duyệt `http://localhost:3000`.

---

## 🌐 4. Cách Triển Khai Lên Render & Vercel (Cho Điện Thoại / Zalo Truy Cập)

1. **Đẩy mã nguồn lên GitHub:**
   Tạo repo trên GitHub (ví dụ `Phatla86/cafe-pos-fullstack`) rồi đẩy code lên:
   ```bash
   git add .
   git commit -m "Fullstack Nextjs Express Postgres"
   git push
   ```
2. **Deploy Backend lên Render:**
   - Vào Render -> Tạo **Web Service** mới trỏ vào thư mục `server/`.
   - Đặt biến môi trường `DATABASE_URL` (trỏ đến Neon hoặc Supabase) và `PORT=8080`.
3. **Deploy Frontend lên Vercel:**
   - Vào Vercel -> Import repo GitHub, chọn Root Directory là `client/`.
   - Đặt biến môi trường:
     - `NEXT_PUBLIC_API_URL=https://dia-chi-backend-cua-ban.onrender.com/api`
     - `NEXT_PUBLIC_WS_URL=wss://dia-chi-backend-cua-ban.onrender.com/ws`
4. **Mở link trên điện thoại qua Zalo:**
   - Nhân viên chỉ cần bấm vào link Vercel là có thể gọi món, thanh toán VietQR và dữ liệu nhảy về máy tính tức thì theo thời gian thực!
