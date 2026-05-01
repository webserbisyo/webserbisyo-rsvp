"use client";

import { toast } from "sonner";

type ClientToastOptions = {
  description?: string;
};

function createClientToast(fn: typeof toast.success) {
  return (message: string, options?: ClientToastOptions) =>
    fn(message, {
      description: options?.description,
      duration: 3600,
    });
}

export const clientToast = {
  error: createClientToast(toast.error),
  info: createClientToast(toast.info),
  success: createClientToast(toast.success),
  warning: createClientToast(toast.warning),
};
