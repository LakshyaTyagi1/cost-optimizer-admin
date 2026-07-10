import type {
  AdminAssessmentProcess,
  AdminAssessmentRow,
} from "@/features/assessments/model";

export type SortKey = "company" | "score" | "cost" | "savings";
export type SortDirection = "asc" | "desc";
export type DetailTab =
  | "overview"
  | "activity"
  | "processes"
  | "due-diligence"
  | "results"
  | "strategy"
  | "expert"
  | "notes";

export type AssessmentSummary = {
  assessments: AdminAssessmentRow[];
  company: string;
  contact: string;
  cost: string;
  createdAt?: string;
  currencyConversionRate: number;
  customProcesses: AdminAssessmentProcess[];
  domain: string;
  email: string;
  id: string;
  industry: string;
  industries: string[];
  owner: string;
  preferences: NonNullable<AdminAssessmentRow["preferences"]>;
  processCount: number | null;
  processes: AdminAssessmentProcess[];
  savings: string;
  score: string;
  selectedStackTools: string[];
  status: string;
  statusKey?: string;
  totalCostInSavedCurrency: string;
  updatedAt?: string;
};
