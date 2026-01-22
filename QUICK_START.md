# Quick Start Guide - Deploy lên VPS Ubuntu

## Tóm tắt nhanh

### 1. Trên VPS, cài đặt Docker:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone project và setup:

```bash
cd /var/www
git clone <your-repo> sfb-website
cd sfb-website

# Tạo file .env ở root (cùng cấp với docker-compose.yml)
cp .env.example .env
# Hoặc nếu file .env.example không có, tạo trực tiếp:
# nano .env

# Mở file để chỉnh sửa
nano .env
```

**Cập nhật các giá trị quan trọng:**
- `DB_PASSWORD`: Tạo password mạnh (dùng: `openssl rand -base64 32`)
- `JWT_SECRET`: Tạo secret key (dùng: `openssl rand -base64 32`)
- `NEXT_PUBLIC_API_URL`: Thay `YOUR_VPS_IP` bằng IP thực của VPS
- `NEXT_PUBLIC_BACKEND_URL`: Thay `YOUR_VPS_IP` bằng IP thực của VPS

Xem file `SETUP_ENV.md` để biết chi tiết cách cấu hình!

### 3. Build và chạy:

```bash
docker-compose build
docker-compose up -d
```

### 4. Setup Database:

Sau khi containers đã chạy, chạy lệnh setup database:

```bash
docker-compose exec backend npm run setup
```

Lệnh này sẽ:
- ✅ Tạo tất cả bảng (users, roles, news, products, industries, about, contact, ...)
- ✅ Thêm permissions cho các modules
- ✅ Tạo user admin mặc định (email: `admin@gmail.com`, password: `admin123`)
- ✅ Insert seed data mẫu cho tất cả modules (bao gồm contact page)

**Lưu ý**: Nếu database đã được khởi tạo tự động từ `schema.sql` (khi container PostgreSQL khởi động lần đầu), lệnh này vẫn an toàn để chạy và sẽ không tạo duplicate data.

### 5. Kiểm tra:

```bash
docker-compose ps
docker-compose logs -f
```

### 6. Truy cập:

- Frontend: `http://your-vps-ip:3000`
- Backend: `http://your-vps-ip:5000`
- Admin: `http://your-vps-ip:3000/admin/login`

## Các lệnh thường dùng

```bash
# Xem logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild sau khi thay đổi code
docker-compose up -d --build

# Dừng tất cả
docker-compose down

# Backup database
docker-compose exec postgres pg_dump -U postgres library_tn > backup.sql
```

Xem file `DEPLOY.md` để biết chi tiết đầy đủ!

