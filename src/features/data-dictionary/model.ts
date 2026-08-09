export type DictionaryIndustry = {
  associatedProcessCount?: number;
  displayOrder?: number;
  id: string;
  isActive?: boolean;
  name: string;
  slug?: string;
};

export type DictionaryDomain = {
  displayOrder?: number;
  id: string;
  industryIds: string[];
  isActive?: boolean;
  name: string;
  slug?: string;
};

export type DictionaryLibrary = {
  displayOrder?: number;
  domainId: string;
  domainName: string;
  id: string;
  industryId: string;
  industryName: string;
  isActive?: boolean;
  processCount?: number;
};

export type DictionaryProcess = {
  category: string;
  categoryValue?: string;
  code: string;
  cost: string;
  costAmount?: number;
  costCurrency?: "AED" | "USD";
  description: string;
  domain: string;
  domainId?: string;
  hours: string;
  id: string;
  industryLabel?: string;
  industryIds: string[];
  isActive?: boolean;
  isDeleted?: boolean;
  name: string;
  scope?: "industry-default" | "industry-domain";
  source: string;
  tier: ProcessTier;
  tierValue?: string;
};

export type ProcessTier = string;

export type ProcessOption = {
  label: string;
  value: string;
};

export type TechnologyPricingConfidence = "published" | "indicative" | "quote-required";

export type TechStackBenchmarkPricing = {
  currency: "USD";
  monthlyOperationalCost: number | null;
  setupCost: number | null;
  sourceLabel?: string;
  sourceUrl?: string;
  checkedAt?: string | null;
  confidence?: TechnologyPricingConfidence;
};

export type TechStackTool = {
  benchmarkPricing?: TechStackBenchmarkPricing;
  category: string;
  description?: string;
  id: string;
  isActive?: boolean;
  name: string;
  vendor: string;
};

export const automationLevels = [
  {
    level: 1,
    label: "Manual",
    description: "Fully manual, people-driven process",
    color: "#EF4444",
  },
  {
    level: 2,
    label: "Mostly Manual",
    description: "Some tools used but majority is manual work",
    color: "#F97316",
  },
  {
    level: 3,
    label: "Partial",
    description: "Mix of manual and automated steps",
    color: "#EAB308",
  },
  {
    level: 4,
    label: "Mostly Automated",
    description: "Largely automated with minimal human intervention",
    color: "#22C55E",
  },
  {
    level: 5,
    label: "Fully Automated",
    description: "End-to-end automation, minimal human touchpoints",
    color: "#10B981",
  },
] as const;

export const processTiers = [
  { label: "Must-Have", slug: "must-have" },
  { label: "Good-to-Have", slug: "good-to-have" },
  { label: "Nice to Have", slug: "nice-to-have" },
  { label: "Future Enhancement", slug: "future-enhancement" },
] as const satisfies readonly { label: ProcessTier; slug: string }[];

export const processCategories: ProcessOption[] = [
  { value: "lifecycle", label: "Lifecycle" },
  { value: "support", label: "Support" },
  { value: "insights", label: "Insights" },
  { value: "analytics", label: "Analytics" },
  { value: "strategy", label: "Strategy" },
  { value: "data", label: "Data" },
  { value: "engagement", label: "Engagement" },
  { value: "operations", label: "Operations" },
  { value: "compliance", label: "Compliance" },
];

export const benchmarkMetrics = [
  { value: "18%", label: "Bottom Quartile" },
  { value: "38%", label: "Median" },
  { value: "65%", label: "Top Quartile" },
  { value: "78%", label: "Best-in-Class" },
] as const;

export const initialIndustries: DictionaryIndustry[] = [
  { id: "banking", name: "Banking" },
  { id: "healthcare", name: "Healthcare" },
  { id: "insurance", name: "Insurance" },
  { id: "retail", name: "Retail" },
  { id: "public-sector", name: "Public Sector" },
  { id: "real-estate", name: "Real Estate" },
  { id: "automotive", name: "Automotive" },
];

export const initialDomains: DictionaryDomain[] = [
  {
    id: "customer-experience",
    name: "Customer Experience",
    industryIds: ["banking", "retail", "healthcare"],
  },
  { id: "human-resources", name: "Human Resources", industryIds: ["banking", "healthcare"] },
  {
    id: "finance-accounting",
    name: "Finance & Accounting",
    industryIds: ["banking", "insurance", "real-estate"],
  },
  { id: "sales", name: "Sales", industryIds: ["retail", "automotive"] },
  { id: "marketing", name: "Marketing", industryIds: ["retail", "automotive"] },
  { id: "it-operations", name: "IT Operations", industryIds: ["public-sector", "healthcare"] },
  {
    id: "admin-facilities",
    name: "Admin & Facilities",
    industryIds: ["public-sector", "real-estate"],
  },
  {
    id: "bpo-shared-services",
    name: "BPO / Shared Services",
    industryIds: ["banking", "insurance"],
  },
];

export const initialProcessRows: DictionaryProcess[] = [];
