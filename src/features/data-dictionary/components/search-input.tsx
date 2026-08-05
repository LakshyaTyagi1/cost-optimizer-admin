import { Search, X } from "lucide-react";

export function SearchInput({
  className = "",
  onChange,
  placeholder,
  showClearOnHover = false,
  title,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  placeholder: string;
  showClearOnHover?: boolean;
  title?: string;
  value: string;
}) {
  const inputTitle = title || placeholder.replace("...", "");

  return (
    <label
      className={`group flex h-9 items-center gap-2 rounded-md border border-black/[0.08] px-3 focus-within:border-[#007AFF] ${className}`}
      title={inputTitle}
    >
      <Search size={14} className="text-[#A1A1AA]" aria-hidden="true" />
      <input
        aria-label={placeholder.replace("...", "")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 appearance-none text-xs font-semibold outline-none placeholder:text-[#A1A1AA] focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 [&::-webkit-search-cancel-button]:appearance-none"
        placeholder={placeholder}
        title={inputTitle}
        type="search"
      />
      {showClearOnHover && value ? (
        <button
          type="button"
          aria-label="Clear search"
          title="Clear search"
          onClick={() => onChange("")}
          className="pointer-events-none inline-flex size-5 flex-none cursor-pointer items-center justify-center rounded-full text-[#A1A1AA] opacity-0 transition hover:bg-black/[0.05] hover:text-[#555555] focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}

