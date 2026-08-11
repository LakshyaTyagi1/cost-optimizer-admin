import type { AssessmentStatusTone } from "@/features/assessments/utils/status";

const statusStyles = {
  gray: {
    chip: "bg-[#8E9AAB1A] text-[#566170]",
    dot: "bg-[#8E9AAB]",
  },
  grayLight: {
    chip: "bg-[#AEAEB21A] text-[#626267]",
    dot: "bg-[#AEAEB2]",
  },
  blueLight: {
    chip: "bg-[#6E8FC71A] text-[#365F9E]",
    dot: "bg-[#6E8FC7]",
  },
  blueMuted: {
    chip: "bg-[#4A7CD61A] text-[#285BAE]",
    dot: "bg-[#4A7CD6]",
  },
  blue: {
    chip: "bg-[#007AFF1A] text-[#005DB8]",
    dot: "bg-[#007AFF]",
  },
  green: {
    chip: "bg-[#10B9811A] text-[#087A58]",
    dot: "bg-[#10B981]",
  },
  red: {
    chip: "bg-[#EF44441A] text-[#B4232D]",
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
      className={`inline-flex h-[25px] w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] leading-[16.5px] font-medium tracking-[0.06px] ${styles.chip}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}
