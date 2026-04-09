/**
 * Public/Reader API client for mobile-reader flows
 */

import { buildUrl, parseErrorResponse } from '@/lib/api/base';

export async function publicApiCall<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = buildUrl(endpoint);

  const headers = new Headers(options.headers || undefined);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    cache: options.method === 'GET' ? 'no-cache' : options.cache,
    headers,
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return null as T;
}
