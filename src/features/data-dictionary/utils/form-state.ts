import type { DictionaryIndustry, DictionaryProcess } from "@/features/data-dictionary/model";
import type { ProcessFormState } from "@/components/data-dictionary/new-process-modal";

import { formatProcessAmountInput, parseAmount } from "@/features/data-dictionary/utils/amount";
import { toSlug } from "@/features/data-dictionary/utils/domain-mapping";

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
