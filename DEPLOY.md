# Hướng dẫn Deploy Project lên VPS Ubuntu với Docker

## Yêu cầu

- VPS Ubuntu 20.04+ hoặc 22.04+
- Quyền root hoặc sudo
- Domain name (tùy chọn, có thể dùng IP)

## Bước 1: Chuẩn bị VPS

### 1.1. Kết nối SSH vào VPS

```bash
ssh root@your-vps-ip
# hoặc
ssh your-username@your-vps-ip
```

### 1.2. Cập nhật hệ thống

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3. Cài đặt Docker và Docker Compose

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào docker group (nếu không dùng root)
sudo usermod -aG docker $USER

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kiểm tra cài đặt
docker --version
docker-compose --version
```

### 1.4. Cài đặt Git (nếu chưa có)

```bash
sudo apt install git -y
```

## Bước 2: Clone Project lên VPS

### 2.1. Tạo thư mục project

```bash
mkdir -p /var/www
cd /var/www
```

### 2.2. Clone repository

```bash
# Nếu dùng Git
git clone <your-repository-url> thuvien-tn-website
cd thuvien-tn-website

# Hoặc upload project lên VPS bằng SCP
# scp -r ./ws-thuvien-tn root@your-vps-ip:/var/www/thuvien-tn-website
```

## Bước 3: Cấu hình Environment Variables

### 3.1. Tạo file .env

```bash
cd /var/www/thuvien-tn-website
cp .env.example .env
# Hoặc nếu file không tồn tại, tạo trực tiếp:
# nano .env
nano .env
```

### 3.2. Cập nhật các giá trị trong .env

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_very_secure_password_here
DB_NAME=library_tn

# Backend Configuration
BACKEND_PORT=5000
JWT_SECRET=generate_a_random_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=3000

# Production URLs - Thay bằng IP hoặc domain của VPS
NEXT_PUBLIC_API_URL=http://your-vps-ip:5000
NEXT_PUBLIC_BACKEND_URL=http://your-vps-ip:5000

# Nếu có domain:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

**Lưu ý quan trọng:**
- Thay `your-vps-ip` bằng IP thực tế của VPS
- Tạo password mạnh cho database
- Tạo JWT_SECRET ngẫu nhiên (có thể dùng: `openssl rand -base64 32`)

## Bước 4: Build và Chạy Docker Containers

### 4.1. Build images

```bash
cd /var/www/thuvien-tn-website
docker-compose build
```

### 4.2. Khởi động services

```bash
docker-compose up -d
```

### 4.3. Kiểm tra trạng thái

```bash
docker-compose ps
```

Bạn sẽ thấy 3 containers đang chạy:
- `thuvien_tn_postgres` - Database
- `thuvien_tn_backend` - Backend API
- `thuvien_tn_frontend` - Frontend

### 4.4. Xem logs

```bash
# Xem tất cả logs
docker-compose logs -f

# Xem log của từng service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Bước 5: Setup Database

### 5.1. Chạy migrations (nếu có)

```bash
# Nếu có script setup
docker-compose exec backend npm run setup
```

### 5.2. Kiểm tra kết nối database

```bash
docker-compose exec postgres psql -U postgres -d library_tn -c "SELECT version();"
```

## Bước 6: Cấu hình Firewall

### 6.1. Mở ports cần thiết

```bash
# Nếu dùng UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend
sudo ufw enable

# Hoặc nếu dùng iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
```

## Bước 7: Cấu hình Nginx (Tùy chọn - Khuyến nghị cho Production)

### 7.1. Cài đặt Nginx

```bash
sudo apt install nginx -y
```

### 7.2. Tạo Nginx config

```bash
sudo nano /etc/nginx/sites-available/thuvien-tn-website
```

Thêm nội dung:

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.3. Enable site và restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/thuvien-tn-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Bước 8: Cấu hình SSL với Let's Encrypt (Tùy chọn)

### 8.1. Cài đặt Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 8.2. Cấu hình SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

## Bước 9: Kiểm tra Deployment

### 9.1. Kiểm tra services

```bash
# Kiểm tra containers
docker-compose ps

# Kiểm tra health
docker-compose ps | grep healthy
```

### 9.2. Test endpoints

```bash
# Frontend
curl http://localhost:3000

# Backend API
curl http://localhost:5000/api/health
```

### 9.3. Truy cập từ browser

- Frontend: `http://your-vps-ip:3000`
- Backend API: `http://your-vps-ip:5000/api`
- Admin: `http://your-vps-ip:3000/admin/login`

## Các lệnh Docker Compose thường dùng

```bash
# Khởi động services
docker-compose up -d

# Dừng services
docker-compose stop

# Dừng và xóa containers
docker-compose down

# Xem logs
docker-compose logs -f

# Rebuild sau khi thay đổi code
docker-compose up -d --build

# Restart một service cụ thể
docker-compose restart backend
docker-compose restart frontend

# Xem resource usage
docker stats

# Backup database
docker-compose exec postgres pg_dump -U postgres library_tn > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres library_tn < backup.sql
```

## Troubleshooting

### 1. Container không start

```bash
# Xem logs chi tiết
docker-compose logs [service-name]

# Kiểm tra ports đã được sử dụng chưa
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000
```

### 2. Database connection error

```bash
# Kiểm tra database đang chạy
docker-compose ps postgres

# Test connection
docker-compose exec backend node -e "require('./src/config/database').testConnection()"
```

### 3. Frontend không build được

```bash
# Xem build logs
docker-compose logs frontend

# Rebuild với no cache
docker-compose build --no-cache frontend
```

### 4. Permission issues

```bash
# Fix permissions cho uploads
sudo chown -R $USER:$USER /var/www/thuvien-tn-website/backend/uploads
sudo chmod -R 755 /var/www/thuvien-tn-website/backend/uploads
```

### 5. Out of memory

```bash
# Kiểm tra memory
free -h

# Tăng swap (nếu cần)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Auto-start on Boot

Để tự động khởi động containers khi VPS reboot:

```bash
# Tạo systemd service
sudo nano /etc/systemd/system/thuvien-tn-website.service
```

Thêm nội dung:

```ini
[Unit]
Description=Thư viện TN Website Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/thuvien-tn-website
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl enable thuvien-tn-website.service
sudo systemctl start thuvien-tn-website.service
```

## Backup và Restore

### Backup Database

```bash
# Tạo script backup
nano /var/www/thuvien-tn-website/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/www/thuvien-tn-website/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U postgres library_tn | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /var/www/thuvien-tn-website/backup-db.sh

# Chạy backup hàng ngày với cron
crontab -e
# Thêm dòng: 0 2 * * * /var/www/thuvien-tn-website/backup-db.sh
```

## Security Best Practices

1. **Đổi mật khẩu mặc định**: Đảm bảo DB_PASSWORD và JWT_SECRET mạnh
2. **Firewall**: Chỉ mở ports cần thiết
3. **SSL/HTTPS**: Luôn dùng HTTPS cho production
4. **Regular updates**: Cập nhật Docker images thường xuyên
5. **Backup**: Backup database định kỳ
6. **Monitor logs**: Theo dõi logs để phát hiện vấn đề sớm

## Liên hệ và Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker-compose logs -f`
2. Container status: `docker-compose ps`
3. Network: `docker network ls`
4. Volumes: `docker volume ls`

