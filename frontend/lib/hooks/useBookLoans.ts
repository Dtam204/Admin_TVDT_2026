/**
 * React Query Hooks - Book Loans Module
 * Phase 1 MVP
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

const bookLoansApi = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/book-loans?${query}`);
  },

  getById: async (id: number) => {
    return adminApiCall(`/api/admin/book-loans/${id}`);
  },

  create: async (data: any) => {
    return adminApiCall('/api/admin/book-loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return adminApiCall(`/api/admin/book-loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return adminApiCall(`/api/admin/book-loans/${id}`, {
      method: 'DELETE',
    });
  },
};

export function useBookLoans(params?: any) {
  return useQuery({
    queryKey: ['bookLoans', params],
    queryFn: () => bookLoansApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useBookLoan(id: number) {
  return useQuery({
    queryKey: ['bookLoans', id],
    queryFn: () => bookLoansApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBookLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => bookLoansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookLoans'] });
    },
  });
}

export function useUpdateBookLoan(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => bookLoansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookLoans'] });
      queryClient.invalidateQueries({ queryKey: ['bookLoans', id] });
    },
  });
}

export function useDeleteBookLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bookLoansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookLoans'] });
    },
  });
}
