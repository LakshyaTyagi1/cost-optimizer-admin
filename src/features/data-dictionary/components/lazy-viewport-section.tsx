"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LazyViewportSectionProps = {
  children: ReactNode;
  minHeight: number;
  onVisible?: () => void;
};

export function LazyViewportSection({
  children,
  minHeight,
  onVisible,
}: LazyViewportSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const hasNotifiedRef = useRef(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) {
      return;
    }

    const sectionNode = sectionRef.current;

    if (!sectionNode) {
      return;
    }

    function revealSection() {
      if (!hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        onVisible?.();
      }

      setShouldRender(true);
    }

    if (typeof IntersectionObserver === "undefined") {
      const fallbackTimer = setTimeout(revealSection, 0);

      return () => clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          revealSection();
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(sectionNode);

    return () => observer.disconnect();
  }, [onVisible, shouldRender]);

  if (shouldRender) {
    return <>{children}</>;
  }

  return (
    <div
      ref={sectionRef}
      aria-hidden="true"
      className="mt-5"
      style={{ minHeight }}
    />
  );
}
