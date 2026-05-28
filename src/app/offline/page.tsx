import Image from "next/image";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#fffaf4] px-6 py-12 text-[#1d1b18]">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <div
          className="relative h-20 w-20 overflow-hidden rounded-[1.45rem] border border-[#ead8c4] bg-[#fff7ef] p-1 shadow-[0_16px_36px_rgba(112,78,51,0.12)]"
          aria-hidden="true"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[1.1rem]">
            <Image
              src="/images/brand/webserbisyo-logo.jpeg"
              alt=""
              fill
              sizes="80px"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#fde8df] text-[#c96b48]">
          <WifiOff className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-[-0.03em]">You&apos;re offline</h1>
        <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-[#7f6b5e]">
          WebSerbisyo RSVP needs internet to sync your dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-2xl bg-[#c96b48] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(201,107,72,0.22)] transition hover:bg-[#b85a39] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c96b48]"
        >
          Try Again
        </Link>
      </section>
    </main>
  );
}
