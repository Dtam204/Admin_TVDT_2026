import { useMutation, useQuery } from '@tanstack/react-query';
import {
  readerPublicationsApi,
  ReaderPublicationListParams,
  ReviewSubmitPayload,
} from '@/lib/api/public/publications';

export type {
  ReaderPublicationListParams,
  ReaderPublicationListItem,
  ReaderPublicationDetail,
  ReaderPublicationLookups,
  ReaderPublicationCopy,
  ReaderPublicationsHomeData,
  ReaderPublicationReviewItem,
  ReaderPublicationReviewsData,
  FavoriteActionData,
  FavoriteActionResponse,
  ReviewSubmitPayload,
  ReviewSubmitData,
  ReviewSubmitResponse,
  TrackingActionData,
  TrackingActionResponse,
  PublicationSummaryData,
  PublicationSummaryResponse,
} from '@/lib/api/public/publications';

export function useReaderPublications(params: ReaderPublicationListParams = {}) {
  return useQuery({
    queryKey: ['reader-publications', params],
    queryFn: () => readerPublicationsApi.getList(params),
    staleTime: 60 * 1000,
  });
}

export function useReaderPublicationDetail(idOrSlug?: string, token?: string | null) {
  return useQuery({
    queryKey: ['reader-publication-detail', idOrSlug],
    queryFn: () => readerPublicationsApi.getDetail(idOrSlug || '', token),
    enabled: Boolean(idOrSlug),
    staleTime: 30 * 1000,
  });
}

export function useReaderPublicationRelated(idOrSlug?: string, limit = 12) {
  return useQuery({
    queryKey: ['reader-publication-related', idOrSlug, limit],
    queryFn: () => readerPublicationsApi.getRelated(idOrSlug || '', limit),
    enabled: Boolean(idOrSlug),
    staleTime: 30 * 1000,
  });
}

export function useReaderPublicationLookups() {
  return useQuery({
    queryKey: ['reader-publication-lookups'],
    queryFn: () => readerPublicationsApi.getLookups(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReaderPublicationCopies(idOrSlug?: string) {
  return useQuery({
    queryKey: ['reader-publication-copies', idOrSlug],
    queryFn: () => readerPublicationsApi.getCopies(idOrSlug || ''),
    enabled: Boolean(idOrSlug),
    staleTime: 30 * 1000,
  });
}

export function useReaderPublicationsHomeData() {
  return useQuery({
    queryKey: ['reader-publications-home-unified'],
    queryFn: () => readerPublicationsApi.getHomeUnified(),
    staleTime: 60 * 1000,
  });
}

export function useReaderPublicationReviews(idOrSlug?: string) {
  return useQuery({
    queryKey: ['reader-publication-reviews', idOrSlug],
    queryFn: () => readerPublicationsApi.getReviews(idOrSlug || ''),
    enabled: Boolean(idOrSlug),
    staleTime: 30 * 1000,
  });
}

export function useReaderPublicationFavorite() {
  return useMutation({
    mutationFn: ({ idOrSlug, token, isFavorited }: { idOrSlug: string; token: string; isFavorited: boolean }) => {
      if (isFavorited) {
        return readerPublicationsApi.removeFavorite(idOrSlug, token);
      }
      return readerPublicationsApi.addFavorite(idOrSlug, token);
    },
  });
}

export function useReaderPublicationReview() {
  return useMutation({
    mutationFn: ({ idOrSlug, payload, token }: { idOrSlug: string; payload: ReviewSubmitPayload; token?: string | null }) =>
      readerPublicationsApi.submitReview(idOrSlug, payload, token),
  });
}

export function useReaderPublicationReadTracking() {
  return useMutation({
    mutationFn: ({ idOrSlug, token }: { idOrSlug: string; token?: string | null }) =>
      readerPublicationsApi.recordRead(idOrSlug, token),
  });
}

export function useReaderPublicationDownloadTracking() {
  return useMutation({
    mutationFn: ({ idOrSlug, token }: { idOrSlug: string; token?: string | null }) =>
      readerPublicationsApi.recordDownload(idOrSlug, token),
  });
}

export function useReaderPublicationSummarize() {
  return useMutation({
    mutationFn: ({ idOrSlug, token }: { idOrSlug: string; token?: string | null }) =>
      readerPublicationsApi.summarize(idOrSlug, token),
  });
}
