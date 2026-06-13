"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

type DashboardQueryProviderProps = {
  children: React.ReactNode;
};

export function DashboardQueryProvider({ children }: DashboardQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            retry: 0,
          },
          queries: {
            gcTime: 30 * 60 * 1000,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
