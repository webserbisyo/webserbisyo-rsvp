"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      duration={4200}
      gap={10}
      mobileOffset={{ top: "1rem" }}
      offset={{ top: "1rem" }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 4200,
        classNames: {
          actionButton: "cn-toast-action",
          cancelButton: "cn-toast-cancel",
          content: "cn-toast-content",
          description: "cn-toast-description",
          icon: "cn-toast-icon",
          info: "cn-toast-info",
          loading: "cn-toast-loading",
          success: "cn-toast-success",
          error: "cn-toast-error",
          toast: "cn-toast",
          title: "cn-toast-title",
          warning: "cn-toast-warning",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
