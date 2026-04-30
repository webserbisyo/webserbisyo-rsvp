"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminPixelsAction } from "@/server/actions/meta-pixels";
import type { AdminMetaPixelsResult } from "@/server/queries/admin-pixels";

export const ADMIN_META_PIXELS_QUERY_KEY = ["meta-pixels"] as const;

export function useMetaPixelsQuery(initialData: AdminMetaPixelsResult) {
  return useQuery({
    queryKey: ADMIN_META_PIXELS_QUERY_KEY,
    queryFn: async () => {
      const result = await fetchAdminPixelsAction();

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.data;
    },
    initialData,
    staleTime: 30_000,
  });
}
