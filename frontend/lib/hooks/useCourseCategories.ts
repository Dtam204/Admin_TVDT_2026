/**
 * React Query Hooks - CourseCategories Module
 * Phase 1 MVP - Auto-generated
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

// ============================================================================
// API CLIENT
// ============================================================================

const courseCategoriesApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/course-categories?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/course-categories/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/course-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/course-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/course-categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export function useCourseCategories(params?: any) {
  return useQuery({
    queryKey: ['courseCategories', params],
    queryFn: () => courseCategoriesApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCourseCategory(id: number) {
  return useQuery({
    queryKey: ['courseCategories', id],
    queryFn: () => courseCategoriesApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCourseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseCategoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseCategories'] });
    },
  });
}

export function useUpdateCourseCategory(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseCategoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['courseCategories', id] });
    },
  });
}

export function useDeleteCourseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => courseCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseCategories'] });
    },
  });
}
