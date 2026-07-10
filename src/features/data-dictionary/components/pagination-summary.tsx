import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationSummary({
  currentPage,
  label,
  onPageChange,
  pages,
  variant = "default",
}: {
  currentPage: number;
  label: string;
  onPageChange: (page: number) => void;
  pages: readonly number[];
  variant?: "default" | "processLibrary" | "technologyStack";
}) {
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = pages.length > 0 && currentPage < pages[pages.length - 1];

  if (variant === "processLibrary" || variant === "technologyStack") {
    return (
      <div
        className={`mt-5 flex h-[41px] items-center justify-between border-t border-black/[0.05] text-[10px] leading-none font-medium text-[#86868B] ${
          variant === "processLibrary" ? "-mx-5 px-5" : "-mx-6 px-6"
        }`}
      >
        <span>{label}</span>
        {pages.length ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPreviousPage}
              className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] bg-white text-[#555555] transition hover:border-[#B8D8FF] hover:text-[#007AFF] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/[0.08] disabled:hover:text-[#555555]"
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft size={13} aria-hidden="true" />
            </button>
            {pages.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`flex size-7 items-center justify-center rounded-md border text-[13px] leading-none font-bold transition ${
                  page === currentPage
                    ? "border-[#007AFF] bg-[#007AFF] text-white"
                    : "border-black/[0.08] bg-white text-[#555555] hover:border-[#B8D8FF] hover:text-[#007AFF]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] bg-white text-[#555555] transition hover:border-[#B8D8FF] hover:text-[#007AFF] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/[0.08] disabled:hover:text-[#555555]"
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#86868B]">
      <span>{label}</span>
      {pages.length ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="flex size-7 items-center justify-center rounded-md border border-black/[0.05] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
            aria-label="Previous page"
          >
            &lt;
          </button>
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${page === currentPage ? "border-[#007AFF] bg-[#007AFF] text-white" : "border-black/[0.08] bg-white text-[#555555]"}`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      ) : null}
    </div>
  );
}

