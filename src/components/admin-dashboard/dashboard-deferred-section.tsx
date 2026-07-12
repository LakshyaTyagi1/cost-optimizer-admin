"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DashboardDeferredSectionProps = {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
};

export function DashboardDeferredSection({
  children,
  fallback,
  rootMargin = "320px 0px",
}: DashboardDeferredSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) {
      return;
    }

    function renderOnNextFrame() {
      const animationFrame = window.requestAnimationFrame(() => {
        setShouldRender(true);
      });

      return () => window.cancelAnimationFrame(animationFrame);
    }

    if (!("IntersectionObserver" in window)) {
      return renderOnNextFrame();
    }

    const sectionElement = sectionRef.current;

    if (!sectionElement) {
      return renderOnNextFrame();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(sectionElement);

    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return <div ref={sectionRef}>{shouldRender ? children : fallback}</div>;
}
