import type { CSSProperties } from "react";

export function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-black/[0.06] ${className}`}
      style={style}
    />
  );
}
