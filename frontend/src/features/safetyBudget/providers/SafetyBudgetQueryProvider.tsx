import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * 산안비 모듈 전용 React Query Provider.
 * 앱 전역 Provider 트리를 건드리지 않기 위해, 이 기능의 페이지 루트에서만 감싼다.
 */
export function SafetyBudgetQueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                retry: 1,
            },
        },
    }));

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
