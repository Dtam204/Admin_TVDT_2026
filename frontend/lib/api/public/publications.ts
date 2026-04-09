import { publicApiCall } from '@/lib/api/public/client';

export type ReaderPublicationListParams = {
  page?: number;
  limit?: number;
  search?: string;
  title?: string;
  author?: string;
  year_from?: number;
  year_to?: number;
  publisher_id?: number;
  media_type?: 'Physical' | 'Digital' | 'Hybrid';
  sort_by?: 'id' | 'default' | 'year' | 'title' | 'views' | 'favorites';
  order?: 'ASC' | 'DESC';
};

export type ReaderPublicationListItem = {
  id: number;
  code: string;
  isbn: string;
  title: string;
  author: string;
  authors_list?: Array<{ id: number; name: string }>;
  slug: string;
  cover_image: string | null;
  thumbnail: string | null;
  publication_year: number;
  pages: number | null;
  media_type: 'Physical' | 'Digital' | 'Hybrid';
  status: string;
  access_policy: string;
  publisher_name: string | null;
  copy_count: number;
  view_count: number;
  favorite_count: number;
};

export type ReaderPublicationDetail = ReaderPublicationListItem & {
  description?: string;
  language?: string;
  ai_summary?: string | null;
  cooperation_status?: string;
  canRead?: boolean;
  current_collection?: { id: number; name: string | null } | null;
  collection_list?: Array<{ id: number; name: string; publication_count: number }>;
  copies?: Array<{
    id: string;
    barcode: string;
    copy_number: string;
    price: number;
    status: string;
    condition: string;
    storage_name: string | null;
  }>;
  related_documents?: Array<Record<string, any>>;
  information_fields?: Array<{ key: string; label: string; value: string | number | boolean }>;
  trailerInfo?: {
    url: string | null;
    provider: string | null;
    thumbnail: string | null;
    duration: string | null;
    title: string | null;
  } | null;
  preview_pages?: Array<{
    index: number;
    label: string;
    value: string | Record<string, any>;
  }>;
  digitized_files?: Array<{
    id: string;
    name: string;
    type: string;
    url: string | null;
    path: string | null;
    size: number | null;
  }>;
  user_interaction?: {
    isFavorited?: boolean;
    hasDownloaded?: boolean;
    readCount?: number;
  } | null;
};

export type ReaderPublicationLookups = {
  authors: Array<{ id: number; name: string; publication_count: number }>;
  publishers: Array<{ id: number; name: string; publication_count: number }>;
  collections: Array<{ id: number; name: string; publication_count: number }>;
  years: number[];
  languages: Array<{ language: string; publication_count: number }>;
  media_types: Array<{ media_type: string; publication_count: number }>;
};

export type ReaderPublicationCopy = {
  id: number | string;
  barcode: string;
  copy_number: string;
  price: number;
  status: string;
  condition: string;
  storage_location_id?: number | string | null;
  storage_name?: string | null;
};

export type ReaderPublicationsHomeData = {
  banners: Array<{
    id: number;
    title: string;
    image: string | null;
    dominantColor?: string | null;
  }>;
  trending: ReaderPublicationListItem[];
  newest: ReaderPublicationListItem[];
  categories: Array<{ id: string; name: string; icon: string }>;
};

export type ReaderPublicationReviewItem = {
  id: number;
  memberId: number | null;
  rating: number;
  comment: string | null;
  fullName: string;
  createdAt: string;
};

export type ReaderPublicationReviewsData = {
  reviews: ReaderPublicationReviewItem[];
  stats: {
    avgRating: number;
    avg_rating?: number;
    totalReviews: number;
    total_reviews?: number;
  };
};

export type ApiResponse<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalItems?: number;
    totalPages?: number;
    currentPage?: number;
  };
};

export type FavoriteActionData = {
  isFavorited?: boolean;
  is_favorited?: boolean;
  favoriteCount?: number;
  favorite_count?: number;
};

export type FavoriteActionResponse = ApiResponse<FavoriteActionData>;

export type ReviewSubmitPayload = {
  rating: number;
  comment?: string;
};

export type ReviewSubmitData = {
  id: number;
  rating: number;
  comment?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type ReviewSubmitResponse = ApiResponse<ReviewSubmitData>;

export type TrackingActionData = {
  viewCount?: number;
  view_count?: number;
  tracked?: boolean;
};

export type TrackingActionResponse = ApiResponse<TrackingActionData>;

export type PublicationSummaryData = {
  summary: string;
  cached: boolean;
};

export type PublicationSummaryResponse = ApiResponse<PublicationSummaryData>;

function parseMaybeJsonText(value: any): any {
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return parsed.vi || parsed.en || value;
    }
    return value;
  } catch {
    return value;
  }
}

export function normalizePublicationListItem(item: any): ReaderPublicationListItem {
  return {
    id: item.id,
    code: item.code,
    isbn: item.isbn,
    title: parseMaybeJsonText(item.title),
    author: item.author,
    authors_list: Array.isArray(item.authors_list) ? item.authors_list : [],
    slug: item.slug,
    cover_image: item.cover_image || null,
    thumbnail: item.thumbnail || item.cover_image || null,
    publication_year: item.publication_year,
    pages: item.pages ?? null,
    media_type: item.media_type,
    status: item.status,
    access_policy: item.access_policy,
    publisher_name: parseMaybeJsonText(item.publisher_name) || null,
    copy_count: Number(item.copy_count || 0),
    view_count: Number(item.view_count || 0),
    favorite_count: Number(item.favorite_count || 0),
  };
}

