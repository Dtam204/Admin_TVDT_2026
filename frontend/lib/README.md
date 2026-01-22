# API & Auth Library Structure - Admin Only

## Overview

This library provides API client and authentication utilities for the admin panel.

## Structure

```
lib/
├── auth/
│   └── token.ts          # JWT token management
├── api/
│   ├── base.ts           # Base utilities (URL building, error parsing)
│   ├── admin/            # Admin APIs (requires JWT authentication)
│   │   ├── client.ts     # Authenticated API client
│   │   ├── endpoints.ts  # Admin endpoint definitions
│   │   └── index.ts      # Admin exports
│   ├── seo.ts            # SEO API (admin only)
│   ├── settings.ts       # Settings API (admin only)
│   └── index.ts          # Main API exports
├── hooks/
│   └── useTranslationControls.ts  # AI translation hook
├── utils/
│   ├── i18n.ts               # Internationalization utilities
│   ├── locale-admin.ts       # Locale helpers for admin
│   └── translation-helpers.ts # Translation helpers
├── date.ts               # Date utilities
├── placeholders.ts       # Placeholder constants
└── api.ts                # Legacy file (backward compatibility)
```

## Usage

### Admin APIs (Authenticated)

```typescript
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";

// Fetch news list
const response = await adminApiCall<{ data: NewsItem[] }>(
  AdminEndpoints.news.list
);

// Create news
await adminApiCall(AdminEndpoints.news.create, {
  method: "POST",
  body: JSON.stringify(newsData),
});

// Update news
await adminApiCall(AdminEndpoints.news.update(id), {
  method: "PUT",
  body: JSON.stringify(updatedData),
});

// Delete news
await adminApiCall(AdminEndpoints.news.delete(id), {
  method: "DELETE",
});
```

### Auth Utilities

```typescript
import { 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken, 
  isAuthenticated 
} from "@/lib/auth/token";

// Check if user is authenticated
if (isAuthenticated()) {
  // User is logged in
}

// Get current token
const token = getAuthToken();

// Save token (after login)
setAuthToken(token);

// Remove token (on logout)
removeAuthToken();
```

### Settings API

```typescript
import { 
  getSettings, 
  getSettingByKey, 
  updateSettings, 
  updateSetting 
} from "@/lib/api/settings";

// Get all settings
const settings = await getSettings();

// Get specific setting
const setting = await getSettingByKey('site_name');

// Update multiple settings
await updateSettings({
  site_name: 'New Name',
  site_description: 'New Description',
});

// Update single setting
await updateSetting('site_name', 'New Name');
```

### SEO API

```typescript
import { 
  getSeoPages, 
  getSeoPageByPath, 
  updateSeoPage 
} from "@/lib/api/seo";

// Get all SEO pages
const pages = await getSeoPages();

// Get SEO for specific page
const seo = await getSeoPageByPath('/products');

// Update SEO data
await updateSeoPage('/products', {
  title: { vi: 'Sản phẩm', en: 'Products', ja: '製品' },
  description: { vi: 'Mô tả...', en: 'Description...', ja: '説明...' },
});
```

### Internationalization Utilities

```typescript
import { 
  getLocalizedText, 
  applyLocale,
  isLocaleObject 
} from "@/lib/utils/i18n";

// Get text in specific locale
const text = getLocalizedText(data.title, 'vi');

// Apply locale to entire object
const localizedData = applyLocale(data, 'en');

// Check if value is locale object
if (isLocaleObject(value)) {
  // value is { vi: '...', en: '...', ja: '...' }
}
```

### Translation Hook

```typescript
import { useTranslationControls } from "@/lib/hooks/useTranslationControls";

const {
  handleTranslate,
  isTranslating,
  selectedProvider,
  setSelectedProvider
} = useTranslationControls();

// Translate from vi to en
await handleTranslate('vi', 'en', sourceText, (translated) => {
  setData({ ...data, title: { ...data.title, en: translated } });
});
```

## Features

### Admin API Client

- ✅ Automatically adds `Authorization: Bearer <token>` header
- ✅ Handles 401 Unauthorized by redirecting to login
- ✅ Centralized error handling
- ✅ Type-safe endpoints
- ✅ Supports all HTTP methods (GET, POST, PUT, DELETE)

### Auth Utilities

- ✅ Cookie-based token storage (`cms_thuvien_tn_token`)
- ✅ Safe storage access (handles SSR)
- ✅ Error handling for storage operations
- ✅ Simple authentication checks

### Date Utilities

```typescript
import { parseDate, formatDateVN, formatDateForInput, generateSlug } from "@/lib/date";

// Parse date from API
const date = parseDate("2024-01-05T00:00:00.000Z");

// Format for display (Vietnamese)
const formatted = formatDateVN("2024-01-05"); // "05 tháng 1, 2024"

// Format for input[type="date"]
const inputValue = formatDateForInput("2024-01-05"); // "2024-01-05"

// Generate slug from Vietnamese text
const slug = generateSlug("Tiêu đề bài viết"); // "tieu-de-bai-viet"
```

## Migration Notes

- **Public APIs have been removed** - This is now an admin-only system
- All API calls require authentication (Bearer token)
- Token is managed automatically by the API client
- See `API_MIGRATION.md` for detailed migration guide

## Environment Variables

Required in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
API_THUVIEN_TN_URL=http://localhost:5000
NEXT_PUBLIC_API_THUVIEN_TN_URL=http://localhost:5000
```
