"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { clientToast } from "@/components/client-dashboard/feedback/client-toast";
import { clientMobileMoreNavItems } from "@/components/client-dashboard/navigation/client-nav-config";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type ClientMobileMoreDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClientMobileMoreDrawer({ open, onOpenChange }: ClientMobileMoreDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="client-floating-surface max-h-[86vh] rounded-t-[var(--client-radius-2xl)] border-[var(--client-border)] bg-[var(--client-surface-raised)]">
        <DrawerHeader className="px-5 pt-5 text-left">
          <DrawerTitle className="text-lg text-[var(--client-text)]">More</DrawerTitle>
          <DrawerDescription>
            Secondary client dashboard navigation and account actions.
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="min-h-0 px-5 pb-2">
          <div className="space-y-2 pb-1">
            {clientMobileMoreNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className="client-nav-link client-focus-ring flex items-center gap-3 rounded-[var(--client-radius-lg)] px-3 py-3 text-sm font-medium"
              >
                <item.icon className="size-4.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                clientToast.info("Support shortcuts are still being prepared.", {
                  description: "Use your current WebSerbisyo contact channels for now.",
                });
              }}
              className="client-nav-link client-focus-ring flex w-full items-center gap-3 rounded-[var(--client-radius-lg)] px-3 py-3 text-left text-sm font-medium"
            >
              <MessageCircle className="size-4.5 shrink-0" />
              <span>Support</span>
            </button>
          </div>
        </ScrollArea>

        <DrawerFooter className="px-5 pt-2 pb-5">
          <div className="rounded-[var(--client-radius-xl)] border border-[var(--client-border)] bg-white/82 p-2 shadow-[var(--client-shadow-soft)]">
            <SignOutButton className="client-focus-ring w-full justify-start rounded-[var(--client-radius-lg)] text-[var(--client-text-muted)] hover:bg-[var(--client-accent-soft)] hover:text-[var(--client-accent-hover)]" />
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
