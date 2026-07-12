export function ChartGrid({ columns, className = "inset-0" }: { columns: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
    >
      {Array.from({ length: columns + 1 }).map((_, index) => (
        <span
          key={index}
          className="absolute inset-y-0 border-l border-dashed border-[#F0F0F0]"
          style={{ left: `${(index / columns) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function ChartAxisTicks({ ticks, className = "bottom-0" }: { ticks: Array<number | string>; className?: string }) {
  const divisor = Math.max(1, ticks.length - 1);

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 h-4 text-[10px] font-normal text-[#86868B] sm:text-[11px] ${className}`}
    >
      {ticks.map((tick, index) => (
        <span
          key={`${tick}-${index}`}
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${(index / divisor) * 100}%` }}
        >
          {tick}
        </span>
      ))}
    </div>
  );
}
