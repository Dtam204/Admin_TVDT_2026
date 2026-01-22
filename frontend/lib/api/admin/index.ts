/**
 * Admin API Services
 * Centralized exports for admin API functionality
 */

export { adminApiCall, uploadImage, uploadFile, uploadFiles } from "./client";
export { AdminEndpoints } from "./endpoints";

// Re-export for backward compatibility
export { AdminEndpoints as API_ENDPOINTS } from "./endpoints";
export { adminApiCall as apiCall } from "./client";

