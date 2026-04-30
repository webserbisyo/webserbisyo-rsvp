"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { ADMIN_APPLICATIONS_QUERY_KEY } from "@/components/applications/use-applications-query";

export function useApplicationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("applications_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rsvp_applications",
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          void queryClient.invalidateQueries({ queryKey: ADMIN_APPLICATIONS_QUERY_KEY });

          if (payload.eventType === "INSERT") {
            toast("New application received", {
              description: "The queue has been automatically updated.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
