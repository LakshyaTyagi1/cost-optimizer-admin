"use client";

import { FileText } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ProcessDescriptionPreviewProps = {
  description: string;
  processName: string;
};

type FloatingPanelPosition = {
  arrowLeft: number;
  left: number;
  placement: "above" | "below";
  top: number;
};

const viewportInset = 12;
const panelGap = 9;

export function ProcessDescriptionPreview({
  description,
  processName,
}: ProcessDescriptionPreviewProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<FloatingPanelPosition | null>(null);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const showDescription = useCallback(() => {
    cancelScheduledClose();
    setIsOpen(true);
  }, [cancelScheduledClose]);

  const hideDescription = useCallback(() => {
    cancelScheduledClose();
    setIsOpen(false);
    setPanelPosition(null);
  }, [cancelScheduledClose]);

  const scheduleHideDescription = useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(hideDescription, 120);
  }, [cancelScheduledClose, hideDescription]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (!trigger || !panel) {
      return;
    }

    const triggerBounds = trigger.getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();
    const spaceAbove = triggerBounds.top - viewportInset;
    const spaceBelow = window.innerHeight - triggerBounds.bottom - viewportInset;
    const placement =
      spaceBelow >= panelBounds.height || spaceBelow >= spaceAbove ? "below" : "above";
    const idealTop =
      placement === "below"
        ? triggerBounds.bottom + panelGap
        : triggerBounds.top - panelBounds.height - panelGap;
    const idealLeft = triggerBounds.left + triggerBounds.width / 2 - panelBounds.width / 2;
    const top = Math.min(
      Math.max(idealTop, viewportInset),
      Math.max(viewportInset, window.innerHeight - panelBounds.height - viewportInset),
    );
    const left = Math.min(
      Math.max(idealLeft, viewportInset),
      Math.max(viewportInset, window.innerWidth - panelBounds.width - viewportInset),
    );
    const arrowLeft = Math.min(
      Math.max(triggerBounds.left + triggerBounds.width / 2 - left, 18),
      panelBounds.width - 18,
    );

    setPanelPosition((currentPosition) => {
      if (
        currentPosition?.arrowLeft === arrowLeft &&
        currentPosition?.left === left &&
        currentPosition.top === top &&
        currentPosition.placement === placement
      ) {
        return currentPosition;
      }

      return { arrowLeft, left, placement, top };
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        hideDescription();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        hideDescription();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hideDescription, isOpen]);

  useEffect(
    () => () => {
      cancelScheduledClose();
    },
    [cancelScheduledClose],
  );

  if (!description) {
    return <span className="text-[#A1A1AA]">—</span>;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-label={`View full description for ${processName}`}
        onFocus={showDescription}
        onBlur={scheduleHideDescription}
        onMouseEnter={showDescription}
        onMouseLeave={scheduleHideDescription}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") {
            showDescription();
          }
        }}
        className="block w-full min-w-0 cursor-help rounded-md px-1 py-1 text-left transition-colors hover:bg-[#EDF6FF] focus-visible:bg-[#EDF6FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/35 focus-visible:outline-none"
      >
        <span className="block truncate">{description}</span>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={tooltipId}
              role="tooltip"
              onMouseEnter={cancelScheduledClose}
              onMouseLeave={scheduleHideDescription}
              className="fixed z-[80] w-[min(420px,calc(100vw-24px))] overflow-visible rounded-xl border border-[#BFD9F6] bg-white shadow-[0_16px_42px_rgba(15,23,42,0.18)]"
              style={{
                left: panelPosition?.left ?? 0,
                top: panelPosition?.top ?? 0,
                visibility: panelPosition ? "visible" : "hidden",
              }}
            >
              <span
                aria-hidden="true"
                className={`absolute size-3 -translate-x-1/2 rotate-45 bg-white ${
                  panelPosition?.placement === "above"
                    ? "-bottom-1.5 border-r border-b border-[#BFD9F6]"
                    : "-top-1.5 border-t border-l border-[#BFD9F6]"
                }`}
                style={{ left: panelPosition?.arrowLeft ?? 24 }}
              />
              <div className="flex items-center gap-2 border-b border-black/[0.06] px-4 py-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#EAF4FF] text-[#007AFF]">
                  <FileText size={14} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.08em] text-[#007AFF] uppercase">
                    Full description
                  </p>
                  <p className="truncate text-xs font-bold text-[#333]">{processName}</p>
                </div>
              </div>
              <div className="max-h-[min(280px,calc(100dvh-48px))] overflow-y-auto overscroll-contain px-4 py-3">
                <p className="text-xs leading-5 font-medium break-words whitespace-pre-wrap text-[#555]">
                  {description}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
