import { industryIconStyles, LayoutGrid } from "./dashboard-styles";

export function IndustryIcon({ industry }: { industry: string }) {
  const industryKey = industry.trim().toLowerCase().replace(/\s+/g, " ");
  const iconConfig = industryIconStyles[industryKey];
  const Icon = iconConfig?.icon || LayoutGrid;

  return (
    <Icon
      size={iconConfig?.size || 12}
      strokeWidth={1.75}
      className={`shrink-0 ${iconConfig?.className || "text-[#86868B]"}`}
      aria-hidden="true"
    />
  );
}
