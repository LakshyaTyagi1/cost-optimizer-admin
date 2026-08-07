type AssessmentMobileMetricProps = {
  className?: string;
  compact?: boolean;
  label: string;
  mutedValue?: string;
  tone?: "blue" | "default" | "green";
  value: string;
};

export function AssessmentMobileMetric({
  className = "",
  compact = false,
  label,
  mutedValue = "--",
  tone = "default",
  value,
}: AssessmentMobileMetricProps) {
  const toneClass =
    tone === "blue"
      ? "text-[#007AFF]"
      : tone === "green"
        ? "text-[#10B981]"
        : "text-[#171717]";
  const shellClass = compact
    ? "px-1.5 py-1.5 sm:px-3 sm:py-2"
    : "px-3 py-2";
  const labelClass = compact
    ? "text-[9px] leading-3"
    : "text-[9px]";
  const valueClass = compact
    ? "break-words text-xs leading-4 tabular-nums"
    : "truncate text-xs";
  const valueSpacingClass = compact ? "mt-0.5 sm:mt-1" : "mt-1";

  return (
    <div className={`min-w-0 rounded-md bg-[#F8FAFC] ${shellClass} ${className}`}>
      <p className={`${labelClass} font-bold tracking-[0.12em] text-[#8E9AAB] uppercase`}>
        {label}
      </p>
      <p className={`${valueSpacingClass} font-bold ${toneClass} ${valueClass}`}>
        <MetricValue value={value} mutedValue={mutedValue} />
      </p>
    </div>
  );
}

function MetricValue({ mutedValue, value }: { mutedValue: string; value: string }) {
  if (!value || value === mutedValue) {
    return <span className="text-[#A1A1AA]">{mutedValue}</span>;
  }

  return <span>{value}</span>;
}
