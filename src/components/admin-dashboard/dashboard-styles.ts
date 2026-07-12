import {
  Building2,
  Car,
  Home,
  Landmark,
  LayoutGrid,
  Shield,
  ShoppingBag,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export const statToneStyles = {
  neutral: "text-[#000000]",
  blue: "text-[#007AFF]",
  green: "text-[#10B981]",
} as const;

export const statusStyles = {
  gray: { icon: "bg-[#AEAEB2]", chip: "bg-[#F5F5F5] text-[#555555]", dot: "bg-[#9CA3AF]", bar: "bg-[#F5F5F5]" },
  blueLight: { icon: "bg-[#6E9FF8]", chip: "bg-[#EEF5FF] text-[#4D7FEA]", dot: "bg-[#6E9FF8]", bar: "bg-[#EEF5FF]" },
  blue: { icon: "bg-[#007AFF]", chip: "bg-[#EAF3FF] text-[#007AFF]", dot: "bg-[#007AFF]", bar: "bg-[#EAF3FF]" },
  green: { icon: "bg-[#10B981]", chip: "bg-[#ECFDF5] text-[#10B981]", dot: "bg-[#10B981]", bar: "bg-[#ECFDF5]" },
  red: { icon: "bg-[#EF4444]", chip: "bg-[#FEF2F2] text-[#EF4444]", dot: "bg-[#EF4444]", bar: "bg-[#FEF2F2]" },
} as const;

export const pipelineStatusRowStyles: Record<string, { bar: string; count: string; icon: string }> = {
  draft: {
    bar: "bg-[#AEAEB21A]",
    count: "text-[#AEAEB2]",
    icon: "bg-[#AEAEB2]",
  },
  "processes-in-progress": {
    bar: "bg-[#8E9AAB1A]",
    count: "text-[#8E9AAB]",
    icon: "bg-[#8E9AAB]",
  },
  "due-diligence": {
    bar: "bg-[#6E8FC71A]",
    count: "text-[#6E8FC7]",
    icon: "bg-[#6E8FC7]",
  },
  "results-ready": {
    bar: "bg-[#4A7CD61A]",
    count: "text-[#4A7CD6]",
    icon: "bg-[#4A7CD6]",
  },
  "expert-booked": {
    bar: "bg-[#007AFF1A]",
    count: "text-[#007AFF]",
    icon: "bg-[#007AFF]",
  },
  "closed-won": {
    bar: "bg-[#10B9811A]",
    count: "text-[#10B981]",
    icon: "bg-[#10B981]",
  },
  "closed-lost": {
    bar: "bg-[#EF44441A]",
    count: "text-[#EF4444]",
    icon: "bg-[#EF4444]",
  },
};

export const recentAssessmentGridClassName =
  "grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(240px,280px)_minmax(118px,140px)_64px_120px_120px_210px_190px_14px] xl:justify-between";

export const dashboardPanelTransitionClassName =
  "transform-gpu transition-[opacity,transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none";

export const industryIconStyles: Record<string, { className: string; icon: LucideIcon; size?: number }> = {
  automotive: { className: "text-[#86868B]", icon: Car },
  banking: { className: "text-[#86868B]", icon: Building2 },
  healthcare: { className: "text-[#86868B]", icon: Stethoscope },
  insurance: { className: "text-[#86868B]", icon: Shield, size: 13 },
  "public sector": { className: "text-[#86868B]", icon: Building2 },
  "real estate": { className: "text-[#86868B]", icon: Home },
  retail: { className: "text-[#86868B]", icon: ShoppingBag },
};

export const industryBreakdownIconStyles: Record<string, { icon: LucideIcon; size?: number }> = {
  automotive: { icon: Car },
  banking: { icon: Landmark },
  healthcare: { icon: Stethoscope },
  insurance: { icon: Shield, size: 13 },
  "public sector": { icon: Building2 },
  "real estate": { icon: Home },
  retail: { icon: ShoppingBag },
};

export { LayoutGrid };
