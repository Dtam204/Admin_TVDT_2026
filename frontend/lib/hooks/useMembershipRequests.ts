import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

const membershipRequestsApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/membership-requests?${query}`);
  },
  approve: async (id: number, data: { admin_note?: string; manual_days?: number }) => {
    return adminApiCall(`/api/admin/membership-requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  reject: async (id: number, data: { admin_note?: string }) => {
    return adminApiCall(`/api/admin/membership-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export function useMembershipRequests(params?: any) {
  return useQuery({
    queryKey: ['membershipRequests', params],
    queryFn: () => membershipRequestsApi.getAll(params),
  });
}

export function useApproveMembershipRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { admin_note?: string; manual_days?: number } }) =>
      membershipRequestsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipRequests'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useRejectMembershipRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { admin_note?: string } }) =>
      membershipRequestsApi.reject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipRequests'] });
    },
  });
}
