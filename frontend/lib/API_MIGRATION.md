# API Migration Guide - Admin Only

## Overview

The API structure has been refactored for admin-only operations. Public APIs have been removed.

## Current Structure

```
frontend/lib/
├── auth/
│   └── token.ts          # Token management utilities
├── api/
│   ├── base.ts           # Base API utilities
│   ├── admin/
│   │   ├── client.ts     # Admin API client (authenticated)
│   │   ├── endpoints.ts  # Admin endpoints
│   │   └── index.ts      # Admin exports
│   ├── settings.ts       # Settings API (admin only)
│   └── index.ts          # Main API exports
└── api.ts                # Legacy file (backward compatibility)
```

## Usage

### Admin APIs (Requires Authentication)

```typescript
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";

// GET request
const response = await adminApiCall<{ data: NewsItem[] }>(
  AdminEndpoints.news.list
);

// POST request
const response = await adminApiCall(
  AdminEndpoints.news.create,
  {
    method: 'POST',
    body: JSON.stringify(formData),
  }
);

// PUT request
const response = await adminApiCall(
  AdminEndpoints.news.update(id),
  {
    method: 'PUT',
    body: JSON.stringify(formData),
  }
);

// DELETE request
const response = await adminApiCall(
  AdminEndpoints.news.delete(id),
  {
    method: 'DELETE',
  }
);
```

### Auth Utilities

```typescript
import { 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken, 
  isAuthenticated 
} from "@/lib/auth/token";

// Check authentication
if (isAuthenticated()) {
  const token = getAuthToken();
  // Use token...
}

// Save token after login
setAuthToken(response.token);

// Logout
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

## Available Endpoints

See `lib/api/admin/endpoints.ts` for complete list:

- **Auth**: `/api/auth/login`, `/api/auth/logout`
- **Dashboard**: `/api/dashboard/stats`
- **Users**: `/api/admin/users/*`
- **Roles**: `/api/admin/roles/*`
- **Permissions**: `/api/admin/permissions/*`
- **News**: `/api/admin/news/*`
- **Categories**: `/api/admin/categories/*`
- **Products**: `/api/admin/products/*`
- **Industries**: `/api/admin/industries/*`
- **About**: `/api/admin/about/*`
- **Careers**: `/api/admin/careers/*`
- **Homepage**: `/api/admin/homepage/*`
- **Contact**: `/api/admin/contact/*`
- **Menus**: `/api/admin/menus/*`
- **Media**: `/api/admin/media/*`
- **SEO**: `/api/admin/seo/*`
- **Settings**: `/api/admin/settings/*`
- **Translation**: `/api/admin/translate/*`

## Error Handling

```typescript
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";

try {
  const response = await adminApiCall(endpoint, options);
  if (response.success) {
    toast.success("Operation successful!");
  }
} catch (error: any) {
  toast.error(error.message || "An error occurred");
  console.error("API Error:", error);
}
```

## Type Safety

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  published: boolean;
}

// Typed API call
const response = await adminApiCall<ApiResponse<NewsItem[]>>(
  AdminEndpoints.news.list
);

if (response.success && response.data) {
  const news: NewsItem[] = response.data;
  // TypeScript knows the type of news
}
```

## Migration Notes

- **Public APIs have been removed** - This is now an admin-only system
- All API calls require authentication (Bearer token in header)
- Token is stored in cookie `cms_thuvien_tn_token` and managed by `lib/auth/token.ts`
- Base API URL is configured via environment variables

## Environment Variables

Required in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
API_THUVIEN_TN_URL=http://localhost:5000
NEXT_PUBLIC_API_THUVIEN_TN_URL=http://localhost:5000
```
