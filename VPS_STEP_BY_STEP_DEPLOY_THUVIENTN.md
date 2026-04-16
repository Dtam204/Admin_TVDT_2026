# VPS Deploy Step-by-Step (Handhold)

## 0) Preconditions
- DNS da co 3 ban ghi A:
  - @ -> 160.187.247.41
  - www -> 160.187.247.41
  - api -> 160.187.247.41
- Ban dang dung Linux VPS co quyen sudo/root.

## 1) Dien bien moi truong production
Mo file `.env` tai root project va thay cac gia tri placeholder:
- DB_PASSWORD
- GEMINI_API_KEY
- MAIL_USER
- MAIL_PASS

Kiem tra cac bien domain:
- DOMAIN=thuvientn.site
- PROTOCOL=https
- PUBLIC_BASE_URL=https://api.thuvientn.site
- NEXT_PUBLIC_API_URL=https://api.thuvientn.site

## 2) SSH vao VPS
```bash
ssh root@160.187.247.41
```

## 3) Cap nhat code
```bash
cd /duong-dan-project
git pull
```

## 4) Chay Docker Compose production
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Neu ban dang cap nhat lai DB password hoac muon lam sach toan bo du lieu cu, hay xoa volume truoc khi len lai:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

## 5) Kiem tra trang thai container
```bash
docker ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Neu co loi:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=200
```

## 6) Cai Nginx va apply config
```bash
apt update
apt install -y nginx
```

Copy file `ops/nginx/thuvientn.site.conf` len VPS va dat vao:
- /etc/nginx/sites-available/thuvientn

Bat site:
```bash
ln -s /etc/nginx/sites-available/thuvientn /etc/nginx/sites-enabled/thuvientn
nginx -t
systemctl reload nginx
```

## 7) Cai SSL cho 3 domain
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d thuvientn.site -d www.thuvientn.site -d api.thuvientn.site
```

Kiem tra auto renew:
```bash
systemctl status certbot.timer
```

## 8) Smoke test
```bash
curl -I https://thuvientn.site
curl -I https://api.thuvientn.site
curl -I https://api.thuvientn.site/api/health
curl -I -H "Range: bytes=0-1023" https://api.thuvientn.site/api/public/publications/1/pdf-file
```

Ky vong:
- Frontend mo duoc qua HTTPS.
- API domain tra 200.
- PDF range tra 206.

## 9) Checklist loi thuong gap
- 502 Bad Gateway: sai cong proxy hoac container chua chay.
- SSL cap that bai: DNS chua propagate hoan toan hoac firewall chan 80/443.
- FE van goi localhost: kiem tra lai NEXT_PUBLIC_API_URL trong `.env`, build lai frontend.
