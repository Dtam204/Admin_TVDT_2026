/**
 * React Query Hooks - Publishers Module
 * Phase 1 MVP - Auto-generated
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

// ============================================================================
// API CLIENT
// ============================================================================

const publishersApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/publishers?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/publishers/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/publishers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/publishers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/publishers/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export function usePublishers(params?: any) {
  return useQuery({
    queryKey: ['publishers', params],
    queryFn: () => publishersApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function usePublisher(id: number) {
  return useQuery({
    queryKey: ['publishers', id],
    queryFn: () => publishersApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePublisher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => publishersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
}

export function useUpdatePublisher(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => publishersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
      queryClient.invalidateQueries({ queryKey: ['publishers', id] });
    },
  });
}

export function useDeletePublisher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => publishersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
}
