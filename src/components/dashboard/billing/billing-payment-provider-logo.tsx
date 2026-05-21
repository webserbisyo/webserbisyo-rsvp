import Image from "next/image";
import { cn } from "@/lib/utils";

type BillingPaymentProviderLogoProps = {
  className?: string;
  provider: string;
};

const PROVIDER_LOGO_MAP: Record<string, { alt: string; src: string }> = {
  gcash: {
    alt: "GCash logo",
    src: "/images/brand/gcash.svg",
  },
  maya: {
    alt: "Maya logo",
    src: "/images/brand/maya.svg",
  },
};

export function BillingPaymentProviderLogo({
  className,
  provider,
}: BillingPaymentProviderLogoProps) {
  const normalizedProvider = provider.trim().toLowerCase();
  const asset = PROVIDER_LOGO_MAP[normalizedProvider];

  if (!asset) {
    return (
      <span
        className={cn(
          "inline-flex h-10 min-w-20 items-center justify-center rounded-full px-3 text-sm font-black tracking-[0.04em] uppercase text-[color:var(--dash-foreground)]",
          className,
        )}
      >
        {provider}
      </span>
    );
  }

  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={96}
      height={28}
      className={cn("h-7 w-auto object-contain", className)}
    />
  );
}
