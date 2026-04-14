import { useQuery } from "@tanstack/react-query";
import { adminApiCall } from "../api/admin/client";

export type DashboardInsightItem = {
  id: string;
  title: string;
  reason: string;
  action: string;
  severity: "high" | "medium" | "low";
};

export type DashboardAIInsights = {
  source: "gemini" | "fallback";
  overview: string;
  priorities: DashboardInsightItem[];
  opportunities: DashboardInsightItem[];
  risks: DashboardInsightItem[];
  fallbackReason?: string | null;
  generatedAt: string;
};

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

export function useDashboardAIInsights() {
  return useQuery({
    queryKey: ["admin-dashboard-ai-insights"],
    queryFn: async () => {
      const response = await adminApiCall<{ data: DashboardAIInsights }>("/api/admin/dashboard/ai-insights");
      return response?.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
