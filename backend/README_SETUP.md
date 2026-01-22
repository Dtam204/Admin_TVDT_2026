# Hướng dẫn Setup Backend

## 🚀 Setup nhanh (1 lệnh duy nhất)

```bash
cd backend
npm run setup
```

Lệnh này sẽ setup toàn bộ:
- ✅ Tạo database
- ✅ Tạo tất cả bảng (users, roles, news, media, ...)
- ✅ Thêm permissions
- ✅ Tạo dữ liệu mẫu
## 📋 Yêu cầu

- Node.js ≥ 18
- PostgreSQL ≥ 12
- File `.env` đã được cấu hình

## ⚙️ Cấu hình .env

Tạo file `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=library_tn

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=4000
```

## 🔄 Sau khi setup

1. Start backend server:
   ```bash
   npm start
   ```

2. Backend sẽ chạy tại: `http://localhost:4000`

3. Media tables sẽ tự động được tạo nếu chưa tồn tại (không cần chạy script riêng)

## 📚 Thêm thông tin

Xem `database/README.md` để biết chi tiết về cấu trúc database.
