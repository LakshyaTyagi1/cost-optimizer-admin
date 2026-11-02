import type {
  MissingFeatureStatus,
  StackFeatureOrigin,
  StackProduct,
  StackSelection,
} from "@/features/missing-features/api";

/**
 * Reads one tool or product's per-customer selections as what QA needs to decide on:
 * which plans were chosen and at what price, which features customers added or ticked
 * from the catalog, and which they reported as missing.
 *
 * The same plan, feature or report chosen by several customers is one entry, with how
 * many customers chose it. Amounts are shown as entered, in the currency the customer
 * used; nothing is converted here, so no exchange rate is applied.
 */

export type PriceVariant = {
  amount: string;
  count: number;
  currency: string;
};

export type PlanSummary = {
  customerCount: number;
  features: Array<{ customerCount: number; name: string; origin: StackFeatureOrigin }>;
  key: string;
  /** True when the customer created the plan, or the tool it belongs to. */
  isNew: boolean;
  kind: string;
  name: string;
  prices: PriceVariant[];
  /** The features customers reported as missing; only the Custom plan carries any. */
  reports: ReportSummary[];
  /** Customers who created the plan but left it unticked. */
  unselectedCount: number;
};

export type FeatureSummary = {
  customerCount: number;
  key: string;
  name: string;
  origin: StackFeatureOrigin;
};

export type ReportSummary = {
  category: string;
  customerCount: number;
  description: string;
  key: string;
  latestAt: string;
  name: string;
  planNames: string[];
  /** Distinct review statuses of the reports behind this entry, in queue order. */
  statuses: MissingFeatureStatus[];
};

export type ProductSummary = {
  addedFeatures: FeatureSummary[];
  plans: PlanSummary[];
  reports: ReportSummary[];
};

type ReportEntry = {
  category: string;
  customers: Set<string>;
  description: string;
  latestAt: string;
  name: string;
  planNames: Set<string>;
  statuses: Set<MissingFeatureStatus>;
};

const reportStatusOrder: readonly MissingFeatureStatus[] = [
  "captured-to-organization",
  "organization-to-admin-review",
  "admin-review-to-zoftwarehub-catalog",
  "declined-at-admin-review",
];

function normalized(value: string) {
  return value.trim().toLowerCase();
}

/** One customer is told apart by email, then name, then the assessment they came from. */
export function customerKeyOf(selection: StackSelection) {
  return (
    normalized(selection.customerEmail) ||
    normalized(selection.customerName) ||
    selection.assessmentId
  );
}

function byCustomersThenName<Item extends { customerCount: number; name: string }>(
  first: Item,
  second: Item,
) {
  return second.customerCount - first.customerCount || first.name.localeCompare(second.name, "en");
}

