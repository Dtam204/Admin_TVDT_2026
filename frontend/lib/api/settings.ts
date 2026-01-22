import { adminApiCall } from './admin/client';
// Public API removed - admin only
// import { publicApiCall } from './public/client';

export interface SiteSettings {
  [key: string]: {
    value: string;
    type?: string;
    description?: string;
    category?: string;
  };
}

/**
 * Get all settings (admin only)
 */
export async function getSettings(category?: string): Promise<SiteSettings> {
  const response = await adminApiCall<{ data: SiteSettings }>(
    `/api/admin/settings${category ? `?category=${category}` : ''}`
  );
  return response.data;
}

/**
 * Get a single setting by key (admin only)
 */
export async function getSettingByKey(key: string): Promise<{ key: string; value: string; type?: string; description?: string; category?: string }> {
  const response = await adminApiCall<{ data: { key: string; value: string; type?: string; description?: string; category?: string } }>(
    `/api/admin/settings/${key}`
  );
  return response.data;
}

/**
 * Update multiple settings (admin only)
 */
export async function updateSettings(settings: Record<string, string>): Promise<void> {
  await adminApiCall('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

/**
 * Update a single setting (admin only)
 */
export async function updateSetting(key: string, value: string, type?: string, description?: string, category?: string): Promise<void> {
  await adminApiCall(`/api/admin/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value, type, description, category }),
  });
}

// Public API removed - admin only
// export async function getPublicSettings(keys?: string, locale?: 'vi' | 'en' | 'ja'): Promise<PublicSettings> {
//   const url = keys 
//     ? `/api/public/settings?keys=${encodeURIComponent(keys)}`
//     : `/api/public/settings`;
//   
//   const response = await publicApiCall<{ data: PublicSettings }>(url, {}, locale);
//   return response.data;
// }

