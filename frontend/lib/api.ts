/**
 * @deprecated This file is kept for backward compatibility.
 * Please use the new structure:
 * - For admin APIs: import { adminApiCall, AdminEndpoints } from "@/lib/api/admin"
 * - For auth: import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/auth/token"
 * 
 * Note: Public APIs have been removed as this is now admin-only.
 * This file will be removed in a future version.
 */

// Re-export from new structure for backward compatibility
export {
  adminApiCall as apiCall,
  AdminEndpoints as API_ENDPOINTS,
} from "./api/admin";

export {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
} from "./auth/token";

