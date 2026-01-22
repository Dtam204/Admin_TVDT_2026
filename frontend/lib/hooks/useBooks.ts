/**
 * React Query Hooks - Books Module
 * Phase 1 MVP
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

// ============================================================================
// API CLIENT FUNCTIONS
// ============================================================================

const booksApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/books?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/books/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/books/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch books list with pagination & filters
 */
export function useBooks(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  author_id?: number;
  status?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => booksApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Hook to fetch single book by ID
 */
export function useBook(id: number) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: () => booksApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create new book
 */
export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => booksApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch books list
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

/**
 * Hook to update book
 */
export function useUpdateBook(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => booksApi.update(id, data),
    onSuccess: () => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books', id] });
    },
  });
}

/**
 * Hook to delete book
 */
export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => booksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to fetch authors for book form select
 */
export function useAuthorsSelect() {
  return useQuery({
    queryKey: ['authors', 'select'],
    queryFn: () => adminApiCall('/api/admin/authors?limit=1000'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch categories for book form select
 */
export function useBookCategoriesSelect() {
  return useQuery({
    queryKey: ['bookCategories', 'select'],
    queryFn: () => adminApiCall('/api/admin/book-categories?limit=1000'),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch publishers for book form select
 */
export function usePublishersSelect() {
  return useQuery({
    queryKey: ['publishers', 'select'],
    queryFn: () => adminApiCall('/api/admin/publishers?limit=1000'),
    staleTime: 10 * 60 * 1000,
  });
}
