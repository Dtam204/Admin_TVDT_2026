# Hướng dẫn cấu hình .env trên VPS

## Vị trí file .env

File `.env` phải được đặt ở **thư mục root** của project (cùng cấp với `docker-compose.yml`), KHÔNG phải trong thư mục `backend`.

```
/var/www/thuvien-tn-website/
├── .env                    ← File này ở đây (root)
├── docker-compose.yml
├── backend/
│   └── ...
└── frontend/
    └── ...
```

## Các bước cấu hình

### Bước 1: Di chuyển hoặc tạo file .env ở root

Nếu bạn đã tạo file trong `backend/`, hãy di chuyển lên root:

```bash
cd /var/www/thuvien-tn-website

# Nếu file .env đã có trong backend/, di chuyển lên root
mv backend/.env .env

# Hoặc nếu chưa có, copy từ example
cp .env.example .env
```

### Bước 2: Mở file .env để chỉnh sửa

```bash
nano .env
```

### Bước 3: Cập nhật các giá trị sau

#### 1. Database Configuration

```env
DB_HOST
DB_HOST=postgres          # Không đổi (tên service trong docker-compose)
DB_PORT=5432             # Không đổi
DB_USER=sfb         # Có thể đổi nếu muốn
DB_PASSWORD=sfb@@2025    # ⚠️ ĐỔI THÀNH MẬT KHẨU MẠNH
DB_NAME=sfb_website           # Có thể đổi nếu muốn
```

**Tạo mật khẩu mạnh:**
```bash
# Trên VPS, chạy lệnh này để tạo password ngẫu nhiên:
openssl rand -base64 32
```

#### 2. Backend Configuration

```env
BACKEND_PORT=5000        # Port backend (có thể đổi nếu muốn)
JWT_SECRET=YOUR_JWT_SECRET_HERE    # ⚠️ ĐỔI THÀNH SECRET KEY MẠNH
JWT_EXPIRES_IN=7d        # Thời gian hết hạn token
NODE_ENV=production       # Không đổi
```

**Tạo JWT_SECRET:**
```bash
# Trên VPS, chạy lệnh này:
openssl rand -base64 32
```

#### 3. Frontend Configuration

```env
FRONTEND_PORT=3000       # Port frontend (có thể đổi nếu muốn)

# ⚠️ QUAN TRỌNG: Thay đổi IP/domain của VPS
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:5000
NEXT_PUBLIC_BACKEND_URL=http://YOUR_VPS_IP:5000

# API_THUVIEN_TN_URL và NEXT_PUBLIC_API_THUVIEN_TN_URL (dùng trong một số file)
# Nếu không set, code sẽ fallback về NEXT_PUBLIC_API_URL
API_THUVIEN_TN_URL=http://YOUR_VPS_IP:5000
NEXT_PUBLIC_API_THUVIEN_TN_URL=http://YOUR_VPS_IP:5000
```

**Lấy IP của VPS:**
```bash
# Chạy lệnh này để xem IP:
hostname -I | awk '{print $1}'
# hoặc
curl ifconfig.me
```

**Ví dụ nếu IP VPS là `123.456.789.10`:**
```env
NEXT_PUBLIC_API_URL=http://123.456.789.10:5000
NEXT_PUBLIC_BACKEND_URL=http://123.456.789.10:5000
```

**Nếu có domain (ví dụ: `thuvien-tn.vn`):**
```env
NEXT_PUBLIC_API_URL=https://api.sfb.vn
NEXT_PUBLIC_BACKEND_URL=https://api.sfb.vn
```

## Ví dụ file .env hoàn chỉnh

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=MyStr0ng!P@ssw0rd2024
DB_NAME=library_tn

# Backend Configuration
BACKEND_PORT=5000
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=7d
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://123.456.789.10:5000
NEXT_PUBLIC_BACKEND_URL=http://123.456.789.10:5000
API_THUVIEN_TN_URL=http://123.456.789.10:5000
NEXT_PUBLIC_API_THUVIEN_TN_URL=http://123.456.789.10:5000
```

## Lưu ý bảo mật

1. **KHÔNG commit file `.env` lên Git** - File này chứa thông tin nhạy cảm
2. **Đổi tất cả mật khẩu mặc định** - Đặc biệt là `DB_PASSWORD` và `JWT_SECRET`
3. **Sử dụng mật khẩu mạnh** - Ít nhất 16 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
4. **Giữ file `.env` an toàn** - Chỉ user cần thiết mới có quyền đọc

## Kiểm tra file .env

Sau khi cấu hình xong, kiểm tra:

```bash
# Xem nội dung (ẩn password)
cat .env | grep -v PASSWORD

# Kiểm tra file có ở đúng vị trí không
ls -la /var/www/thuvien-tn-website/.env

# Kiểm tra quyền file (nên là 600)
chmod 600 .env
ls -la .env
```

## Sau khi cấu hình xong

Tiếp tục với các bước deploy:

```bash
# Build và chạy containers
docker-compose build
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f
```

## Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra `DB_PASSWORD` đã đúng chưa
- Kiểm tra `DB_HOST=postgres` (không phải `localhost`)

### Lỗi: "Frontend không kết nối được backend"
- Kiểm tra `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_BACKEND_URL` đã đúng IP/domain chưa
- Đảm bảo firewall đã mở port 5000 và 3000

### Lỗi: "Permission denied"
```bash
sudo chown $USER:$USER .env
chmod 600 .env
```

