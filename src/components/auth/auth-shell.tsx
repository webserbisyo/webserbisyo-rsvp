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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <Image
        src="/images/auth/login-bg-rsvp.jpeg"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-slate-950/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_42%)]" />

      <Card className="relative z-10 w-full max-w-[420px] border-white/20 bg-white/14 py-0 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/90 shadow-lg shadow-slate-950/20">
              <Image
                src="/images/brand/webserbisyo-logo.jpeg"
                alt="WebSerbisyo"
                width={84}
                height={84}
                priority
                className="size-20 object-cover sm:size-[84px]"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm leading-6 text-white/78">{description}</p>
            </div>
          </div>

          {children}
        </div>
      </Card>
    </main>
  );
}
