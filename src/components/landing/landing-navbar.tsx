"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
    <header className="landing-theme-dark pointer-events-none fixed top-0 left-0 z-50 w-full transition-all duration-300">
      {/* Desktop & Mobile Top Bar */}
      <div
        className={cn(
          "pointer-events-auto mx-auto w-full px-4 transition-all duration-500 ease-in-out sm:px-6",
          isScrolled ? "max-w-6xl py-4" : "max-w-7xl py-6",
        )}
      >
        <nav
          aria-label="Main navigation"
          className={cn(
            "flex items-center justify-between transition-all duration-500 ease-in-out",
            isScrolled
              ? "rounded-full border border-[var(--landing-border)] bg-[var(--landing-panel-strong)] px-6 py-3 shadow-[0_8px_32px_rgb(0_0_0/0.24)] backdrop-blur-md"
              : "rounded-2xl border border-transparent bg-transparent px-2 py-0",
          )}
        >
          {/* Brand / Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-[var(--landing-border-strong)] focus-visible:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-white/20 shadow-sm">
              <Image
                src="/icons/apple-touch-icon.png"
                alt=""
                width={28}
                height={28}
                aria-hidden="true"
                className="size-full object-cover select-none"
              />
            </div>
            <span className="font-semibold tracking-tight text-[var(--landing-text)]">
              WebSerbisyo <span className="font-bold">RSVP</span>
            </span>
          </Link>

          {/* Desktop Center Links */}
          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (!link.soon) handleNavClick(e, link.href);
                }}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--landing-border-strong)] focus-visible:outline-none",
                  link.soon
                    ? "pointer-events-none cursor-default text-[var(--landing-text)]/40"
                    : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]",
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
          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login" className="landing-login-link text-sm">
              Log in
            </Link>
            <TrackedLink
              href="/apply"
              className="landing-cta-button group/nav-cta h-8 gap-1.5 px-4 text-sm"
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

          {/* Mobile Menu Toggle (Hit Target >= 44x44 CSS px) */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
              className="flex h-11 w-11 items-center justify-center rounded-full p-0 text-[var(--landing-text)] hover:bg-white/10 hover:text-[var(--landing-text)]"
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
          className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-[var(--landing-bg)]/90 p-4 backdrop-blur-sm sm:p-6 lg:hidden"
        >
          {/* Top Mini Bar */}
          <div className="mb-4 flex items-center justify-between rounded-full border border-[var(--landing-border)] bg-[var(--landing-panel-strong)] px-6 py-3 shadow-sm backdrop-blur-xl">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-white/20 shadow-sm">
                <Image
                  src="/icons/apple-touch-icon.png"
                  alt=""
                  width={28}
                  height={28}
                  aria-hidden="true"
                  className="size-full object-cover select-none"
                />
              </div>
              <span className="font-semibold tracking-tight text-[var(--landing-text)]">
                WebSerbisyo <span className="font-bold">RSVP</span>
              </span>
            </Link>
            <Button
              variant="ghost"
              className="flex h-11 w-11 items-center justify-center rounded-full p-0 text-[var(--landing-muted)] hover:bg-white/10 hover:text-[var(--landing-text)]"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Nav Links Panel */}
          <div className="flex h-full max-h-[calc(100vh-8rem)] flex-col overflow-y-auto rounded-3xl border border-[var(--landing-border)] bg-[var(--landing-panel-strong)] p-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (!link.soon) handleNavClick(e, link.href);
                  }}
                  className={cn(
                    "flex items-center border-b border-[var(--landing-border)] py-3 text-lg font-medium transition-colors last:border-0",
                    link.soon
                      ? "pointer-events-none text-[var(--landing-text)]/30"
                      : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]",
                  )}
                >
                  <span>{link.label}</span>
                  {link.soon && (
                    <span className="ml-2 text-[0.65rem] font-bold tracking-widest text-[rgba(234,179,8,0.72)] uppercase">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Link
                href="/login"
                className="landing-login-link h-12 justify-center border border-[var(--landing-border)] text-base hover:border-[var(--landing-border-strong)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <TrackedLink
                href="/apply"
                className="landing-cta-button h-12 justify-center text-base"
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
