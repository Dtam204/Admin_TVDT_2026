/**
 * React Query Hooks - Book Loans Module
 * Phase 1 MVP
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';

const bookLoansApi = {
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
    return adminApiCall(`/api/admin/borrow/all?${query}`);
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

  register: async (data: any) => {
    return adminApiCall('/api/admin/borrow/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approve: async (requestId: string | number) => {
    return adminApiCall('/api/admin/borrow/approve', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  },

  extend: async (loanId: number, days?: number, newDueDate?: string) => {
    return adminApiCall('/api/admin/borrow/extend', {
      method: 'POST',
      body: JSON.stringify({ loanId, extendDays: days, newDueDate }),
    });
  },

  returnBook: async (loanId: number) => {
    return adminApiCall('/api/admin/borrow/return', {
      method: 'POST',
      body: JSON.stringify({ loanId }),
    });
  },
  
  reserve: async (data: { readerId: string | number; publicationId: string | number; notes?: string }) => {
    return adminApiCall('/api/admin/borrow/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getReservations: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return adminApiCall(`/api/admin/borrow/reservations?${query}`);
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

export function useRegisterBorrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => bookLoansApi.register(data),
    onSuccess: () => {
      // Invalidate cả danh sách phiếu mượn VÀ chi tiết ấn phẩm
      // để trạng thái bản sao (available→borrowed) cập nhật ngay trên UI
      queryClient.invalidateQueries({ queryKey: ['bookLoans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
    },
  });
}


export function useApproveBorrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string | number) => bookLoansApi.approve(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookLoans'] });
    },
  });
}

export function useExtendBorrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, days }: { id: number; days?: number }) => bookLoansApi.extend(id, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookLoans'] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookLoansApi.returnBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookLoans'] });
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => bookLoansApi.reserve(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookReservations'] });
    },
  });
}

export function useReservations(params?: any) {
  return useQuery({
    queryKey: ['bookReservations', params],
    queryFn: () => bookLoansApi.getReservations(params),
  });
}
