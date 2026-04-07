# 📘 CẨM NANG TRIỂN KHAI HỆ THỐNG THƯ VIỆN LÊN VPS
*Dành riêng cho dự án: thuvientn.site*

Tài liệu này tổng hợp toàn bộ các bước kỹ thuật để đưa hệ thống từ máy tính của bạn lên Cloud VPS. Hãy thực hiện theo thứ tự này sau khi bạn đã viết xong toàn bộ API.

---

## 🛑 THÔNG TIN QUAN TRỌNG (ĐÃ XÁC NHẬN)
- **Tên miền (Domain):** `thuvientn.site` (Đã trỏ về IP VPS).
- **IP VPS:** `160.187.247.41`.
- **Hệ điều hành:** Ubuntu 20.04 (Focal).
- **Cấu hình:** 60GB SSD (Rất tốt cho lưu trữ sách).

---

## 🛠️ GIAI ĐOẠN 1: CÀI ĐẶT MÔI TRƯỜNG (TRÊN VPS)
Đăng nhập vào VPS và chạy cụm lệnh sau để biến máy tính trống thành máy chủ:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Cài đặt Nginx & PostgreSQL
sudo apt install -y nginx postgresql postgresql-contrib

# 4. Cài đặt PM2 (Công cụ chạy ngầm code 24/7)
sudo npm install -g pm2

# 5. Thiết lập mật khẩu DB (Thay 'SECRET_PASS' bằng mật khẩu của bạn)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'SECRET_PASS';"
```

---

## 💾 GIAI ĐOẠN 2: DI CHUYỂN DỮ LIỆU (DATABASE)
Làm sao để đưa sách từ máy này lên máy kia?

**Bước 1 (Tại máy Laptop của bạn):** Dùng pgAdmin hoặc lệnh này để xuất file:
`pg_dump -U postgres -d library_tn > backup_db.sql`

**Bước 2 (Đẩy file lên VPS):** Gửi file `backup_db.sql` lên VPS.

**Bước 3 (Tại VPS):** Tạo DB mới và bơm dữ liệu vào:
`sudo -u postgres psql -c "CREATE DATABASE library_tn;"`
`sudo -u postgres psql library_tn < backup_db.sql`

---

## 🚀 GIAI ĐOẠN 3: ĐẨY CODE & CHẠY SERVER
1. Nén folder `backend` và đẩy lên VPS.
2. Chạy `npm install` để cài thư viện.
3. Tạo file `.env` trên VPS giống file hiện tại nhưng đổi `NODE_ENV=production`.
4. Khởi động code bằng PM2 để không bao giờ bị tắt:
   `pm2 start src/app.js --name "thuvien-backend"`

---

## 🔒 GIAI ĐOẠN 4: CẮM TÊN MIỀN & BẢO MẬT HTTPS
Đây là bước cuối cùng để có địa chỉ `https://thuvientn.site`.

**Bước 1: Cấu hình Nginx (Tạo file `/etc/nginx/sites-available/thuvientn.site`):**
```nginx
server {
    server_name thuvientn.site;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Bước 2: Kích hoạt SSL (Ổ khóa xanh):**
`sudo apt install certbot python3-certbot-nginx -y`
`sudo certbot --nginx -d thuvientn.site`

---

> [!TIP]
> **Lời khuyên:** Cứ bình tĩnh viết cho xong API đi bạn nhé. Khi nào xong, bạn chỉ cần mở file này ra và làm theo 4 giai đoạn trên là hệ thống sẽ lên sóng "ngon lành cành đào". Chúc bạn hoàn thành tốt các API còn lại!
