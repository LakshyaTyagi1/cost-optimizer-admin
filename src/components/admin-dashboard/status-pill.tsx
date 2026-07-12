import { normalizeStatusKey } from "@/features/dashboard/utils/dashboard-view-data";

import { pipelineStatusRowStyles, statusStyles } from "./dashboard-styles";

export function StatusPill({ label, tone }: { label: string; tone: keyof typeof statusStyles }) {
  const styles = statusStyles[tone];
  const statusKey = normalizeStatusKey(label);
  const rowStyles = pipelineStatusRowStyles[statusKey];
  const chipColorClassName = rowStyles ? `${rowStyles.bar} ${rowStyles.count}` : styles.chip;
  const dotColorClassName = rowStyles?.icon || styles.dot;

  return (
    <span
      aria-label={`Status: ${label}`}
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium leading-[16.5px] tracking-[0.06px] ${chipColorClassName}`}
    >
      <span className={`size-1.5 rounded-full ${dotColorClassName}`} aria-hidden="true" />
      {label}
    </span>
  );
}
