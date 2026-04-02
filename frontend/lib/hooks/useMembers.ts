/**
 * React Query Hooks - Members Module
 * Phase 1 MVP - Auto-generated
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

// ============================================================================
// API CLIENT
// ============================================================================

const membersApi = {
  getAll: async (params?: any) => {
    // Loại bỏ các trường undefined để tránh gửi status=undefined lên server
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          cleanParams[k] = String(v);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return adminApiCall(`/api/admin/members?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/members/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/members/${id}`, {
      method: 'DELETE',
    });
  },

  // Renewal Requests (Admin)
  getRequests: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/membership-requests?${query}`);
  },

  approveRequest: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/membership-requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  rejectRequest: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/membership-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Reader methods (Could also be in a separate readerApi object)
  submitRenewalRequest: async (data: any) => {
    return adminApiCall(`/api/admin/membership-requests/reader-submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Member Actions (Logs, Transactions, Security)
  getActivities: async (id: number) => {
    return adminApiCall(`/api/admin/member-actions/${id}/activities`);
  },

  getTransactions: async (id: number) => {
    return adminApiCall(`/api/admin/member-actions/${id}/transactions`);
  },

  deposit: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/member-actions/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resetPassword: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/member-actions/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getStats: async () => {
    return adminApiCall('/api/admin/members/dashboard-stats');
  },

  upgrade: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/members/${id}/upgrade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export function useMemberStats() {
  return useQuery({
    queryKey: ['members-stats'],
    queryFn: () => membersApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useMembers(params?: any) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => membersApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useMember(id: number) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => membersApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => membersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateMember(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => membersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['members', id] });
      queryClient.invalidateQueries({ queryKey: ['member-activities', id] });
      queryClient.invalidateQueries({ queryKey: ['member-transactions', id] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => membersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

// Renewal Requests Hooks
export function useMembershipRequests(params?: any) {
  return useQuery({
    queryKey: ['membership-requests', params],
    queryFn: () => membersApi.getRequests(params),
    staleTime: 30 * 1000, // Faster refresh for live requests
  });
}

export function useApproveRenewal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      membersApi.approveRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-requests'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useRejectRenewal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      membersApi.rejectRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-requests'] });
    },
  });
}

// Member Actions Hooks (Phase 1.6)
export function useMemberActivities(id: number) {
  return useQuery({
    queryKey: ['member-activities', id],
    queryFn: () => membersApi.getActivities(id),
    enabled: !!id,
  });
}

export function useMemberTransactions(id: number) {
  return useQuery({
    queryKey: ['member-transactions', id],
    queryFn: () => membersApi.getTransactions(id),
    enabled: !!id,
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      membersApi.deposit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['member-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['members', id] });
      queryClient.invalidateQueries({ queryKey: ['member-activities', id] });
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      membersApi.resetPassword(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['member-activities', id] });
    },
  });
}

export function useReaderSubmitRenewal() {
  return useMutation({
    mutationFn: (data: any) => membersApi.submitRenewalRequest(data),
  });
}

export function useUpgradeMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      membersApi.upgrade(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['members', id] });
      queryClient.invalidateQueries({ queryKey: ['member-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['member-activities', id] });
      queryClient.invalidateQueries({ queryKey: ['members-stats'] });
    },
  });
}
