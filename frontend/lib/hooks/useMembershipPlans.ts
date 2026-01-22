/**
 * React Query Hooks - MembershipPlans Module
 * Phase 1 MVP - Auto-generated
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

// ============================================================================
// API CLIENT
// ============================================================================

const membershipPlansApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/membership-plans?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/membership-plans/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/membership-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/membership-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/membership-plans/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export function useMembershipPlans(params?: any) {
  return useQuery({
    queryKey: ['membershipPlans', params],
    queryFn: () => membershipPlansApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useMembershipPlan(id: number) {
  return useQuery({
    queryKey: ['membershipPlans', id],
    queryFn: () => membershipPlansApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMembershipPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => membershipPlansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
    },
  });
}

export function useUpdateMembershipPlan(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => membershipPlansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
      queryClient.invalidateQueries({ queryKey: ['membershipPlans', id] });
    },
  });
}

export function useDeleteMembershipPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => membershipPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
    },
  });
}
