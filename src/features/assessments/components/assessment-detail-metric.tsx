export function AssessmentDetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-black/[0.08] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <p className="text-[9px] font-bold tracking-[0.14em] text-[#86868B] uppercase">{label}</p>
      <p className="mt-2 text-[17px] leading-none font-bold text-[#171717]">{value}</p>
    </div>
  );
}
