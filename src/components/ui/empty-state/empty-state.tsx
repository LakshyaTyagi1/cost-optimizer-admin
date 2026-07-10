export function EmptyState({
  className = "mt-4",
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <div
      className={`flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-black/[0.08] bg-[#FAFAFA] px-4 text-center text-xs font-semibold text-[#86868B] ${className}`}
    >
      {label}
    </div>
  );
}
