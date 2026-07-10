export type AdminAssessmentRow = {
  company: string;
  contact: string;
  cost: string;
  createdAt?: string;
  currencyConversionRate?: number;
  customProcesses?: AdminAssessmentProcess[];
  domain?: string;
  email?: string;
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
  processes?: AdminAssessmentProcess[];
  savings: string;
  score: string;
  selectedStackTools?: string[];
  status: string;
  statusKey?: string;
  savedCurrency?: string;
  totalCostInSavedCurrency?: string;
  updatedAt?: string;
};

export type AdminAssessmentProcess = {
  assessmentId?: string;
  automation?: string;
  automationLevel?: number;
  category?: string;
  costInputs?: {
    dedicatedFte?: {
      annualSalaryPerFte?: AdminCurrencyAmount;
      count?: number;
    };
    efficiencyPercent?: number;
    nonStaffingAnnualCost?: AdminCurrencyAmount;
    sharedFtePool?: {
      allocationPercent?: number;
      annualSalaryPerFte?: AdminCurrencyAmount;
      count?: number;
    };
  } | null;
  cost?: string;
  description?: string;
  estimatedCost?: {
    amount?: number;
    baseAmount?: {
      amount?: number;
      currency?: string;
    };
    currency?: string;
  };
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
  updatedAt?: string;
  updatedBy?: {
    email?: string;
    id?: string;
    name?: string;
  };
};

export type AdminCurrencyAmount = {
  amount?: number;
  currency?: string;
};

export type AdminAssessmentStatus = {
  count: number;
  key?: string;
  label: string;
  tone?: "gray" | "blueLight" | "blue" | "green" | "red";
};

export type AdminAssessmentsPayload = {
  assessments: AdminAssessmentRow[];
  pipelineByStatus: AdminAssessmentStatus[];
  totalAssessments: number;
};
