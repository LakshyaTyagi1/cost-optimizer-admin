import type {
  DictionaryIndustry,
  DictionaryProcess,
  TechStackBenchmarkPricing,
  TechStackTool,
} from "@/features/data-dictionary/model";
import type { ProcessFormState } from "@/components/data-dictionary/new-process-modal";
import type { ToolFormState } from "@/components/data-dictionary/tech-stack-tool-modal";

import { formatProcessAmountInput, parseAmount } from "@/features/data-dictionary/utils/amount";
import { toSlug } from "@/features/data-dictionary/utils/domain-mapping";

export const emptyToolForm: ToolFormState = {
  benchmarkCheckedAt: "",
  benchmarkConfidence: "",
  benchmarkMonthlyOperationalCost: "",
  benchmarkSetupCost: "",
  benchmarkSourceLabel: "",
  benchmarkSourceUrl: "",
  category: "CRM / Support",
  description: "",
  name: "",
  vendor: "",
};

export function createEmptyProcessForm(industries: DictionaryIndustry[]): ProcessFormState {
  return {
    category: "",
    cost: "0",
    costCurrency: "AED",
    description: "",
    domainId: "",
    hours: "0",
    industryId: industries[0]?.id ?? "",
    name: "",
    tier: "",
  };
}

export function createProcessFormFromProcess(
  process: DictionaryProcess,
  industries: DictionaryIndustry[],
): ProcessFormState {
  return {
    category: process.categoryValue || toSlug(process.category),
    cost: formatProcessAmountInput(process.costAmount ?? parseAmount(process.cost)),
    costCurrency: process.costCurrency || (process.cost.startsWith("$") ? "USD" : "AED"),
    description: process.description,
    domainId: process.scope === "industry-domain" ? process.domainId || "" : "",
    hours:
      process.hours === "Not set" ? "1200" : formatProcessAmountInput(parseAmount(process.hours)),
    industryId: process.industryIds[0] || industries[0]?.id || "",
    name: process.name,
    tier: process.tierValue || toSlug(process.tier),
  };
}

export function createToolFormFromTool(tool: TechStackTool): ToolFormState {
  return {
    benchmarkCheckedAt: tool.benchmarkPricing?.checkedAt || "",
    benchmarkConfidence: tool.benchmarkPricing?.confidence || "",
    benchmarkMonthlyOperationalCost: formatOptionalBenchmarkCost(
      tool.benchmarkPricing?.monthlyOperationalCost,
    ),
    benchmarkSetupCost: formatOptionalBenchmarkCost(tool.benchmarkPricing?.setupCost),
    benchmarkSourceLabel: tool.benchmarkPricing?.sourceLabel || "",
    benchmarkSourceUrl: tool.benchmarkPricing?.sourceUrl || "",
    category: tool.category,
    description: tool.description || "",
    name: tool.name,
    vendor: tool.vendor,
  };
}

export function createToolBenchmarkPricingPayload(
  toolForm: ToolFormState,
): TechStackBenchmarkPricing | null {
  const monthlyOperationalCost = parseOptionalBenchmarkCost(
    toolForm.benchmarkMonthlyOperationalCost,
    "Monthly operational cost",
  );
  const setupCost = parseOptionalBenchmarkCost(toolForm.benchmarkSetupCost, "Setup cost");
  const sourceLabel = toolForm.benchmarkSourceLabel.trim();
  const sourceUrl = toolForm.benchmarkSourceUrl.trim();
  const checkedAt = toolForm.benchmarkCheckedAt.trim();
  const confidence = toolForm.benchmarkConfidence || undefined;

  if (sourceUrl) {
    let parsedSourceUrl: URL;

    try {
      parsedSourceUrl = new URL(sourceUrl);
    } catch {
      throw new Error("Benchmark source URL must be a valid HTTPS URL");
    }

    if (parsedSourceUrl.protocol !== "https:") {
      throw new Error("Benchmark source URL must use HTTPS");
    }
  }

  if (checkedAt && !isValidIsoDate(checkedAt)) {
    throw new Error("Benchmark checked date must be a valid date");
  }

  if (
    monthlyOperationalCost === null &&
    setupCost === null &&
    !sourceLabel &&
    !sourceUrl &&
    !checkedAt &&
    !confidence
  ) {
    return null;
  }

  return {
    currency: "USD",
    monthlyOperationalCost,
    setupCost,
    sourceLabel: sourceLabel || undefined,
    sourceUrl: sourceUrl || undefined,
    checkedAt: checkedAt || null,
    confidence,
  };
}

function formatOptionalBenchmarkCost(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function parseOptionalBenchmarkCost(value: string, fieldName: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${fieldName} must be 0 or greater`);
  }

  return amount;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
