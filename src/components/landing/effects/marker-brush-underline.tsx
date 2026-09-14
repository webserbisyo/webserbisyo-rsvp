import type { SVGProps } from "react";

export function MarkerBrushUnderline({
  className = "w-full h-3 text-[#ff5a1f]",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 320 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Primary chisel stroke */}
      <path
        d="M2.5 12.5C45.2 7.1 112.8 4.2 184.5 5.8C236.4 7.0 292.1 10.4 317.5 14.8"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Secondary companion stroke for dual-line highlighter effect */}
      <path
        d="M18.2 18.2C68.9 14.8 138.4 12.6 211.2 13.9C258.8 14.8 288.5 17.2 305.8 19.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeOpacity="0.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
