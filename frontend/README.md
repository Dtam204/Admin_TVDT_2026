# Library Admin Panel - Next.js Frontend

Admin Panel cho hệ thống quản lý thư viện, được xây dựng với Next.js App Router và TypeScript.

---

## 1. Công nghệ chính

- **Next.js 16 – App Router** (`app/` directory) với **Server-Side Rendering (SSR)**
- **React 18**, **TypeScript**
- **Tailwind v4** + Shadcn/UI components
- **lucide-react**: Icon library
- **React Hook Form**: Form handling
- **Sonner**: Toast notifications
- **Recharts**: Data visualization

---

## 2. Cấu trúc thư mục

### Frontend Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Route group cho admin
│   │   └── admin/                # Admin pages
│   │       ├── layout.tsx        # Admin layout
│   │       ├── page.tsx          # Dashboard
│   │       ├── about/            # Quản lý About page
│   │       ├── careers/          # Quản lý Careers
│   │       ├── categories/       # Quản lý News Categories
│   │       ├── contact/          # Quản lý Contact page
│   │       ├── contact-requests/ # Xem requests từ form
│   │       ├── home/             # Quản lý Homepage
│   │       ├── industries/       # Quản lý Industries
│   │       ├── media/            # Media Library
│   │       ├── menus/            # Quản lý Menus
│   │       ├── news/             # Quản lý News
│   │       ├── permissions/      # Quản lý Permissions
│   │       ├── products/         # Quản lý Products
│   │       ├── roles/            # Quản lý Roles
│   │       ├── seo/              # Quản lý SEO
│   │       ├── settings/         # Site Settings
│   │       └── users/            # Quản lý Users
│   ├── admin/                    # Admin login
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   ├── api/                      # API routes (proxy)
│   │   └── admin/
│   │       ├── login/route.ts
│   │       └── logout/route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root page (redirect to /admin/login)
│   ├── globals.css               # Global styles
│   └── robots.ts                 # Robots.txt (disallow all)
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   │   ├── AIProviderSelector.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── LocaleInput.tsx
│   │   ├── MediaUpload.tsx
│   │   ├── ProductWidgets/       # Product form widgets
│   │   ├── RichTextEditor.tsx
│   │   └── TranslationControls.tsx
│   ├── common/                   # Common components
│   │   ├── CustomPagination.tsx
│   │   └── ScrollToTop.tsx
│   └── ui/                       # Shadcn/UI components
│
├── lib/                          # Utilities
│   ├── api/                      # API clients
│   │   ├── admin/                # Admin API
│   │   │   ├── client.ts
│   │   │   ├── endpoints.ts
│   │   │   └── index.ts
│   │   ├── base.ts               # Base API utilities
│   │   ├── index.ts
│   │   └── settings.ts           # Settings API
│   ├── auth/                     # Authentication
│   │   └── token.ts
│   ├── hooks/                    # Custom hooks
│   │   └── useTranslationControls.ts
│   ├── utils/                    # Utilities
│   │   ├── i18n.ts               # Internationalization
│   │   ├── locale-admin.ts       # Locale helpers for admin
│   │   └── translation-helpers.ts
│   └── placeholders.ts           # Placeholder constants
│
├── styles/                       # CSS files
│   ├── admin-about-company.css
│   ├── admin-about-hero.css
│   ├── animations.css
│   ├── color-system.css
│   ├── globals.css
│   ├── style.css
│   └── styles_admin.css
│
├── public/                       # Static files
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## 3. Cách cài đặt & chạy dự án

### Yêu cầu:
- Node.js >= 18
- npm >= 9

### 3.1. Cài dependencies

Tại thư mục root của project (workspace):

```bash
npm install
```

Hoặc chỉ cài cho frontend:

```bash
cd frontend
npm install
```

### 3.2. Cấu hình Environment

Tạo file `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
API_SFB_URL=http://localhost:5000
NEXT_PUBLIC_API_SFB_URL=http://localhost:5000
```

### 3.3. Chạy dev server

```bash
npm run dev
```

Admin panel sẽ chạy tại `http://localhost:3000/admin/login`

### 3.4. Build production

```bash
npm run build
npm run start
```

---

## 4. Admin Routes

### Public Routes (không cần auth):
- `/` - Redirect to `/admin/login`
- `/admin/login` - Đăng nhập admin

### Protected Routes (cần authentication):
- `/admin` - Dashboard
- `/admin/users` - Quản lý users
- `/admin/roles` - Quản lý roles
- `/admin/permissions` - Quản lý permissions
- `/admin/news` - Quản lý tin tức
- `/admin/categories` - Quản lý danh mục tin
- `/admin/products` - Quản lý sản phẩm
- `/admin/media` - Media library
- `/admin/menus` - Quản lý menus
- `/admin/home` - Quản lý homepage
- `/admin/about` - Quản lý about page
- `/admin/industries` - Quản lý industries
- `/admin/careers` - Quản lý careers
- `/admin/contact` - Quản lý contact page
- `/admin/contact-requests` - Xem yêu cầu liên hệ
- `/admin/seo` - Quản lý SEO
- `/admin/settings` - Site settings

