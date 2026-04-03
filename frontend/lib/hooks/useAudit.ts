import { useQuery } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

const auditApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/audit?${query}`);
  },
};

export function useAuditLogs(params?: any) {
  return useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () => auditApi.getAll(params),
  });
}
