# Troubleshooting trên VPS Ubuntu

## Cảnh báo về `version` trong docker-compose.yml

### Vấn đề:
```
WARN[0000] /var/www/sfb-website/docker-compose.yml: the attribute `version` is obsolete
```

### Giải pháp:
Docker Compose v2 không còn cần `version` nữa. Đã được fix trong code.

## Kiểm tra trạng thái containers

### 1. Xem containers đang chạy:
```bash
sudo docker-compose ps
```

### 2. Nếu không có containers nào (như hiện tại):

Có nghĩa là containers chưa được build/start. Thực hiện:

```bash
cd /var/www/sfb-website

# Build images
sudo docker-compose build

# Start containers
sudo docker-compose up -d

# Kiểm tra lại
sudo docker-compose ps
```

### 3. Xem logs nếu có lỗi:
```bash
# Xem tất cả logs
sudo docker-compose logs

# Xem logs real-time
sudo docker-compose logs -f

# Xem logs của service cụ thể
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
sudo docker-compose logs -f postgres
```

## Các lệnh thường dùng

### Kiểm tra trạng thái:
```bash
# Xem containers
sudo docker-compose ps

# Xem images
sudo docker images

# Xem volumes
sudo docker volume ls

# Xem networks
sudo docker network ls
```

### Build và start:
```bash
# Build lại images
sudo docker-compose build

# Build không cache
sudo docker-compose build --no-cache

# Start containers
sudo docker-compose up -d

# Rebuild và start
sudo docker-compose up -d --build
```

### Dừng và xóa:
```bash
# Dừng containers
sudo docker-compose stop

# Dừng và xóa containers
sudo docker-compose down

# Xóa cả volumes (cẩn thận - sẽ mất data)
sudo docker-compose down -v
```

### Restart:
```bash
# Restart tất cả
sudo docker-compose restart

# Restart service cụ thể
sudo docker-compose restart backend
sudo docker-compose restart frontend
```

## Kiểm tra health

### 1. Kiểm tra containers healthy:
```bash
sudo docker-compose ps
# Xem cột STATUS, nên thấy "healthy" hoặc "Up"
```

### 2. Test endpoints:
```bash
# Test backend
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000

# Test database connection
sudo docker-compose exec postgres psql -U postgres -d library_tn -c "SELECT version();"
```

## Lỗi thường gặp

### Lỗi: "Cannot connect to database"
```bash
# Kiểm tra postgres đang chạy
sudo docker-compose ps postgres

# Xem logs postgres
sudo docker-compose logs postgres

# Kiểm tra .env file
cat .env | grep DB_
```

### Lỗi: "Port already in use"
```bash
# Kiểm tra port đang được dùng
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000

# Hoặc đổi port trong .env
nano .env
# Thay đổi FRONTEND_PORT và BACKEND_PORT
```

### Lỗi: "Permission denied"
```bash
# Fix permissions cho uploads
sudo chown -R $USER:$USER /var/www/sfb-website/backend/uploads
sudo chmod -R 755 /var/www/sfb-website/backend/uploads

# Fix permissions cho .env
sudo chmod 600 .env
```

### Lỗi: "No space left on device"
```bash
# Xem dung lượng
df -h

# Dọn dẹp Docker
sudo docker system prune -a
sudo docker volume prune
```

## Debug chi tiết

### 1. Xem logs đầy đủ:
```bash
sudo docker-compose logs --tail=100 -f
```

### 2. Vào trong container:
```bash
# Vào backend container
sudo docker-compose exec backend sh

# Vào postgres container
sudo docker-compose exec postgres psql -U postgres -d library_tn
```

### 3. Kiểm tra network:
```bash
# Xem network
sudo docker network inspect sfb-website_sfb_network

# Test connectivity giữa containers
sudo docker-compose exec backend ping postgres
```

## Quy trình deploy đầy đủ

```bash
cd /var/www/sfb-website

# 1. Kiểm tra .env
cat .env | grep -v PASSWORD

# 2. Build images
sudo docker-compose build

# 3. Start containers
sudo docker-compose up -d

# 4. Kiểm tra status
sudo docker-compose ps

# 5. Xem logs
sudo docker-compose logs -f

# 6. Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:3000
```

## Sau khi deploy thành công

1. **Kiểm tra firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 3000/tcp
   sudo ufw allow 5000/tcp
   ```

2. **Truy cập từ browser:**
   - Frontend: `http://your-vps-ip:3000`
   - Backend: `http://your-vps-ip:5000`
   - Admin: `http://your-vps-ip:3000/admin/login`

3. **Setup database (nếu cần):**
   ```bash
   sudo docker-compose exec backend npm run setup
   ```

