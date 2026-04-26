"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { registerServiceWorker } from "@/lib/pwa/register-sw";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <TooltipProvider>
      {children}
      <Toaster richColors />
    </TooltipProvider>
  );
}
