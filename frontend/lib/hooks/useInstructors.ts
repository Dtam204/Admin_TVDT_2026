/**
 * React Query Hooks - Instructors Module
 * Phase 1 MVP - Auto-generated
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

// ============================================================================
// API CLIENT
// ============================================================================

const instructorsApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/instructors?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/instructors/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/instructors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/instructors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/instructors/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export function useInstructors(params?: any) {
  return useQuery({
    queryKey: ['instructors', params],
    queryFn: () => instructorsApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useInstructor(id: number) {
  return useQuery({
    queryKey: ['instructors', id],
    queryFn: () => instructorsApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => instructorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
  });
}

export function useUpdateInstructor(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => instructorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      queryClient.invalidateQueries({ queryKey: ['instructors', id] });
    },
  });
}

export function useDeleteInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => instructorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
    },
  });
}
