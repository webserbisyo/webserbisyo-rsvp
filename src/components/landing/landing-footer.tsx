"use client";

import { ArrowRight, MessageSquareCode } from "lucide-react";
import { TrackedAnchor, TrackedLink } from "@/components/meta-pixels/tracked-link";
import { buildMessengerContinueUrl } from "@/lib/apply/messenger";

type LandingFooterProps = {
  messengerPageUrl?: string | null;
};

export function LandingFooter({ messengerPageUrl }: LandingFooterProps) {
  const messengerUrl = buildMessengerContinueUrl(messengerPageUrl);

  return (
    <footer className="landing-theme-dark relative isolate w-full bg-[#050505] border-t border-white/[0.06] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Final Call-to-Action Block */}
        <div className="text-center mb-12 flex flex-col items-center max-w-md">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide mb-2">
            Ready to preview your RSVP website?
          </h3>
          <p className="text-sm text-[#ff8a5c] font-semibold mb-6 italic tracking-wider">
            Website muna, bago bayad.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <TrackedLink
              href="/apply"
              className="landing-cta-button group inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-bold text-white shadow-lg shadow-orange-950/20 w-full sm:w-auto"
              trackingEvent="StartApplicationClick"
              trackingParams={{
                content_category: "RSVP Website Application",
                destination: "/apply",
                source: "footer",
              }}
            >
              Get started
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </TrackedLink>
            
            {messengerUrl && (
              <TrackedAnchor
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-6 text-sm font-semibold text-white transition-all w-full sm:w-auto"
                trackingEvent="Contact"
                trackingParams={{
                  contact_method: "messenger",
                  source: "footer",
                }}
              >
                <MessageSquareCode className="size-4 text-[#ff8a5c]" />
                Message us
              </TrackedAnchor>
            )}
          </div>
        </div>

        {/* Brand & Divider */}
        <div className="w-full h-[1px] bg-white/[0.06] mb-8" />

        {/* Footer Base Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full text-center sm:text-left">
          {/* Brand & Copy */}
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold tracking-[0.15em] text-white">
              WEBSERBISYO <span className="text-[#ff8a5c] font-black">RSVP</span>
            </div>
            <p className="text-xs text-white/40">
              Premium digital RSVP websites for Filipino couples.
            </p>
          </div>

          {/* Socials & Copyright */}
          <div className="flex flex-col sm:items-end gap-3">
            {messengerUrl && (
              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
                aria-label="Find us on Facebook"
              >
                {/* SVG for Facebook logo in Facebook brand blue */}
                <svg className="size-4 fill-[#1877F2] transition-opacity duration-200 hover:opacity-85" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Find us on Facebook</span>
              </a>
            )}
            
            <p className="text-[10px] text-white/30 tracking-wider">
              © 2026 WebSerbisyo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