---

## 5. Authentication

### Cookie-based Auth:
- Token được lưu trong cookie `cms_sfb_token`
- Tất cả admin routes được bảo vệ bởi authentication logic trong pages
- Redirect tự động về `/admin/login` nếu chưa đăng nhập

### API Authentication:
- Sử dụng Bearer token trong header
- Token được quản lý bởi `lib/auth/token.ts`

---

## 6. API Integration

### Admin API Client

```typescript
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";

// GET request
const response = await adminApiCall(AdminEndpoints.news.list);

// POST request
const response = await adminApiCall(AdminEndpoints.news.create, {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### Endpoints

Tất cả endpoints được định nghĩa trong `lib/api/admin/endpoints.ts`:
- `/api/admin/users`
- `/api/admin/roles`
- `/api/admin/permissions`
- `/api/admin/news`
- `/api/admin/products`
- `/api/admin/media/*`
- và nhiều endpoints khác...

---

## 7. Đa ngôn ngữ (i18n)

Admin panel hỗ trợ quản lý nội dung đa ngôn ngữ (vi/en/ja):

### Sử dụng LocaleInput component:

```tsx
import { LocaleInput } from "@/components/admin/LocaleInput";

<LocaleInput
  label="Tiêu đề"
  value={data.title}
  onChange={(value) => setData({ ...data, title: value })}
  locale={locale}
  type="text"
/>
```

### Utility functions:

```typescript
import { getLocalizedText, applyLocale } from "@/lib/utils/i18n";

// Lấy text theo locale
const text = getLocalizedText(field, 'vi');

// Apply locale cho toàn bộ object
const localizedData = applyLocale(data, 'vi');
```

---

## 8. Media Library

### ImageUpload Component:

```tsx
import ImageUpload from "@/components/admin/ImageUpload";

<ImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  label="Hình ảnh"
/>
```

### MediaUpload Component (multiple files):

```tsx
import { MediaUpload } from "@/components/admin/MediaUpload";

<MediaUpload
  value={images}
  onChange={(files) => setImages(files)}
  multiple={true}
  maxFiles={5}
/>
```

---

## 9. Translation Controls

Tự động dịch nội dung với AI:

```tsx
import { useTranslationControls } from "@/lib/hooks/useTranslationControls";

const {
  handleTranslate,
  isTranslating,
  selectedProvider,
  setSelectedProvider
} = useTranslationControls();

// Dịch field
await handleTranslate('vi', 'en', data.title, (translated) => {
  setData({ ...data, title: { ...data.title, en: translated } });
});
```

---

## 10. UI Components

### Shadcn/UI Components trong `components/ui/`:

- `button`, `input`, `textarea`, `select` - Form elements
- `card`, `table`, `tabs` - Layout components
- `dialog`, `sheet`, `drawer` - Overlays
- `toast` (sonner) - Notifications
- `form` - Form wrapper with validation
- và nhiều components khác...

### Usage:

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

<Button onClick={() => toast.success("Saved!")}>
  Save
</Button>
```

---

## 11. Development Guidelines

### Code Style:
- TypeScript strict mode
- Prettier formatting (if configured)
- ESLint rules from Next.js

### Component Guidelines:
- **Server Components First**: Mặc định dùng Server Components
- **Client Components**: Chỉ khi cần state, effects, hoặc browser APIs
- **Named Exports**: Ưu tiên named exports cho components
- **File Naming**: PascalCase cho components, kebab-case cho routes

### Best Practices:
- Tách logic phức tạp ra hooks
- Sử dụng TypeScript interfaces cho data types
- Error handling với try/catch
- Loading states cho async operations
- Validation trước khi submit forms

---

## 12. Lệnh npm

```bash
# Development
npm run dev          # Chạy dev server

# Production
npm run build        # Build production
npm run start        # Chạy production server

# Linting
npm run lint         # Chạy ESLint
```

---

## 13. Troubleshooting

### Port already in use:
```bash
# Đổi port trong package.json hoặc chạy với port khác:
PORT=3001 npm run dev
```

### Build errors:
```bash
# Clear cache và rebuild:
rm -rf .next
npm run build
```

### API connection issues:
- Kiểm tra backend đang chạy tại port 5000
- Kiểm tra NEXT_PUBLIC_API_URL trong `.env.local`

---

## 14. Tài khoản mặc định

Sau khi setup backend:
- Email: `admin@sfb.local`
- Password: `admin123`

**⚠️ Nhớ đổi password sau khi đăng nhập lần đầu!**

---

Để biết thêm chi tiết về backend API, xem `../backend/README.md`