export const readerPublicationsApi = {
  getList: async (params: ReaderPublicationListParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });

    const res = await publicApiCall<ApiResponse<any[]>>(`/api/public/publications?${query.toString()}`);

    return {
      ...res,
      data: (res.data || []).map(normalizePublicationListItem),
      pagination: {
        page: res.pagination?.page ?? res.pagination?.currentPage ?? 1,
        limit: res.pagination?.limit ?? 10,
        total: res.pagination?.total ?? res.pagination?.totalItems ?? 0,
        totalPages: res.pagination?.totalPages ?? 0,
        currentPage: res.pagination?.currentPage ?? res.pagination?.page ?? 1,
      },
    };
  },

  getDetail: async (idOrSlug: string, token?: string | null) => {
    const res = await publicApiCall<ApiResponse<any>>(`/api/public/publications/${idOrSlug}`, {}, token);

    return {
      ...res,
      data: {
        ...res.data,
        title: parseMaybeJsonText(res.data?.title),
        description: parseMaybeJsonText(res.data?.description),
        publisher_name: parseMaybeJsonText(res.data?.publisher_name) || null,
        thumbnail: res.data?.thumbnail || res.data?.cover_image || null,
      } as ReaderPublicationDetail,
    };
  },

  getRelated: async (idOrSlug: string, limit = 12) => {
    const safeLimit = Math.min(Math.max(limit, 1), 24);
    const res = await publicApiCall<ApiResponse<any[]>>(`/api/public/publications/${idOrSlug}/related?limit=${safeLimit}`);
    return {
      ...res,
      data: (res.data || []).map(normalizePublicationListItem),
    };
  },

  getLookups: async () => {
    const res = await publicApiCall<ApiResponse<ReaderPublicationLookups>>('/api/public/publications/lookups');
    return {
      ...res,
      data: {
        authors: res.data?.authors || [],
        publishers: res.data?.publishers || [],
        collections: res.data?.collections || [],
        years: res.data?.years || [],
        languages: res.data?.languages || [],
        media_types: res.data?.media_types || [],
      },
    };
  },

  getCopies: async (idOrSlug: string) => {
    const res = await publicApiCall<ApiResponse<ReaderPublicationCopy[]>>(`/api/public/publications/${idOrSlug}/copies`);
    return {
      ...res,
      data: (res.data || []).map((copy: any) => ({
        ...copy,
        price: Number(copy?.price || 0),
      })),
    };
  },

  getHomeUnified: async () => {
    const res = await publicApiCall<ApiResponse<ReaderPublicationsHomeData>>('/api/public/publications/home-unified');
    return {
      ...res,
      data: {
        banners: res.data?.banners || [],
        trending: (res.data?.trending || []).map(normalizePublicationListItem),
        newest: (res.data?.newest || []).map(normalizePublicationListItem),
        categories: res.data?.categories || [],
      },
    };
  },

  getReviews: async (idOrSlug: string) => {
    const res = await publicApiCall<ApiResponse<ReaderPublicationReviewsData>>(`/api/public/publications/${idOrSlug}/reviews`);
    return {
      ...res,
      data: {
        reviews: res.data?.reviews || [],
        stats: {
          avgRating: Number(res.data?.stats?.avgRating ?? res.data?.stats?.avg_rating ?? 0),
          avg_rating: Number(res.data?.stats?.avg_rating ?? res.data?.stats?.avgRating ?? 0),
          totalReviews: Number(res.data?.stats?.totalReviews ?? res.data?.stats?.total_reviews ?? 0),
          total_reviews: Number(res.data?.stats?.total_reviews ?? res.data?.stats?.totalReviews ?? 0),
        },
      },
    };
  },

  addFavorite: async (idOrSlug: string, token: string) => {
    return publicApiCall<FavoriteActionResponse>(`/api/public/publications/${idOrSlug}/favorite`, { method: 'POST' }, token);
  },

  removeFavorite: async (idOrSlug: string, token: string) => {
    return publicApiCall<FavoriteActionResponse>(`/api/public/publications/${idOrSlug}/favorite`, { method: 'DELETE' }, token);
  },

  submitReview: async (idOrSlug: string, payload: ReviewSubmitPayload, token?: string | null) => {
    return publicApiCall<ReviewSubmitResponse>(
      `/api/public/publications/${idOrSlug}/reviews`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token
    );
  },

  recordRead: async (idOrSlug: string, token?: string | null) => {
    return publicApiCall<TrackingActionResponse>(`/api/public/publications/${idOrSlug}/read`, { method: 'POST' }, token);
  },

  recordDownload: async (idOrSlug: string, token?: string | null) => {
    return publicApiCall<TrackingActionResponse>(`/api/public/publications/${idOrSlug}/download`, { method: 'POST' }, token);
  },

  summarize: async (idOrSlug: string, token?: string | null) => {
    return publicApiCall<PublicationSummaryResponse>(`/api/public/publications/${idOrSlug}/summarize`, { method: 'POST' }, token);
  },
};
