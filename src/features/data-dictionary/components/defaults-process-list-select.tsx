"use client";

import { Check, ChevronDown, ListFilter } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

export type DefaultsProcessListOption = {
  count: number;
  isConfigured?: boolean;
  label: string;
  value: string;
};

type DefaultsProcessListSelectProps = {
  className?: string;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: DefaultsProcessListOption[];
  value: string;
};

type DropdownPosition = {
  left: number;
  placement: "above" | "below";
  top: number;
};

const viewportInset = 12;
const dropdownGap = 6;

export function DefaultsProcessListSelect({
  className = "",
  disabled = false,
  label,
  onChange,
  options,
  value,
}: DefaultsProcessListSelectProps) {
  const labelId = useId();
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const typeaheadTimerRef = useRef<number | null>(null);
  const typeaheadValueRef = useRef("");
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedOption = options[selectedIndex];
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  const clearTypeahead = useCallback(() => {
    if (typeaheadTimerRef.current !== null) {
      window.clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = null;
    }
    typeaheadValueRef.current = "";
  }, []);

  const closeDropdown = useCallback(
    (restoreFocus = false) => {
      setIsOpen(false);
      setDropdownPosition(null);
      clearTypeahead();
      if (restoreFocus) {
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    },
    [clearTypeahead],
  );

  const openDropdown = useCallback(
    (nextActiveIndex = selectedIndex) => {
      if (disabled || options.length === 0) {
        return;
      }
      setActiveIndex(nextActiveIndex);
      setIsOpen(true);
    },
    [disabled, options.length, selectedIndex],
  );

  const selectOption = useCallback(
    (optionIndex: number) => {
      const option = options[optionIndex];
      if (!option) {
        return;
      }
      onChange(option.value);
      setActiveIndex(optionIndex);
      closeDropdown(true);
    },
    [closeDropdown, onChange, options],
  );

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const dropdown = dropdownRef.current;
    if (!trigger || !dropdown) {
      return;
    }

    const triggerBounds = trigger.getBoundingClientRect();
    const dropdownBounds = dropdown.getBoundingClientRect();
    const spaceAbove = triggerBounds.top - viewportInset;
    const spaceBelow = window.innerHeight - triggerBounds.bottom - viewportInset;
    const placement =
      spaceBelow >= dropdownBounds.height || spaceBelow >= spaceAbove ? "below" : "above";
    const idealTop =
      placement === "below"
        ? triggerBounds.bottom + dropdownGap
        : triggerBounds.top - dropdownBounds.height - dropdownGap;
    const idealLeft = triggerBounds.right - dropdownBounds.width;
    const top = Math.min(
      Math.max(idealTop, viewportInset),
      Math.max(viewportInset, window.innerHeight - dropdownBounds.height - viewportInset),
    );
    const left = Math.min(
      Math.max(idealLeft, viewportInset),
      Math.max(viewportInset, window.innerWidth - dropdownBounds.width - viewportInset),
    );

    setDropdownPosition((currentPosition) => {
      if (
        currentPosition?.left === left &&
        currentPosition.top === top &&
        currentPosition.placement === placement
      ) {
        return currentPosition;
      }
      return { left, placement, top };
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        closeDropdown();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeDropdown(true);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeDropdown, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const frameId = window.requestAnimationFrame(() => {
      document
        .getElementById(`${listboxId}-option-${Math.max(0, activeIndex)}`)
        ?.scrollIntoView({ block: "nearest" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeIndex, isOpen, listboxId]);

  useEffect(
    () => () => {
      clearTypeahead();
    },
    [clearTypeahead],
  );

  function handleTypeahead(key: string) {
    if (typeaheadTimerRef.current !== null) {
      window.clearTimeout(typeaheadTimerRef.current);
    }
    typeaheadValueRef.current = `${typeaheadValueRef.current}${key.toLowerCase()}`;
    const searchValue = typeaheadValueRef.current;
    const nextIndex = options.findIndex((option) =>
      option.label.toLowerCase().startsWith(searchValue),
    );
    if (nextIndex >= 0) {
      setActiveIndex(nextIndex);
      if (!isOpen) {
        openDropdown(nextIndex);
      }
    }
    typeaheadTimerRef.current = window.setTimeout(clearTypeahead, 650);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled || options.length === 0) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        const initialIndex =
          event.key === "ArrowDown"
            ? selectedIndex
            : selectedIndex > 0
              ? selectedIndex
              : options.length - 1;
        openDropdown(initialIndex);
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (currentIndex) => (currentIndex + direction + options.length) % options.length,
      );
      return;
    }

    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) {
        selectOption(activeIndex);
      } else {
        openDropdown();
      }
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      closeDropdown();
      return;
    }

    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      handleTypeahead(event.key);
    }
  }

  const handleOptionMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className={`min-w-0 ${className}`}>
      <span
        id={labelId}
        className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#68686D] uppercase"
      >
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-activedescendant={
          isOpen ? `${listboxId}-option-${Math.max(0, activeIndex)}` : undefined
        }
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        disabled={disabled}
        onBlur={() => closeDropdown()}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className={`group flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border bg-white px-2.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition focus-visible:ring-2 focus-visible:ring-[#007AFF]/15 focus-visible:outline-none disabled:cursor-wait disabled:bg-[#F7F8FA] disabled:opacity-60 ${
          isOpen
            ? "border-[#007AFF] ring-2 ring-[#007AFF]/12"
            : "border-[#C9DBEE] hover:border-[#8ABCF2] hover:bg-[#FCFDFF]"
        }`}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#EAF4FF] text-[#007AFF]">
          <ListFilter size={13} strokeWidth={2.1} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#333]">
          {selectedOption?.label || "Choose process list"}
        </span>
        {selectedOption ? (
          <span className="inline-flex h-5 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] px-1.5 text-[10px] font-bold text-[#667085] group-hover:bg-[#EAF4FF] group-hover:text-[#0063CC]">
            {selectedOption.count}
          </span>
        ) : null}
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#68686D] transition-transform duration-150 ${isOpen ? "rotate-180 text-[#007AFF]" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[90] w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#BFD9F6] bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
              style={{
                left: dropdownPosition?.left ?? 0,
                top: dropdownPosition?.top ?? 0,
                visibility: dropdownPosition ? "visible" : "hidden",
              }}
            >
              <div
                id={listboxId}
                role="listbox"
                aria-labelledby={labelId}
                className="max-h-[min(320px,calc(100dvh-48px))] overflow-y-auto overscroll-contain pr-0.5"
              >
                {options.map((option, optionIndex) => {
                  const isSelected = option.value === value;
                  const isActive = optionIndex === activeIndex;
                  return (
                    <div key={option.value}>
                      <div
                        id={`${listboxId}-option-${optionIndex}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectOption(optionIndex)}
                        onMouseDown={handleOptionMouseDown}
                        onMouseEnter={() => setActiveIndex(optionIndex)}
                        className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                          isSelected
                            ? "bg-[#EAF4FF] text-[#005CC8]"
                            : isActive
                              ? "bg-[#F3F7FB] text-[#171717]"
                              : "text-[#333] hover:bg-[#F7FAFC]"
                        }`}
                      >
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                            isSelected
                              ? "border-[#007AFF] bg-[#007AFF] text-white"
                              : "border-black/[0.08] bg-white text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                          {option.label}
                        </span>
                        {typeof option.isConfigured === "boolean" ? (
                          <span
                            className={`inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-[9px] font-bold whitespace-nowrap ${
                              option.isConfigured
                                ? "border-[#B7E4CE] bg-[#F0FDF4] text-[#16794A]"
                                : "border-[#D9E3F0] bg-[#F5F8FB] text-[#68686D]"
                            }`}
                            title={
                              option.isConfigured
                                ? "Industry is added to the system"
                                : "Industry is not added to the system"
                            }
                          >
                            {option.isConfigured ? "Configured" : "Not configured"}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex h-5 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                            isSelected
                              ? "bg-white text-[#0063CC] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                              : "bg-[#F1F5F9] text-[#667085]"
                          }`}
                        >
                          {option.count}
                        </span>
                      </div>
                      {optionIndex === 0 && options.length > 1 ? (
                        <div className="mx-2 my-1 h-px bg-black/[0.06]" aria-hidden="true" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
