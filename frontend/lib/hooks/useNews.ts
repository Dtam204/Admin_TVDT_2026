/**
 * Custom hooks for News API with React Query
 * Provides caching and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall, AdminEndpoints } from '@/lib/api/admin';
import { toast } from 'sonner';

// Types
interface NewsItem {
  id: number;
  title: string | Record<string, string>;
  slug: string;
  content: string | Record<string, string>;
  excerpt?: string | Record<string, string>;
  category_id?: number;
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
  published_at?: string;
  featured_image?: string;
}

interface NewsResponse {
  success: boolean;
  data: NewsItem[];
}

interface NewsDetailResponse {
  success: boolean;
  data: NewsItem;
}

// Query keys
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...newsKeys.lists(), filters] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: number) => [...newsKeys.details(), id] as const,
};

/**
 * Hook to fetch news list với caching
 */
export function useNews(filters?: Record<string, any>) {
  return useQuery({
    queryKey: newsKeys.list(filters),
    queryFn: async () => {
      const response = await adminApiCall<NewsResponse>(
        AdminEndpoints.news.list + (filters ? `?${new URLSearchParams(filters as any)}` : '')
      );
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (news có thể cập nhật thường xuyên)
  });
}

/**
 * Hook to fetch single news item
 */
export function useNewsDetail(id: number) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: async () => {
      const response = await adminApiCall<NewsDetailResponse>(
        AdminEndpoints.news.detail(id)
      );
      return response.data;
    },
    enabled: !!id, // Only run if id exists
  });
}

/**
 * Hook to create news với optimistic update
 */
export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NewsItem>) => {
      const response = await adminApiCall<NewsDetailResponse>(
        AdminEndpoints.news.list,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate news list để refetch
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      toast.success('Tạo bài viết thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });
}

/**
 * Hook to update news
 */
export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewsItem> }) => {
      const response = await adminApiCall<NewsDetailResponse>(
        AdminEndpoints.news.detail(id),
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(variables.id) });
      toast.success('Cập nhật thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });
}

/**
 * Hook to delete news
 */
export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await adminApiCall(
        AdminEndpoints.news.detail(id),
        { method: 'DELETE' }
      );
      return id;
    },
    onSuccess: () => {
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      toast.success('Xóa thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra');
    },
  });
}
