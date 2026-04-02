import { useQuery } from "@tanstack/react-query";
import { adminApiCall } from "../api/admin/client";

/**
 * Hook lấy dữ liệu thống kê Dashboard "Chuẩn thật" từ Backend
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const response = await adminApiCall("/api/admin/dashboard/summary");
      return response.data;
    },
    // Dữ liệu thống kê không cần làm mới quá thường xuyên
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}
