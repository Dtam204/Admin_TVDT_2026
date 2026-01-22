/**
 * Admin API Client
 * Handles authenticated API calls for admin section
 */

import { getAuthToken, removeAuthToken } from "@/lib/auth/token";
import { buildUrl, parseErrorResponse } from "../base";

/**
 * Get headers with Authorization bearer token for admin APIs
 */
function getAdminHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...additionalHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Make an authenticated API call for admin section
 * Automatically handles 401 Unauthorized by redirecting to login
 */
export async function adminApiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  const response = await fetch(url, {
    ...options,
    // Force fresh data for GET requests to avoid 304 issues
    cache: options.method === 'GET' ? 'no-cache' : options.cache,
    headers: {
      ...getAdminHeaders(),
      ...(options.headers || {}),
    },
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    removeAuthToken();
    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  // Handle 304 Not Modified - response has no body, return null or cached data
  if (response.status === 304) {
    // For 304, we can't parse JSON, so return null
    // The component should handle this case
    return null as T;
  }

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  // Check if response has content to parse
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await response.text();
    if (text) {
      return JSON.parse(text);
    }
  }

  // If no content, return null
  return null as T;
}

/**
 * Upload an image file
 * Returns the URL of the uploaded image
 */
export async function uploadImage(file: File): Promise<string> {
  const token = getAuthToken();
  const formData = new FormData();
  // Backend multer đang dùng upload.single('file') nên field phải là 'file'
  formData.append('file', file);

  const url = buildUrl('/api/admin/upload/image');
  
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData, browser will set it with boundary

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  const result = await response.json();
  // Return full URL if it's a relative path
  const imageUrl = result.data?.url || result.url;
  if (imageUrl && imageUrl.startsWith('/')) {
    return buildUrl(imageUrl);
  }
  return imageUrl;
}

/**
 * Upload a file to media library
 * Returns the uploaded file data
 */
export async function uploadFile(file: File, folderId?: number): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();
  // Quan trọng: append folder_id TRƯỚC file để multer đọc được trong destination()
  if (folderId !== undefined) {
    formData.append('folder_id', folderId.toString());
  }
  formData.append('file', file);

  const url = buildUrl('/api/admin/upload/file');
  
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Upload multiple files to media library
 */
export async function uploadFiles(files: File[], folderId?: number): Promise<any[]> {
  const token = getAuthToken();
  const formData = new FormData();
  // Quan trọng: append folder_id TRƯỚC files để multer đọc được trong destination()
  if (folderId !== undefined) {
    formData.append('folder_id', folderId.toString());
  }
  files.forEach(file => {
    formData.append('files', file);
  });

  const url = buildUrl('/api/admin/upload/files');
  
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.data;
}