export function summarizeProduct(product: StackProduct): ProductSummary {
  const plans = new Map<
    string,
    {
      customers: Set<string>;
      features: Map<string, { customers: Set<string>; name: string; origin: StackFeatureOrigin }>;
      isNew: boolean;
      kind: string;
      name: string;
      prices: Map<string, PriceVariant>;
      reports: Map<string, ReportEntry>;
      unselected: Set<string>;
    }
  >();
  const features = new Map<
    string,
    { customers: Set<string>; name: string; origin: StackFeatureOrigin }
  >();
  const reports = new Map<string, ReportEntry>();
  const addReport = (
    target: Map<string, ReportEntry>,
    report: StackSelection["reportedFeatures"][number],
    customer: string,
  ) => {
    const key = normalized(report.name);
    const entry = target.get(key) ?? {
      category: report.category,
      customers: new Set<string>(),
      description: report.description,
      latestAt: report.createdAt,
      name: report.name,
      planNames: new Set<string>(),
      statuses: new Set<MissingFeatureStatus>(),
    };

    entry.customers.add(customer);
    entry.statuses.add(report.status);
    entry.planNames.add(report.planName);
    entry.latestAt =
      String(report.createdAt) > String(entry.latestAt) ? report.createdAt : entry.latestAt;
    // A later report may carry what the first one lacked.
    entry.description = entry.description || report.description;
    entry.category = entry.category || report.category;
    target.set(key, entry);
  };
  const addFeature = (
    target: Map<string, { customers: Set<string>; name: string; origin: StackFeatureOrigin }>,
    feature: { name: string; origin: StackFeatureOrigin },
    customer: string,
  ) => {
    const key = `${feature.origin}::${normalized(feature.name)}`;
    const entry = target.get(key) ?? {
      customers: new Set<string>(),
      name: feature.name,
      origin: feature.origin,
    };

    entry.customers.add(customer);
    target.set(key, entry);
  };

  for (const selection of product.selections) {
    const customer = customerKeyOf(selection);

    for (const plan of selection.plans) {
      const key = `${plan.kind}::${normalized(plan.name)}`;
      const entry = plans.get(key) ?? {
        customers: new Set<string>(),
        features: new Map(),
        isNew: plan.kind === "created" || product.origin === "created-tool",
        kind: plan.kind,
        name: plan.name,
        prices: new Map<string, PriceVariant>(),
        reports: new Map<string, ReportEntry>(),
        unselected: new Set<string>(),
      };

      entry.customers.add(customer);
      plans.set(key, entry);

      if (!plan.selected) {
        entry.unselected.add(customer);
      }

      if (plan.unitPrice) {
        const priceKey = `${plan.unitPrice}::${plan.currency}`;
        const price = entry.prices.get(priceKey) ?? {
          amount: plan.unitPrice,
          count: 0,
          currency: plan.currency,
        };

        price.count += 1;
        entry.prices.set(priceKey, price);
      }

      for (const feature of plan.features) {
        addFeature(entry.features, feature, customer);
        addFeature(features, feature, customer);
      }

      // The features a customer ticked and reported belong to their Custom plan, so that
      // plan's panel lists them: it has no features of its own.
      if (plan.kind === "custom") {
        for (const feature of selection.featuresInUse) {
          addFeature(entry.features, feature, customer);
        }

        for (const report of selection.reportedFeatures) {
          addReport(entry.reports, report, customer);
        }
      }
    }

    for (const feature of selection.featuresInUse) {
      addFeature(features, feature, customer);
    }

    for (const report of selection.reportedFeatures) {
      addReport(reports, report, customer);
    }
  }

  const toFeatureSummaries = (
    source: Map<string, { customers: Set<string>; name: string; origin: StackFeatureOrigin }>,
    origin: StackFeatureOrigin,
  ): FeatureSummary[] =>
    Array.from(source.entries())
      .filter(([, entry]) => entry.origin === origin)
      .map(([key, entry]) => ({
        customerCount: entry.customers.size,
        key,
        name: entry.name,
        origin: entry.origin,
      }))
      .sort(byCustomersThenName);

  const toReportSummaries = (source: Map<string, ReportEntry>): ReportSummary[] =>
    Array.from(source.entries())
      .map(([key, entry]) => ({
        category: entry.category,
        customerCount: entry.customers.size,
        description: entry.description,
        key,
        latestAt: entry.latestAt,
        name: entry.name,
        planNames: Array.from(entry.planNames).filter(Boolean),
        statuses: reportStatusOrder.filter((status) => entry.statuses.has(status)),
      }))
      .sort(byCustomersThenName);

  return {
    addedFeatures: toFeatureSummaries(features, "added"),
    plans: Array.from(plans.entries())
      .map(([key, entry]) => ({
        customerCount: entry.customers.size,
        features: Array.from(entry.features.values())
          .map((feature) => ({
            customerCount: feature.customers.size,
            name: feature.name,
            origin: feature.origin,
          }))
          .sort(byCustomersThenName),
        isNew: entry.isNew,
        key,
        kind: entry.kind,
        name: entry.name,
        prices: Array.from(entry.prices.values()).sort(
          (first, second) => second.count - first.count,
        ),
        reports: toReportSummaries(entry.reports),
        unselectedCount: entry.unselected.size,
      }))
      .sort(byCustomersThenName),
    reports: toReportSummaries(reports),
  };
}
