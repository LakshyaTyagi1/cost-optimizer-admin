"use client";

import { useIsFetching } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const minimumVisibleMs = 220;

export function RouteProgressBar() {
  const pathname = usePathname();
  const activeFetchCount = useIsFetching();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const lastPathnameRef = useRef(pathname);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    clearHideTimer();
    startedAtRef.current = Date.now();
    setIsVisible(true);
    setProgress((currentProgress) =>
      currentProgress > 0 && currentProgress < 95 ? currentProgress : 12,
    );
  }, [clearHideTimer]);

  const finishProgress = useCallback(() => {
    const elapsedMs = Date.now() - startedAtRef.current;
    const delayMs = Math.max(minimumVisibleMs - elapsedMs, 80);

    setProgress(100);
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      hideTimerRef.current = null;
    }, delayMs);
  }, [clearHideTimer]);

  useEffect(() => {
    function handleNavigationStart(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");

      if (!anchor || anchor.target || anchor.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (
        nextUrl.origin !== currentUrl.origin ||
        (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search)
      ) {
        return;
      }

      startProgress();
    }

    window.addEventListener("popstate", startProgress);
    document.addEventListener("click", handleNavigationStart, true);

    return () => {
      window.removeEventListener("popstate", startProgress);
      document.removeEventListener("click", handleNavigationStart, true);
    };
  }, [startProgress]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress((currentProgress) => {
        if (currentProgress >= 92) {
          return currentProgress;
        }

        return currentProgress + Math.max(1, (92 - currentProgress) * 0.12);
      });
    }, 180);

    return () => clearInterval(progressTimer);
  }, [isVisible]);

  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      setProgress((currentProgress) => Math.max(currentProgress, 72));
    }
  }, [pathname]);

  useEffect(() => {
    const syncProgressTimer = setTimeout(() => {
      if (activeFetchCount > 0) {
        startProgress();
        return;
      }

      if (isVisible) {
        finishProgress();
      }
    }, 0);

    return () => clearTimeout(syncProgressTimer);
  }, [activeFetchCount, finishProgress, isVisible, startProgress]);

  useEffect(
    () => () => {
      clearHideTimer();
    },
    [clearHideTimer],
  );

  return (
    <div
      aria-hidden={!isVisible}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(progress)}
      className={`pointer-events-none fixed top-0 left-0 z-[9999] h-[3px] w-full overflow-hidden bg-transparent transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="progressbar"
    >
      <div
        className="h-full rounded-r-full bg-[#007AFF] shadow-[0_0_12px_rgba(0,122,255,0.38)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
