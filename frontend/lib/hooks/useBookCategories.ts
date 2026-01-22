/**
 * React Query Hooks - BookCategories Module
 * Phase 1 MVP - Auto-generated
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

// ============================================================================
// API CLIENT
// ============================================================================

const bookCategoriesApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/book-categories?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/book-categories/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/book-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/book-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/book-categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export function useBookCategories(params?: any) {
  return useQuery({
    queryKey: ['bookCategories', params],
    queryFn: () => bookCategoriesApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useBookCategory(id: number) {
  return useQuery({
    queryKey: ['bookCategories', id],
    queryFn: () => bookCategoriesApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBookCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => bookCategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookCategories'] });
    },
  });
}

export function useUpdateBookCategory(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => bookCategoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookCategories'] });
      queryClient.invalidateQueries({ queryKey: ['bookCategories', id] });
    },
  });
}

export function useDeleteBookCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bookCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookCategories'] });
    },
  });
}
