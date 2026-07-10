import type {
  DictionaryIndustry,
  DictionaryProcess,
  TechStackTool,
} from "@/features/data-dictionary/model";
import type { ProcessFormState } from "@/components/data-dictionary/new-process-modal";
import type { ToolFormState } from "@/components/data-dictionary/tech-stack-tool-modal";

import { formatProcessAmountInput, parseAmount } from "@/features/data-dictionary/utils/amount";
import { toSlug } from "@/features/data-dictionary/utils/domain-mapping";

export const emptyToolForm: ToolFormState = {
  category: "CRM / Support",
  domainId: "",
  industryId: "",
  name: "",
  scope: "common",
  vendor: "",
};

export function createEmptyProcessForm(industries: DictionaryIndustry[]): ProcessFormState {
  return {
    category: "",
    cost: "18000",
    costCurrency: "AED",
    description: "",
    domainId: "",
    hours: "1200",
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
    hours: process.hours === "Not set" ? "1200" : formatProcessAmountInput(parseAmount(process.hours)),
    industryId: process.industryIds[0] || industries[0]?.id || "",
    name: process.name,
    tier: process.tier,
  };
}

export function createToolFormFromTool(tool: TechStackTool, industries: DictionaryIndustry[]): ToolFormState {
  const scope =
    tool.scope === "industry-domain" ? "domain" : tool.scope === "industry-default" ? "industry" : "common";

  return {
    category: tool.category,
    domainId: scope === "domain" ? tool.domainId || "" : "",
    industryId: scope === "common" ? "" : tool.industryId || industries[0]?.id || "",
    name: tool.name,
    scope,
    vendor: tool.vendor,
  };
}
