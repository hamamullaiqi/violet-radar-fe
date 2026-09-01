import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 menit
            gcTime: 30 * 60 * 1000,   // cache disimpan 30 menit
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});