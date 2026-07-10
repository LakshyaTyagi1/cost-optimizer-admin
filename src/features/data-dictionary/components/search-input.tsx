import { Search } from "lucide-react";

export function SearchInput({
  className = "",
  onChange,
  placeholder,
  title,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  placeholder: string;
  title?: string;
  value: string;
}) {
  const inputTitle = title || placeholder.replace("...", "");

  return (
    <label
      className={`flex h-9 items-center gap-2 rounded-md border border-black/[0.08] px-3 focus-within:border-[#007AFF] ${className}`}
      title={inputTitle}
    >
      <Search size={14} className="text-[#A1A1AA]" aria-hidden="true" />
      <input
        aria-label={placeholder.replace("...", "")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 text-xs font-semibold outline-none placeholder:text-[#A1A1AA] focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0"
        placeholder={placeholder}
        title={inputTitle}
        type="search"
      />
    </label>
  );
}

