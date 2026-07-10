type AssessmentMobileMetricProps = {
  label: string;
  mutedValue?: string;
  tone?: "blue" | "default" | "green";
  value: string;
};

export function AssessmentMobileMetric({
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

  return (
    <div className="min-w-0 rounded-md bg-[#F8FAFC] px-3 py-2">
      <p className="text-[9px] font-bold tracking-[0.12em] text-[#8E9AAB] uppercase">
        {label}
      </p>
      <p className={`mt-1 truncate text-xs font-bold ${toneClass}`}>
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
