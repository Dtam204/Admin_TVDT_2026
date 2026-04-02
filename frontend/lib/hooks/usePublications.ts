/**
 * React Query Hooks - Next-Gen Publication Module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall, uploadImage, uploadFile } from '@/lib/api/admin/client';

const publicationsApi = {
  // Lấy danh sách ấn phẩm (Admin)
  getAll: async (params?: any) => {
    // Chuyển đổi tham số từ UI (searchQuery, pageIndex, formats) sang API (search, page, is_digital)
    let is_digital = undefined;
    let media_type = undefined;

    if (params.formats && params.formats.length === 1) {
      if (params.formats[0] === 'Digital') {
        is_digital = true;
        media_type = 'Digital';
      } else if (params.formats[0] === 'In' || params.formats[0] === 'Physical') {
        is_digital = false;
        media_type = 'Physical';
      } else if (params.formats[0] === 'Hybrid') {
        media_type = 'Hybrid';
      }
    }

    const apiParams: any = {
      search: params.searchQuery || '',
      page: params.pageIndex || 1,
      limit: params.pageSize || 10,
    };
    
    if (params.status && params.status !== 'all') apiParams.status = params.status;
    if (params.collectionId) apiParams.collection_id = params.collectionId;
    if (params.cooperationStatus) apiParams.cooperation_status = params.cooperationStatus;
    if (is_digital !== undefined) apiParams.is_digital = is_digital;
    if (media_type) apiParams.media_type = media_type;

    const query = new URLSearchParams(apiParams).toString();
    return adminApiCall(`/api/admin/publications?${query}`);
  },

  // Lấy chi tiết tích hợp (Sách + Bản sao)
  getById: async (id: string) => {
    return adminApiCall(`/api/admin/publications/${id}`);
  },

  // Tạo mới tích hợp (Siêu Form)
  create: async (data: any) => {
    return adminApiCall('/api/admin/publications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Lấy danh sách bộ sưu tập cho dropdown
  getCollections: async () => {
    return adminApiCall('/api/admin/collections');
  },

  // Detail for edit
  getDetail: async (id: string) => {
    return adminApiCall(`/api/admin/publications/${id}`);
  },

  // Update
  update: async (id: string, data: { publication: any, copies: any[] }) => {
    return adminApiCall(`/api/admin/publications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete
  delete: async (id: string) => {
    return adminApiCall(`/api/admin/publications/${id}`, {
      method: 'DELETE'
    });
  },

  // AI Summarize (Admin context - POST with text)
  summarize: async (text: string) => {
    return adminApiCall(`/api/admin/publications/summarize`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  // Upload PDF
  uploadPdf: async (file: File) => {
    // uploadFile in client.ts already handles tokens and buildUrl
    return uploadFile(file);
  },

  // Upload Image
  uploadImage: async (file: File) => {
    // uploadImage in client.ts returns the URL directly
    const url = await uploadImage(file);
    return { success: true, data: { url } };
  },

  // Collections CRUD
  getCollection: async (id: string) => {
    return adminApiCall(`/api/admin/collections/${id}`);
  },
  updateCollection: async (id: string, data: any) => {
    return adminApiCall(`/api/admin/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Stats
  getStats: async () => {
    return adminApiCall('/api/admin/publications/dashboard/stats');
  }
};

export function useAdminPublication(id: string) {
  return useQuery({
    queryKey: ['admin-publication', id],
    queryFn: () => publicationsApi.getDetail(id),
    enabled: !!id
  });
}

export function useUpdatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => publicationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-publication'] });
    }
  });
}

export function useDeletePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
    }
  });
}

export function useSummarize() {
  return useMutation({
    mutationFn: (text: string) => publicationsApi.summarize(text),
  });
}

export function useUploadPdf() {
  return useMutation({
    mutationFn: (file: File) => publicationsApi.uploadPdf(file),
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => publicationsApi.uploadImage(file),
  });
}

export function useAdminPublications(params?: any) {
  return useQuery({
    queryKey: ['admin-publications', params],
    queryFn: () => publicationsApi.getAll(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminPublicationDetail(id: string) {
  return useQuery({
    queryKey: ['admin-publications', id],
    queryFn: () => publicationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => publicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      queryClient.invalidateQueries({ queryKey: ['books'] }); // Sync with old keys
    },
  });
}

export function useAdminCollections() {
  return useQuery({
    queryKey: ['admin-collections'],
    queryFn: () => publicationsApi.getCollections(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAdminCollection(id: string) {
  return useQuery({
    queryKey: ['admin-collection', id],
    queryFn: () => publicationsApi.getCollection(id),
    enabled: !!id
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => publicationsApi.updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['admin-collection'] });
    }
  });
}

export function useAdminPublicationStats() {
  return useQuery({
    queryKey: ['admin-publication-stats'],
    queryFn: () => publicationsApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}
