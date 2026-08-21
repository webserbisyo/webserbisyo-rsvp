import Image from "next/image";

export function AuthLoading() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#fffaf4] px-4">
      {/* Brand Icon Container */}
      <div className="relative mb-5 flex size-20 items-center justify-center rounded-2xl border border-stone-200/80 bg-white p-3 shadow-xl shadow-stone-900/5">
        <Image
          src="/icon.png"
          alt="WebSerbisyo"
          width={56}
          height={56}
          priority
          className="h-14 w-14 rounded-xl object-contain"
          style={{ width: "auto", height: "auto" }}
        />
      </div>

      {/* Brand Heading */}
      <h2 className="text-lg font-semibold tracking-tight text-stone-900">
        WebSerbisyo RSVP
      </h2>
      <p className="mt-1 text-xs font-medium text-stone-500">
        Securing your session…
      </p>

      {/* Staggered 3-Dot Jumping Loader */}
      <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
        <span className="size-2 animate-bounce rounded-full bg-[#c96b48] [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-[#c96b48] [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-[#c96b48]" />
      </div>
    </div>
  );
}
