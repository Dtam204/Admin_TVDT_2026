# SYSTEM RUN AND DEPLOY GUIDE

Tai lieu tong hop cach cai dat, su dung, kiem tra va deploy he thong Thu vien TN (Frontend + Backend + Database).

## 1. Tong quan kien truc

- Frontend: Next.js App Router (thu muc `frontend/`)
- Backend: Express.js API (thu muc `backend/`)
- Database: PostgreSQL
- Monorepo scripts: root `package.json` (npm workspaces)

Cong mac dinh:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Backend Health: `http://localhost:5000/api/health`
- Swagger:
  - `http://localhost:5000/api-docs`
  - `http://localhost:5000/api-docs/admin`
  - `http://localhost:5000/api-docs/app`

## 2. Yeu cau moi truong

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 12 (neu chay local khong Docker)
- Docker + Docker Compose (neu chay dong goi container)

## 3. Cau hinh bien moi truong

### 3.1 Backend (`backend/.env`)

Tao file `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=library_tn

PORT=5000
NODE_ENV=development

JWT_SECRET=replace_me_in_production
JWT_EXPIRES_IN=7d

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM="Thu vien TN" <noreply@example.com>
```

### 3.2 Frontend (`frontend/.env.local`)

Tao file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
API_THUVIEN_TN_URL=http://localhost:5000
NEXT_PUBLIC_API_THUVIEN_TN_URL=http://localhost:5000
```

### 3.3 Docker Compose root (`.env` tai thu muc goc)

Tao file `.env` tai root de `docker-compose.yml` doc bien:

```env
DB_NAME=library_tn
DB_USER=postgres
DB_PASSWORD=strong_password_here
DB_PORT=5432

BACKEND_PORT=5000
FRONTEND_PORT=3000

JWT_SECRET=replace_me_in_production
JWT_EXPIRES_IN=7d

NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
API_THUVIEN_TN_URL=http://localhost:5000
NEXT_PUBLIC_API_THUVIEN_TN_URL=http://localhost:5000
```

## 4. Chay he thong local (khong Docker)

### 4.1 Cai dependency

```bash
npm install
```

### 4.2 Setup database

```bash
npm run setup
```

### 4.3 Chay development

```bash
npm run dev
```

Hoac chay rieng:

```bash
npm run dev:backend
npm run dev:frontend
```

## 5. Cach su dung nhanh he thong Admin

1. Mo `http://localhost:3000/admin/login`
2. Dang nhap tai khoan admin
3. Vao cac module:
   - Dashboard
   - Kho an pham
   - Ban doc va dich vu
   - Truyen thong va app
   - Quan tri he thong
4. Kiem tra API docs o backend Swagger de doi chieu payload

## 6. Quy trinh kiem tra truoc release

Du an da co bo script pre-release an toan build:

- `npm run check:backend`: syntax check backend JS
- `npm run check:frontend`: typecheck frontend
- `npm run check`: chay ca backend + frontend checks
- `npm run build:ready`: check + build toan he thong

Lenh khuyen nghi truoc push/deploy:

```bash
npm run build:ready
```

Neu lenh nay pass, kha nang deploy production se on dinh hon rat nhieu.

## 7. Chay bang Docker (local/prod-like)

### 7.1 Build va up container

```bash
docker compose up -d --build
```

Neu dung plugin cu:

```bash
docker-compose up -d --build
```

### 7.2 Kiem tra trang thai

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

### 7.3 Tat he thong

```bash
docker compose down
```

## 8. Deploy len VPS (khuyen nghi Docker Compose)

### 8.1 Chuan bi VPS

- Ubuntu 22.04 LTS (khuyen nghi)
- Mo firewall:
  - `22` (SSH)
  - `80` (HTTP)
  - `443` (HTTPS)

Cai Docker + Compose plugin.

### 8.2 Trien khai code

```bash
git clone <repo_url>
cd admin-thuvien-tn
npm install
```

Tao cac file env:

- `.env` (root)
- `backend/.env` (neu backend can doc them)
- `frontend/.env.local` (neu build frontend can doc)

### 8.3 Build va chay

```bash
npm run build:ready
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 8.4 Kiem tra sau deploy

```bash
curl -I http://<VPS_IP>:3000
curl http://<VPS_IP>:5000/api/health
```

## 9. Tro domain va SSL

Kich ban khuyen nghi: 1 domain cho frontend, backend di qua path `/api` cung domain.

- Vi du domain: `library.example.com`
- Nginx reverse proxy:
  - `/` -> frontend container `localhost:3000`
  - `/api` + `/api-docs` -> backend container `localhost:5000`

Vi du Nginx block:

```nginx
server {
    listen 80;
    server_name library.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api-docs {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Cap SSL Let us Encrypt:

```bash
sudo certbot --nginx -d library.example.com
```

Sau khi co SSL, cap nhat bien frontend:

```env
NEXT_PUBLIC_API_URL=https://library.example.com
NEXT_PUBLIC_BACKEND_URL=https://library.example.com
```

## 10. Van hanh va bao tri

### 10.1 Lenh van hanh thuong dung

```bash
# Xem logs
docker compose logs -f

# Restart service
docker compose restart backend
docker compose restart frontend

# Pull code moi va redeploy
git pull
npm install
npm run build:ready
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 10.2 Sao luu database

```bash
docker exec -t thuvien_tn_postgres pg_dump -U postgres -d library_tn > backup.sql
```

Restore:

```bash
cat backup.sql | docker exec -i thuvien_tn_postgres psql -U postgres -d library_tn
```

## 11. Checklist release

Truoc khi deploy production:

1. `npm run build:ready` pass
2. Kiem tra `.env` khong de secret mac dinh
3. Kiem tra ket noi DB va `/api/health`
4. Kiem tra login admin va cac trang chinh trong `/admin`
5. Kiem tra route Swagger co mo duoc
6. Kiem tra upload thu muc `backend/uploads` co mounted dung (neu dung Docker)

## 12. Luu y quan trong hien tai

- `docker-compose.yml` dang healthcheck frontend vao `/api/health` tren cong 3000.
- Trong frontend hien khong co route health API rieng o `/api/health`.
- Neu can healthcheck frontend chinh xac, co the doi sang endpoint ton tai (vi du `/admin/login`) hoac tao route health trong frontend sau.

Vi du sua healthcheck frontend:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/admin/login"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

Neu ban can, co the tach tiep 2 tai lieu rieng:

- `RUNBOOK_PRODUCTION.md` (van hanh su co production)
- `DEPLOYMENT_CHECKLIST_STRICT.md` (checklist release chat che theo tung buoc)
