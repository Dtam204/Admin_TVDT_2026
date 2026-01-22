/**
 * Base API utilities
 * Common functions for both admin and public API calls
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_THUVIEN_TN_URL ||
  "http://localhost:5000";

export { API_BASE_URL };

/**
 * Build full URL from endpoint
 */
export function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http")) return endpoint;

  // Public API proxy removed - admin only
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Parse error response
 */
export async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData?.message || errorData?.error || response.statusText;
  } catch {
    return response.statusText || "Unknown error";
  }
}

/**
 * Base fetch wrapper with common error handling
 */
export async function baseFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

