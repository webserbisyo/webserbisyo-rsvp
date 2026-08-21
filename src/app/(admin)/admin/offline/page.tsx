import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { PageContainer } from "@/components/app-shell/page-container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offline",
};

export default function AdminOfflinePage() {
  return (
    <PageContainer className="min-h-[calc(100svh-var(--admin-mobile-header-height)-var(--admin-mobile-nav-height))] justify-center">
      <section className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="bg-background overflow-hidden rounded-xl border shadow-sm">
          <Image
            src="/images/brand/webserbisyo-logo.jpeg"
            alt="WebSerbisyo"
            width={88}
            height={88}
            className="size-20 object-cover"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
        <div className="bg-rsvp-accent text-rsvp-accent-foreground flex size-14 items-center justify-center rounded-lg">
          <WifiOff className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">You&apos;re offline</h1>
          <p className="text-muted-foreground text-sm leading-6">
            WebSerbisyo RSVP needs internet to sync your dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">Try Again</Link>
        </Button>
      </section>
    </PageContainer>
  );
}
