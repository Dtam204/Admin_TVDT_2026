import { adminApiCall } from './admin';

type Locale = 'vi' | 'en' | 'ja';

export interface SeoPageData {
  id?: number;
  page_path: string;
  page_type?: string;
  title?: string | Record<Locale, string>;
  description?: string | Record<Locale, string>;
  keywords?: string | Record<Locale, string>;
  image?: string;
  og_title?: string | Record<Locale, string>;
  og_description?: string | Record<Locale, string>;
  og_image?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string | Record<Locale, string>;
  twitter_description?: string | Record<Locale, string>;
  twitter_image?: string;
  canonical_url?: string;
  robots_index?: boolean;
  robots_follow?: boolean;
  robots_noarchive?: boolean;
  robots_nosnippet?: boolean;
  structured_data?: any;
}

/**
 * Get all SEO pages
 */
export async function getSeoPages(): Promise<SeoPageData[]> {
  const response = await adminApiCall<{ data: SeoPageData[] }>('/api/admin/seo');
  return response.data || [];
}

/**
 * Get SEO page by path
 */
export async function getSeoPageByPath(path: string): Promise<SeoPageData | null> {
  try {
    // Xử lý đặc biệt cho path '/' - dùng query parameter
    let endpoint: string;
    if (path === '/') {
      endpoint = '/api/admin/seo?path=%2F';
    } else {
      const encodedPath = encodeURIComponent(path);
      endpoint = `/api/admin/seo/${encodedPath}`;
    }
    
    const response = await adminApiCall<{ data: SeoPageData }>(endpoint);
    return response.data || null;
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Update or create SEO page
 */
export async function updateSeoPage(path: string, data: Partial<SeoPageData>): Promise<SeoPageData> {
  // Xử lý đặc biệt cho path '/' - dùng query parameter
  let endpoint: string;
  if (path === '/') {
    endpoint = '/api/admin/seo?path=%2F';
  } else {
    const encodedPath = encodeURIComponent(path);
    endpoint = `/api/admin/seo/${encodedPath}`;
  }
  
  const response = await adminApiCall<{ data: SeoPageData }>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}


