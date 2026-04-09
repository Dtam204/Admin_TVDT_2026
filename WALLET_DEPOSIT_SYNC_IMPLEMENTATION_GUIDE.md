# Wallet Deposit Sync Implementation Guide

## 1. Muc tieu dong bo

Tai lieu nay mo ta luong nap tien vi theo mo hinh order-based:

- App tao lenh nap truoc (PENDING, co expires_at).
- User chuyen khoan dung ma transfer_code duy nhat.
- SePay gui webhook.
- Backend verify chu ky, chong trung lap, doi soat amount + expiry.
- Neu hop le: cong so du vi + ghi payment + chot lenh CREDITED trong mot transaction.

## 2. Cac thay doi da trien khai

### Backend API

- `POST /api/reader/wallet/deposit`
  - Tao `wallet_deposit_orders`.
  - Tra ve `deposit_id`, `transfer_code`, `expires_at`.

- `GET /api/reader/wallet/deposit/orders/:depositId`
  - Kiem tra trang thai lenh nap cua chinh user.

- `POST /api/webhooks/sepay`
  - Verify `x-sepay-signature` (HMAC SHA256) neu co `SEPAY_WEBHOOK_SECRET`.
  - Tuong thich nguoc voi `Authorization: Bearer {SEPAY_WEBHOOK_KEY}`.
  - Idempotency bang `webhook_events(provider, external_txn_id)` va `payments.external_txn_id`.
  - Match order pending theo `transfer_code/client_reference`.
  - Check expire, check amount, cap nhat order + payment + balance atomically.
  - Fallback cho cu phap legacy `NAP`, `GH`, `PHAT`.

### Database

- Them bang `wallet_deposit_orders`.
- Them bang `webhook_events`.
- Dong bo cot metadata cua `payments`:
  - `external_txn_id`, `gateway`, `payment_content`, `reference_id`, `sync_status`, `payer_info`.
- Them unique index partial:
  - `uq_payments_external_txn_not_null` tren `payments(external_txn_id)`.

### Swagger

- Cap nhat docs cho:
  - `POST /api/reader/wallet/deposit`
  - `GET /api/reader/wallet/deposit/orders/{depositId}`
  - `POST /api/webhooks/sepay`
- Bo sung schema:
  - `WalletDepositOrder`
  - `WebhookEvent`

## 3. Luong xu ly chi tiet

### Buoc 1: Tao lenh nap

1. App goi `POST /api/reader/wallet/deposit` voi `amount`.
2. Server validate amount, tao order:
   - `status = pending`
   - `transfer_code = NAP-R{memberId}-{timestamp}`
   - `expires_at = now + ORDER_EXPIRE_MINUTES`
3. App hien thi QR/chuyen khoan voi noi dung dung `transfer_code`.

### Buoc 2: Nhan webhook

1. SePay goi `POST /api/webhooks/sepay`.
2. Server verify chu ky HMAC (hoac key legacy).
3. Server insert `webhook_events`; neu conflict => duplicated.
4. Server kiem tra duplicate theo `payments.external_txn_id`.

### Buoc 3: Match order va doi soat

1. Parse reference tu content (`NAP-R...`).
2. Tim order pending (`FOR UPDATE`).
3. Check expire:
   - Het han => order `expired`, payment `failed`.
4. Check amount:
   - Lech => order `failed`, payment `failed`.
5. Neu dung:
   - Cong `members.balance`.
   - Ghi payment `wallet_deposit/completed`.
   - Cap nhat order `credited` + `matched_external_txn_id`.

### Buoc 4: Dong bo real-time

- Sau commit, server ban socket + thong bao cho reader/admin.

## 4. Bien moi truong can co

Trong file `.env` backend:

- `ORDER_EXPIRE_MINUTES=30`
- `SEPAY_WEBHOOK_SECRET=your-hmac-secret`
- `SEPAY_WEBHOOK_KEY=legacy-key-optional`

Khuyen nghi production:

- Bat `SEPAY_WEBHOOK_SECRET` va tat luong key legacy.
- Gioi han IP nguon webhook neu ha tang cho phep.

## 5. Cach migrate

### Cach 1: migrate rieng

Chay file SQL:

- `backend/upgrade_finance_v7_wallet_deposit.sql`

### Cach 2: setup moi

- `backend/database/schema.sql` da duoc dong bo san.

## 6. Kich ban test bat buoc

1. Tao lenh nap thanh cong.
2. Webhook hop le, amount dung, order con han.
3. Webhook duplicate cung `external_txn_id`.
4. Webhook den sau `expires_at`.
5. Webhook amount khong khop.
6. Webhook co content khong parse duoc.
7. Webhook signature sai.

## 7. API mau

### Tao lenh nap

```bash
curl -X POST http://localhost:5000/api/reader/wallet/deposit \
  -H "Authorization: Bearer <reader_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 120000}'
```

### Kiem tra trang thai lenh nap

```bash
curl -X GET http://localhost:5000/api/reader/wallet/deposit/orders/123 \
  -H "Authorization: Bearer <reader_access_token>"
```

## 8. Ghi chu van hanh

- Neu he thong hien tai con app cu, webhook van fallback duoc cu phap `NAP {memberId}`, `GH`, `PHAT`.
- Khi app mobile da cap nhat, uu tien hoan toan cu phap moi `NAP-R...` de doi soat chinh xac.
- Nen them cron job quet order `pending` qua han va mark `expired` dinh ky.
