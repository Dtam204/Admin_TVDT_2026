# 🔧 FIX LỖI 401 UNAUTHORIZED

## ❌ Lỗi hiện tại

```
GET http://localhost:5000/api/admin/books
Status: 401 Unauthorized
```

**Nguyên nhân:** Chưa đăng nhập hoặc token đã hết hạn!

---

## ✅ GIẢI PHÁP

### **Bước 1: Đảm bảo database đã setup**

```bash
cd backend
npm run setup
```

**Lưu ý:** Admin user (`admin@gmail.com` / `admin123`) đã được tự động tạo trong `schema.sql`.

---

### **Bước 2: Đăng nhập**

1. Mở: http://localhost:3000/admin/login
2. **Clear cookies** nếu cần (Ctrl + Shift + Delete → Cookies)
3. **Login:**
   - Email: `admin@gmail.com`
   - Password: `admin123`

---

## ✅ TEST

Sau khi login thành công:
- ✅ Click "Tất cả sách" → Thấy danh sách sách
- ✅ Click "Tác giả" → Thấy danh sách tác giả
- ✅ Click "Tất cả khóa học" → Thấy danh sách khóa học
- ✅ **Không còn lỗi 401!** 🎉

---

## 📝 TÓM TẮT

**Vấn đề:** Chưa đăng nhập hoặc token đã hết hạn.

**Giải pháp:** 
- Admin user đã được seed tự động trong `schema.sql` khi chạy `npm run setup`
- Chỉ cần đăng nhập với `admin@gmail.com` / `admin123`

**Commands:**
```bash
cd backend
npm run setup    # Setup database (bao gồm admin user)
# Sau đó login trên browser
```

**🚀 Admin user đã được tạo tự động, chỉ cần login!**
