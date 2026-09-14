import type { SVGProps } from "react";

interface HeroVideoFrameFallbackProps extends SVGProps<SVGSVGElement> {
  archetype?: string;
}

export function HeroVideoFrameFallback({
  archetype = "event",
  className = "w-full h-full",
  ...props
}: HeroVideoFrameFallbackProps) {
  return (
    <svg
      viewBox="0 0 960 540"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label={`${archetype} website interactive preview placeholder`}
      role="img"
      {...props}
    >
      <defs>
        <radialGradient id="hero-showcase-radial" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#181310" stopOpacity="0.9" />
          <stop offset="65%" stopColor="#0a0a0a" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#050505" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="hero-play-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Stage Background */}
      <rect width="960" height="540" fill="url(#hero-showcase-radial)" />

      {/* Grid Guidelines */}
      <path
        d="M 60 70 H 900 M 60 470 H 900"
        stroke="rgba(255, 255, 255, 0.06)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* 1. Prominent Top Label */}
      <g transform="translate(480, 85)">
        <rect
          x="-150"
          y="-16"
          width="300"
          height="32"
          rx="16"
          fill="rgba(255, 255, 255, 0.04)"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fill="#ff8a5c"
          fontSize="11"
          fontWeight="700"
          letterSpacing="0.08em"
        >
          🎬 16:9 SHOWCASE REEL FRAME
        </text>
      </g>

      {/* 2. Centered Play Glyph with Ambient Glow */}
      <circle cx="480" cy="270" r="120" fill="url(#hero-play-glow)" />
      <circle
        cx="480"
        cy="270"
        r="48"
        fill="#141414"
        stroke="#ff5a1f"
        strokeWidth="2.5"
        strokeOpacity="0.85"
      />
      <polygon points="473,254 496,270 473,286" fill="#ffffff" />

      {/* 3. Bottom Context Tag */}
      <g transform="translate(480, 440)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="12"
          fontWeight="500"
          letterSpacing="0.04em"
        >
          Interactive Guest RSVP Experience · Instant Mobile Preview
        </text>
      </g>
    </svg>
  );
}
