export type PipelineStatus = {
  count: number;
  key?: string;
  label: string;
  tone: "gray" | "blueLight" | "blue" | "green" | "red";
};

export type DashboardPipelineStageWeight = {
  count: number;
  key: string;
  label: string;
  baseCurrencyValue?: number;
  weightPercent: number;
};

export type DashboardAssessmentProcess = {
  automation?: string;
  automationLevel?: number;
  category?: string;
  cost?: string;
  estimatedCost?: {
    amount?: number;
    baseAmount?: {
      amount?: number;
      currency?: string;
    };
    currency?: string;
  };
  costInputs?: {
    dedicatedFte?: {
      annualSalaryPerFte?: DashboardCurrencyAmount;
      count?: number;
    };
    efficiencyPercent?: number;
    nonStaffingAnnualCost?: DashboardCurrencyAmount;
    sharedFtePool?: {
      allocationPercent?: number;
      annualSalaryPerFte?: DashboardCurrencyAmount;
      count?: number;
    };
  } | null;
  description?: string;
  ftes?: string;
  hoursPerYear?: number;
  id?: string;
  name?: string;
  processId?: string;
  saving?: string;
  software?: string;
  source?: string;
  stack?: string[];
  tier?: string;
};

export type DashboardCount = {
  count: number;
  label: string;
};

export type DashboardValue = {
  label: string;
  value: number;
};

export type DashboardCurrencyAmount = {
  amount?: number;
  currency?: string;
};

export type DashboardSummary = {
  activePipelineCount?: number;
  averageDigitizationIndex?: number | null;
  closedWonCount?: number;
  totalBaseCurrencyCost?: number;
  totalBaseCurrencySavings?: number;
  weightedPipelineBaseCurrencyValue?: number;
};

export type DashboardTrendPoint = {
  month: string;
  value: number;
};

export type RecentAssessment = {
  company: string;
  contact: string;
  cost: string;
  createdAt?: string;
  currencyConversionRate?: number;
  domain?: string;
  id: string;
  industry: string;
  owner?: string;
  preferences?: {
    aiPreference?: string;
    companySize?: string;
    deploymentPreference?: string;
    magicQuadrant?: string;
  };
  processCount?: number;
  processes?: DashboardAssessmentProcess[];
  savings: string;
  score: string;
  selectedStackTools?: string[];
  savedCurrency?: string;
  status: string;
  statusKey?: string;
  totalCostInSavedCurrency?: string;
  updatedAt?: string;
};

export const pipelineStatuses: PipelineStatus[] = [
  { key: "draft", label: "Draft", count: 0, tone: "gray" },
  { key: "processes-in-progress", label: "Processes In Progress", count: 0, tone: "gray" },
  { key: "due-diligence", label: "Due Diligence", count: 0, tone: "blueLight" },
  { key: "results-ready", label: "Results Ready", count: 0, tone: "blueLight" },
  { key: "expert-booked", label: "Expert Booked", count: 0, tone: "blue" },
  { key: "closed-won", label: "Closed Won", count: 0, tone: "green" },
  { key: "closed-lost", label: "Closed Lost", count: 0, tone: "red" },
];
