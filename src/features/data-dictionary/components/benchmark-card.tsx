import { benchmarkMetrics } from "@/features/data-dictionary/model";

export function BenchmarkCard() {
  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-md border border-black/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="flex min-h-[47px] flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] px-6">
        <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
          GCC / MENA CX Benchmark
        </p>
        <button type="button" className="text-xs font-bold text-[#007AFF]">
          Edit in Settings -&gt;
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6 px-6 pt-6 pb-5 md:grid-cols-4">
        {benchmarkMetrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-2xl leading-none font-bold">{metric.value}</p>
            <p className="mt-2 text-xs font-semibold text-[#86868B]">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
