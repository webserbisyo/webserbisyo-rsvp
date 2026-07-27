"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import { cn } from "@/lib/utils/index";

const NAV_LINKS = [
  { label: "Templates", href: "/#templates", soon: true },
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Payment", href: "/#payment" },
  { label: "FAQ", href: "/#faq" },
];

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once on mount to get initial scroll state
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      setIsMobileMenuOpen(false);

      const targetId = href.replace("/#", "");
      const element = document.getElementById(targetId);

      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${targetId}`);
      }
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="landing-theme-dark fixed top-0 left-0 z-50 w-full transition-all duration-300 pointer-events-none">
      {/* Desktop & Mobile Top Bar */}
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6 transition-all duration-500 ease-in-out pointer-events-auto",
          isScrolled ? "max-w-6xl py-4" : "max-w-7xl py-6"
        )}
      >
        <nav
          aria-label="Main navigation"
          className={cn(
            "flex items-center justify-between transition-all duration-500 ease-in-out",
            isScrolled
              ? "rounded-full border border-[var(--landing-border)] bg-[var(--landing-panel-strong)] px-6 py-3 shadow-[0_8px_32px_rgb(0_0_0/0.24)] backdrop-blur-md"
              : "rounded-2xl border border-transparent bg-transparent px-2 py-0"
          )}
        >
          {/* Brand / Logo */}
          <Link
            href="/"
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-border-strong)]"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="text-[var(--landing-text)] font-semibold tracking-tight">
              WebSerbisyo{" "}
              <span className="font-bold">RSVP</span>
            </span>
          </Link>

          {/* Desktop Center Links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (!link.soon) handleNavClick(e, link.href);
                }}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-border-strong)] rounded-full",
                  link.soon
                    ? "text-[var(--landing-text)]/40 cursor-default pointer-events-none"
                    : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
                )}
              >
                <span>{link.label}</span>
                {link.soon && (
                  <span className="text-[0.55rem] font-bold tracking-widest text-[rgba(234,179,8,0.72)] uppercase">
                    Soon
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Right Auth Group */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/login"
              className="landing-login-link text-sm"
            >
              Log in
            </Link>
            <TrackedLink
              href="/apply"
              className="landing-cta-button group/nav-cta h-8 px-4 text-sm gap-1.5"
              trackingEvent="StartApplicationClick"
              trackingParams={{
                content_category: "RSVP Website Application",
                destination: "/apply",
                source: "navbar",
              }}
            >
              Get started
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/nav-cta:translate-x-0.5" />
            </TrackedLink>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
              className="text-[var(--landing-text)] hover:bg-white/10 hover:text-[var(--landing-text)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 flex flex-col p-4 sm:p-6 bg-[var(--landing-bg)]/90 backdrop-blur-sm lg:hidden pointer-events-auto"
        >
          {/* Top Mini Bar */}
          <div className="flex items-center justify-between rounded-full border border-[var(--landing-border)] bg-[var(--landing-panel-strong)] px-6 py-3 shadow-sm backdrop-blur-xl mb-4">
            <Link
              href="/"
              className="flex items-center focus-visible:outline-none"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-[var(--landing-text)] font-semibold tracking-tight">
                WebSerbisyo{" "}
                <span className="font-bold">RSVP</span>
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-[var(--landing-muted)] hover:text-[var(--landing-text)] hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Nav Links Panel */}
          <div className="flex flex-col rounded-3xl border border-[var(--landing-border)] bg-[var(--landing-panel-strong)] p-6 shadow-xl backdrop-blur-xl h-full max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (!link.soon) handleNavClick(e, link.href);
                  }}
                  className={cn(
                    "flex items-center text-lg font-medium py-3 border-b border-[var(--landing-border)] last:border-0 transition-colors",
                    link.soon
                      ? "text-[var(--landing-text)]/30 pointer-events-none"
                      : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
                  )}
                >
                  <span>{link.label}</span>
                  {link.soon && (
                    <span className="ml-2 text-[rgba(234,179,8,0.72)] text-[0.65rem] font-bold tracking-widest uppercase">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-auto pt-8 flex flex-col gap-3">
              <Link
                href="/login"
                className="landing-login-link justify-center h-12 text-base border border-[var(--landing-border)] hover:border-[var(--landing-border-strong)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <TrackedLink
                href="/apply"
                className="landing-cta-button justify-center h-12 text-base"
                onClick={() => setIsMobileMenuOpen(false)}
                trackingEvent="StartApplicationClick"
                trackingParams={{
                  content_category: "RSVP Website Application",
                  destination: "/apply",
                  source: "navbar",
                }}
              >
                Get started
              </TrackedLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
