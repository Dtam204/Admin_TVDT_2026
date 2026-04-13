import { adminApiCall, uploadImage, uploadFile } from '@/lib/api/admin/client';

export type ApiEnvelope<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | null;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalItems?: number;
    totalPages?: number;
    currentPage?: number;
  };
};

export type PublicationCopy = {
  id?: string | number;
  barcode?: string;
  copy_number?: string;
  price?: number;
  status?: string;
  condition?: string;
  storage_location_id?: string | number | null;
  storage_name?: string | null;
};

export type PublicationDetail = {
  id: number;
  code?: string;
  isbn?: string;
  isbd_content?: string;
  title?: string;
  author?: string;
  slug?: string;
  description?: string;
  cover_image?: string | null;
  thumbnail?: string | null;
  publication_year?: number;
  pages?: number;
  page_count?: number;
  language?: string;
  publisher_id?: number | null;
  publisher?: { id?: number } | null;
  collection_id?: number | null;
  digital_file_url?: string | null;
  ai_summary?: string | null;
  aiSummary?: string | null;
  dominant_color?: string | null;
  dominantColor?: string | null;
  access_policy?: string;
  cooperation_status?: string;
  media_type?: string;
  is_digital?: boolean;
  metadata?: Record<string, unknown>;
  digital_content?: unknown;
  digitalContent?: unknown;
  toc?: any[];
  keywords?: string[] | string;
  edition?: string;
  volume?: string;
  dimensions?: string;
  status?: string;
  authors_list?: Array<{ id: number; name: string }>;
  copies?: PublicationCopy[];
  publication?: PublicationDetail;
  [key: string]: unknown;
};

export type PublicationMutationData = {
  id: number;
  success?: boolean;
  publication: PublicationDetail;
  copies: PublicationCopy[];
};

export type PublicationPayload = {
  publication: Record<string, unknown>;
  copies: PublicationCopy[];
};

export const publicationsApi = {
  getAll: async (params?: any) => {
    let is_digital = undefined;
    let media_type = undefined;

    if (params?.formats && params.formats.length === 1) {
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
      search: params?.searchQuery || '',
      page: params?.pageIndex || 1,
      limit: params?.pageSize || 10,
    };

    if (params?.status && params.status !== 'all') apiParams.status = params.status;
    if (params?.collectionId) apiParams.collection_id = params.collectionId;
    if (params?.cooperationStatus) apiParams.cooperation_status = params.cooperationStatus;
    if (is_digital !== undefined) apiParams.is_digital = is_digital;
    if (media_type) apiParams.media_type = media_type;

    const query = new URLSearchParams(apiParams).toString();
    return adminApiCall(`/api/admin/publications?${query}`);
  },

  getById: async (id: string) => {
    return adminApiCall<ApiEnvelope<PublicationDetail>>(`/api/admin/publications/${id}`);
  },

  create: async (data: PublicationPayload) => {
    return adminApiCall<ApiEnvelope<PublicationMutationData>>('/api/admin/publications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCollections: async () => {
    return adminApiCall('/api/admin/collections');
  },

  getDetail: async (id: string) => {
    return adminApiCall<ApiEnvelope<PublicationDetail>>(`/api/admin/publications/${id}`);
  },

  update: async (id: string, data: PublicationPayload) => {
    return adminApiCall<ApiEnvelope<PublicationMutationData>>(`/api/admin/publications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return adminApiCall(`/api/admin/publications/${id}`, {
      method: 'DELETE',
    });
  },

  summarize: async (text: string) => {
    return adminApiCall(`/api/admin/publications/summarize`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  uploadPdf: async (file: File) => {
    return uploadFile(file);
  },

  uploadImage: async (file: File) => {
    const url = await uploadImage(file);
    return { success: true, data: { url } };
  },

  getCollection: async (id: string) => {
    return adminApiCall(`/api/admin/collections/${id}`);
  },

  updateCollection: async (id: string, data: any) => {
    return adminApiCall(`/api/admin/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getStats: async () => {
    const response = await adminApiCall<any>('/api/admin/publications/dashboard/stats');
    const raw = response?.data || {};

    const totalPublications = Number(raw.totalPublications ?? raw.total_publications ?? 0);
    const cooperatingPublications = Number(raw.cooperatingPublications ?? raw.cooperating_publications ?? 0);
    const digitalOrHybridPublications = Number(raw.digitalOrHybridPublications ?? raw.digital_or_hybrid_publications ?? 0);
    const totalCopies = Number(raw.totalCopies ?? raw.total_copies ?? 0);

    return {
      ...response,
      data: {
        ...raw,
        totalPublications,
        cooperatingPublications,
        digitalOrHybridPublications,
        totalCopies,
        total_publications: totalPublications,
        cooperating_publications: cooperatingPublications,
        digital_or_hybrid_publications: digitalOrHybridPublications,
        total_copies: totalCopies,
      },
    };
  },

  getStorageLocations: async () => {
    return adminApiCall('/api/admin/publications/storage-locations');
  },
};
