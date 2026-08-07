type AssessmentMobileMetricProps = {
  compact?: boolean;
  label: string;
  mutedValue?: string;
  tone?: "blue" | "default" | "green";
  value: string;
};

export function AssessmentMobileMetric({
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
    ? "px-2 py-2 min-[380px]:px-3"
    : "px-3 py-2";
  const labelClass = compact
    ? "text-[8px] min-[380px]:text-[9px]"
    : "text-[9px]";
  const valueClass = compact
    ? "break-words text-[10px] leading-4 min-[380px]:text-xs"
    : "truncate text-xs";

  return (
    <div className={`min-w-0 rounded-md bg-[#F8FAFC] ${shellClass}`}>
      <p className={`${labelClass} font-bold tracking-[0.12em] text-[#8E9AAB] uppercase`}>
        {label}
      </p>
      <p className={`mt-1 font-bold ${toneClass} ${valueClass}`}>
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
