/**
 * JWT Token Management
 * Handles token storage and retrieval from localStorage
 */

const TOKEN_STORAGE_KEY = "cms_thuvien_tn_jwt_token";

/**
 * Get JWT token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Save JWT token to localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Remove JWT token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

