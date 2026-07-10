import type { ProcessTier } from "@/features/data-dictionary/model";

const tierStyles: Record<ProcessTier, { bg: string; text: string; dot: string }> = {
  "Must-Have": { bg: "bg-[#DFF8EE]", text: "text-[#10B981]", dot: "bg-[#10B981]" },
  "Good-to-Have": { bg: "bg-[#EAF3FF]", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  "Nice to Have": { bg: "bg-[#F0F0F0]", text: "text-[#86868B]", dot: "bg-[#86868B]" },
  "Future Enhancement": { bg: "bg-[#F1EAFE]", text: "text-[#8B5CF6]", dot: "bg-[#8B5CF6]" },
};
const fallbackTierStyle = { bg: "bg-[#F5F5F7]", text: "text-[#555555]", dot: "bg-[#A1A1AA]" };

export function TierPill({ compact = false, tier }: { compact?: boolean; tier: ProcessTier }) {
  const styles = tierStyles[tier] ?? fallbackTierStyle;

  return (
    <span
      className={`inline-flex w-fit items-center justify-center gap-1.5 rounded-full font-bold ${
        compact ? "h-[25px] px-3 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${styles.bg} ${styles.text}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {tier}
    </span>
  );
}

