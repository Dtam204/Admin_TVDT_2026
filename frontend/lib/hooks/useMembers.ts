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
    const query = new URLSearchParams(params).toString();
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
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

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
