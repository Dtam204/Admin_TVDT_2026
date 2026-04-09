/**
 * React Query Hooks - Next-Gen Publication Module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicationsApi, PublicationPayload } from '@/lib/api/admin/publications';

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
    mutationFn: ({ id, data }: { id: string, data: PublicationPayload }) => publicationsApi.update(id, data),
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
    mutationFn: (data: PublicationPayload) => publicationsApi.create(data),
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

export function useAdminStorageLocations() {
  return useQuery({
    queryKey: ['admin-storage-locations'],
    queryFn: () => publicationsApi.getStorageLocations(),
    staleTime: 30 * 60 * 1000,
  });
}
