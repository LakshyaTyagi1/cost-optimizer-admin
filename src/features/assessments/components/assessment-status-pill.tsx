import type { AssessmentStatusTone } from "@/features/assessments/utils/status";

const statusStyles = {
  gray: {
    chip: "bg-[#F5F5F5] text-[#8E9AAB]",
    dot: "bg-[#C1C7D0]",
  },
  blueLight: {
    chip: "bg-[#EEF5FF] text-[#4D7FEA]",
    dot: "bg-[#6E9FF8]",
  },
  blue: {
    chip: "bg-[#EAF3FF] text-[#007AFF]",
    dot: "bg-[#007AFF]",
  },
  green: {
    chip: "bg-[#ECFDF5] text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  red: {
    chip: "bg-[#FEF2F2] text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
} as const satisfies Record<AssessmentStatusTone, { chip: string; dot: string }>;

export function AssessmentStatusPill({
  label,
  tone,
}: {
  label: string;
  tone: AssessmentStatusTone;
}) {
  const styles = statusStyles[tone];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[11px] leading-[16.5px] font-medium tracking-[0.06px] !text-[#8E9AAB] ${styles.chip}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}
