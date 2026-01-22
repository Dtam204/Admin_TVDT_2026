'use client';

/**
 * React Query Provider
 * Provides caching and state management for API calls
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

const defaultQueryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: Data coi như "fresh" trong 5 phút
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: Giữ data trong cache 10 phút
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      
      // Retry failed requests
      retry: 1,
      
      // Refetch on window focus (for admin, có thể bật)
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount (nếu data stale)
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
};

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(defaultQueryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
