import type { AdminAssessmentProcess, AdminCurrencyAmount } from "@/features/assessments/model";
import { defaultDisplayToBaseCurrencyRate } from "@/features/assessments/utils/currency";
import {
  formatBaseCurrency,
  formatDate,
  formatNumberInput,
  parseMetricNumber,
} from "@/features/assessments/utils/formatters";

export function getProcessAuditLabel(process: AdminAssessmentProcess) {
  const actorName = String(process.updatedBy?.name || "").trim();
  const actorEmail = String(process.updatedBy?.email || "").trim();
  const actorLabel = actorName || actorEmail;
  const dateLabel = formatDate(process.updatedAt);

  if (actorLabel && dateLabel !== "--") {
    return `Updated by ${actorLabel} on ${dateLabel}`;
  }

  if (actorLabel) {
    return `Updated by ${actorLabel}`;
  }

  return dateLabel !== "--" ? `Updated ${dateLabel}` : "";
}

export function getCurrencyAmountInBaseCurrency(
  currencyAmount?: AdminCurrencyAmount | null,
  currencyConversionRate = defaultDisplayToBaseCurrencyRate,
) {
  const amount = Number(currencyAmount?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return currencyAmount?.currency === "USD"
    ? Math.round(amount * currencyConversionRate)
    : Math.round(amount);
}

export function getProcessFteLabel(process: AdminAssessmentProcess) {
  const sharedFtePool = process.costInputs?.sharedFtePool;
  const dedicatedFte = process.costInputs?.dedicatedFte;
  const managerialFte = process.costInputs?.managerialFte;
  const sharedFtes = Number(sharedFtePool?.count) || 0;
  const allocationPercent = Number(sharedFtePool?.allocationPercent) || 0;
  const dedicatedFtes = Number(dedicatedFte?.count) || 0;
  const managerialFtes = Number(managerialFte?.count) || 0;
  const totalFtes = sharedFtes * (allocationPercent / 100) + dedicatedFtes + managerialFtes;

  if (totalFtes > 0) {
    return formatNumberInput(totalFtes);
  }

  return process.ftes || "--";
}

export function getProcessSoftwareCostLabel(
  process: AdminAssessmentProcess,
  currencyConversionRate = defaultDisplayToBaseCurrencyRate,
) {
  const softwareBaseCurrencyCost = getCurrencyAmountInBaseCurrency(
    process.costInputs?.nonStaffingAnnualCost,
    currencyConversionRate,
  );

  if (softwareBaseCurrencyCost > 0) {
    return formatBaseCurrency(softwareBaseCurrencyCost);
  }

  return process.software || "--";
}

export function getProcessCostInBaseCurrency(
  process: AdminAssessmentProcess,
  currencyConversionRate = defaultDisplayToBaseCurrencyRate,
) {
  const explicitBaseCurrencyCost = parseMetricNumber(process.cost || "");

  if (explicitBaseCurrencyCost > 0) {
    return explicitBaseCurrencyCost;
  }

  const estimatedCost = process.estimatedCost;
  const estimatedAmount = Number(estimatedCost?.amount);

  if (Number.isFinite(estimatedAmount) && estimatedAmount > 0) {
    return estimatedCost?.currency === "USD"
      ? Math.round(estimatedAmount * currencyConversionRate)
      : Math.round(estimatedAmount);
  }

  const baseAmount = Number(estimatedCost?.baseAmount?.amount);

  if (Number.isFinite(baseAmount) && baseAmount > 0) {
    return estimatedCost?.baseAmount?.currency === "USD"
      ? Math.round(baseAmount * currencyConversionRate)
      : Math.round(baseAmount);
  }

  return 0;
}

export function getProcessSavingInBaseCurrency(process: AdminAssessmentProcess, baseCurrencyCost: number) {
  const explicitSaving = parseMetricNumber(process.saving || "");

  if (explicitSaving > 0) {
    return explicitSaving;
  }

  return Math.round(baseCurrencyCost * getAssessmentSavingRate(process.automationLevel));
}

function getAssessmentSavingRate(level: number | undefined) {
  const automationLevel = Number(level) || 1;

  if (automationLevel >= 5) return 0;
  if (automationLevel >= 4) return 0.15;
  if (automationLevel >= 3) return 0.3;
  return 0.45;
}

export function formatCurrencyAmountInBaseCurrency(
  currencyAmount?: AdminCurrencyAmount | null,
  currencyConversionRate = defaultDisplayToBaseCurrencyRate,
) {
  const baseCurrencyAmount = getCurrencyAmountInBaseCurrency(currencyAmount, currencyConversionRate);

  return baseCurrencyAmount > 0 ? formatBaseCurrency(baseCurrencyAmount) : "--";
}

export function getAutomationLabel(level: number) {
  if (level >= 5) return "Autonomous";
  if (level >= 4) return "Highly Automated";
  if (level >= 3) return "Partially Automated";
  if (level >= 2) return "Mostly Manual";
  return "Manual";
}
