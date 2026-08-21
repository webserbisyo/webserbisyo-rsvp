import Image from "next/image";
import { Card } from "@/components/ui/card";

type AuthShellProps = {
  children: React.ReactNode;
  description?: string;
  title?: string;
};

export function AuthShell({
  children,
  description = "One secure login for platform admins and client administrators.",
  title = "Sign in to WebSerbisyo RSVP",
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffaf4] px-4 py-8 sm:px-6">
      {/* Ambient warm brand glow meshes (Zero asset overhead) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,107,72,0.14),_transparent_55%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(201,107,72,0.08),_transparent_40%)]"
        aria-hidden="true"
      />

      <Card className="relative z-10 w-full max-w-[420px] border-slate-800/80 bg-slate-950 py-0 text-white shadow-2xl shadow-stone-900/10">
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-lg shadow-black/20 ring-1 ring-white/10 sm:size-18">
              <Image
                src="/icon.png"
                alt="WebSerbisyo"
                width={72}
                height={72}
                priority
                className="h-auto w-auto object-cover"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
              <p className="text-sm leading-6 text-white/75">{description}</p>
            </div>
          </div>

          {children}
        </div>
      </Card>
    </main>
  );
}
