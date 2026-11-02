"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Check, ChevronDown, Search, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DataDictionaryPanel } from "@/features/data-dictionary/components/data-dictionary-panel";
import type { DictionaryIndustry, DictionaryLibrary } from "@/features/data-dictionary/model";
import {
  dataDictionaryCatalogQueryKey,
  masterInventoryMappingQueryKey,
  useMasterInventoryClassifications,
  useMasterInventoryDomainMapping,
  useMasterInventoryIndustryMapping,
  useMasterInventoryMappingPreview,
} from "@/features/data-dictionary/queries";
import {
  updateMasterInventoryDomainMapping,
  updateMasterInventoryIndustryMapping,
} from "@/features/data-dictionary/api";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";

type ScopedSelection = {
  ids: string[];
  scopeId: string;
};

function haveSameNames(left: string[], right: string[]) {
  const normalize = (names: string[]) =>
    Array.from(new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))).sort();

  const leftNames = normalize(left);
  const rightNames = normalize(right);

  return (
    leftNames.length === rightNames.length && leftNames.every((name) => rightNames.includes(name))
  );
}

/**
 * Technology Product Mapping panel for the Master Inventory catalogue.
 *
 * It resolves against the Master Inventory industry / sub-category name
 * mapping: Step 1 picks the Master Inventory industry, Step 2 maps the Cost
 * Optimizer domain to sub-categories, and the Product impact panel previews the
 * matching canonical child products before a mapping is saved.
 */
export function MasterInventoryMappingCard({
  enabled,
  industries,
  libraries,
}: {
  enabled: boolean;
  industries: DictionaryIndustry[];
  libraries: DictionaryLibrary[];
}) {
  const queryClient = useQueryClient();
  const [selectedIndustryId, setSelectedIndustryId] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [industrySelection, setIndustrySelection] = useState<ScopedSelection | null>(null);
  const [subCategorySelection, setSubCategorySelection] = useState<ScopedSelection | null>(null);
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [areSelectedSubCategoriesExpanded, setAreSelectedSubCategoriesExpanded] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isDomainMappingConfirmationOpen, setIsDomainMappingConfirmationOpen] = useState(false);

  const activeIndustryId = industries.some((industry) => industry.id === selectedIndustryId)
    ? selectedIndustryId
    : (industries[0]?.id ?? "");

  const mappedDomains = useMemo(() => {
    const seenDomainIds = new Set<string>();

    return libraries.filter((library) => {
      if (
        library.industryId !== activeIndustryId ||
        library.isActive === false ||
        !library.domainId ||
        seenDomainIds.has(library.domainId)
      ) {
        return false;
      }

      seenDomainIds.add(library.domainId);
      return true;
    });
  }, [activeIndustryId, libraries]);
  const activeDomainId = mappedDomains.some((domain) => domain.domainId === selectedDomainId)
    ? selectedDomainId
    : (mappedDomains[0]?.domainId ?? "");

  const {
    data: classifications,
    error: classificationsError,
    isLoading: isClassificationsLoading,
  } = useMasterInventoryClassifications({ enabled });
  const {
    data: industryMapping,
    error: industryMappingError,
    isLoading: isIndustryMappingLoading,
  } = useMasterInventoryIndustryMapping({ enabled, industryId: activeIndustryId });
  const {
    data: domainMapping,
    error: domainMappingError,
    isLoading: isDomainMappingLoading,
  } = useMasterInventoryDomainMapping({ domainId: activeDomainId, enabled });
  const updateIndustryMappingMutation = useMutation({
    mutationFn: updateMasterInventoryIndustryMapping,
  });
  const updateDomainMappingMutation = useMutation({
    mutationFn: updateMasterInventoryDomainMapping,
  });

  const persistedIndustries =
    industryMapping?.industryId === activeIndustryId ? (industryMapping.industries ?? []) : [];
  const industryIds =
    industrySelection?.scopeId === activeIndustryId ? industrySelection.ids : persistedIndustries;
  const persistedSubCategoryNames =
    domainMapping?.industryDomainId === activeDomainId ? (domainMapping.subCategories ?? []) : [];
  const subCategoryIds =
    subCategorySelection?.scopeId === activeDomainId
      ? subCategorySelection.ids
      : persistedSubCategoryNames;

  const industryOptions = useMemo(
    () => (classifications?.industries ?? []).map((name) => ({ id: name, name })),
    [classifications?.industries],
  );
  const subCategoryOptions = useMemo(
    () => (classifications?.subCategories ?? []).map((name) => ({ id: name, name })),
    [classifications?.subCategories],
  );

  const isIndustryMappingDirty = !haveSameNames(industryIds, persistedIndustries);
  const isDomainMappingDirty = !haveSameNames(subCategoryIds, persistedSubCategoryNames);
  const hasUnsavedChanges = isIndustryMappingDirty || isDomainMappingDirty;

  const {
    data: productPreview,
    error: productPreviewError,
    isLoading: isProductPreviewLoading,
    refetch: refetchProductPreview,
  } = useMasterInventoryMappingPreview({
    enabled: enabled && Boolean(activeDomainId),
    industries: industryIds,
    subCategories: subCategoryIds,
  });

  function clearSaveFeedback() {
    setSaveError("");
    setSaveSuccess("");
  }

  function toggleSubCategory(subCategoryId: string, isSelected: boolean) {
    clearSaveFeedback();
    const nextSubCategoryIds = isSelected
      ? Array.from(new Set([...subCategoryIds, subCategoryId]))
      : subCategoryIds.filter((id) => id !== subCategoryId);

    if (nextSubCategoryIds.length <= 2) {
      setAreSelectedSubCategoriesExpanded(false);
    }

    setSubCategorySelection({ ids: nextSubCategoryIds, scopeId: activeDomainId });
  }

  async function saveIndustryMapping() {
    if (!activeIndustryId || industryIds.length === 0) {
      return;
    }

    try {
      setSaveError("");
      setSaveSuccess("");
      await updateIndustryMappingMutation.mutateAsync({
        industries: industryIds,
        industryId: activeIndustryId,
      });
      await queryClient.invalidateQueries({
        queryKey: [...masterInventoryMappingQueryKey, "industry", activeIndustryId],
      });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryCatalogQueryKey });
      setSaveSuccess("Industry mapping saved.");
    } catch (error) {
      setSaveSuccess("");
      setSaveError(getErrorMessage(error));
    }
  }

  async function saveDomainMapping() {
    if (!activeDomainId || subCategoryIds.length === 0) {
      return false;
    }

    try {
      setSaveError("");
      setSaveSuccess("");
      await updateDomainMappingMutation.mutateAsync({
        domainId: activeDomainId,
        subCategories: subCategoryIds,
      });
      await queryClient.invalidateQueries({
        queryKey: [...masterInventoryMappingQueryKey, "domain", activeDomainId],
      });
      setSaveSuccess("Domain subcategory mapping saved.");
      return true;
    } catch (error) {
      setSaveSuccess("");
      setSaveError(getErrorMessage(error));
      return false;
    }
  }

  async function confirmDomainMappingSave() {
    const didSave = await saveDomainMapping();

    if (didSave) {
      setIsDomainMappingConfirmationOpen(false);
    }
  }

  const normalizedSubCategorySearch = subCategorySearch.trim().toLowerCase();
  const visibleSubCategories = subCategoryOptions.filter(
    (subCategory) =>
      !normalizedSubCategorySearch ||
      subCategory.name.toLowerCase().includes(normalizedSubCategorySearch),
  );
  const selectedSubCategories = subCategoryOptions.filter((subCategory) =>
    subCategoryIds.includes(subCategory.id),
  );
  const hasAdditionalSelectedSubCategories = selectedSubCategories.length > 2;
  const displayedSelectedSubCategories = selectedSubCategories.slice(0, 2);

  const isLoading = isClassificationsLoading || isIndustryMappingLoading || isDomainMappingLoading;
  const loadError = classificationsError || industryMappingError || domainMappingError;
  const isDomainMappingConfigured = subCategoryIds.length > 0;

  return (
    <DataDictionaryPanel title="Master Inventory Mapping" className="mt-5">
      <div className="mt-5 space-y-5">
        <p className="text-sm leading-5 text-[#5F6368]">
          Map each Cost Optimizer industry to one or more Master Inventory industries, then map its
          domain to one or more Master Inventory subcategories. Customer technology-stack requests
          use both selections to return matching canonical child products.
        </p>
        <div
          className="grid gap-3 rounded-md border border-[#007AFF]/15 bg-[#F7FBFF] p-3 text-sm text-[#1D1D1F] lg:grid-cols-3"
          aria-live="polite"
        >
          <p>
            <span className="font-semibold">Industry mapping: </span>
            {industryIds.length > 0
              ? `${industryIds.length} ${industryIds.length === 1 ? "industry" : "industries"} selected`
              : "Needs industries"}
          </p>
          <p>
            <span className="font-semibold">Domain mapping: </span>
            {subCategoryIds.length > 0
              ? `${subCategoryIds.length} subcategory${subCategoryIds.length === 1 ? "" : "ies"} selected`
              : "Needs subcategories"}
          </p>
          <p>
            <span className="font-semibold">Mapping status: </span>
            <span
              className={
                hasUnsavedChanges
                  ? "text-[#9A6700]"
                  : isDomainMappingConfigured
                    ? "text-[#137333]"
                    : "text-[#5F6368]"
              }
            >
              {hasUnsavedChanges
                ? "Changes not saved"
                : isDomainMappingConfigured
                  ? "Saved"
                  : "Needs mapping"}
            </span>
          </p>
        </div>
        {loadError || saveError ? (
          <p
            role="alert"
            className="rounded-md bg-[#FFF1F0] px-3 py-2 text-sm font-medium text-[#C5221F]"
          >
            {saveError || getErrorMessage(loadError)}
          </p>
        ) : null}
        {saveSuccess ? (
          <p
            role="status"
            className="rounded-md bg-[#EAF8EF] px-3 py-2 text-sm font-medium text-[#137333]"
          >
            {saveSuccess}
          </p>
        ) : null}
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          <section className="rounded-lg border border-black/[0.08] bg-[#FCFDFF] p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.06em] text-[#007AFF] uppercase">
                  Step 1
                </p>
                <h3 className="mt-1 text-base font-bold text-[#1D1D1F]">Choose the industry</h3>
                <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                  These industries apply to every mapped domain below.
                </p>
              </div>
              <MappingStatusBadge
                configured={industryIds.length > 0}
                dirty={isIndustryMappingDirty}
              />
            </div>
            <label
              className="block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
              htmlFor="master-inventory-industry"
            >
              Cost Optimizer industry
            </label>
            <select
              id="master-inventory-industry"
              value={activeIndustryId}
              onChange={(event) => {
                clearSaveFeedback();
                setSelectedIndustryId(event.target.value);
              }}
              disabled={!enabled || industries.length === 0}
              className="mt-2 h-10 w-full rounded-md border border-black/[0.14] bg-white px-3 text-sm text-[#171717] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
            >
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
            <span
              id="master-inventory-industries-label"
              className="mt-4 block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
            >
              Master Inventory industries
            </span>
            <MasterInventorySearchSelect
              key={activeIndustryId}
              ariaDescribedBy="master-inventory-industries-help"
              ariaLabelledBy="master-inventory-industries-label"
              disabled={!activeIndustryId || isLoading}
              emptyMessage="No Master Inventory industry matches"
              onChange={(industryName) => {
                clearSaveFeedback();
                setIndustrySelection({
                  ids: industryName ? [industryName] : [],
                  scopeId: activeIndustryId,
                });
              }}
              options={industryOptions}
              placeholder="Select an industry"
              searchLabel="Search Master Inventory industries"
              value={industryIds[0] || ""}
            />
            <p
              id="master-inventory-industries-help"
              className="mt-2 text-xs leading-4 text-[#86868B]"
            >
              Select one Master Inventory industry for this Cost Optimizer industry.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-4">
              <p className="max-w-44 text-xs leading-4 text-[#5F6368]">
                Save this selection before moving to another Cost Optimizer industry.
              </p>
              <button
                type="button"
                onClick={() => void saveIndustryMapping()}
                disabled={
                  !activeIndustryId ||
                  industryIds.length === 0 ||
                  !isIndustryMappingDirty ||
                  isLoading ||
                  updateIndustryMappingMutation.isPending
                }
                className="rounded-md bg-[#007AFF] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#006FE6] disabled:cursor-not-allowed disabled:bg-[#A1A1AA]"
              >
                {updateIndustryMappingMutation.isPending ? "Saving…" : "Save industry"}
              </button>
            </div>
          </section>
          <section className="rounded-lg border border-black/[0.08] bg-white p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.06em] text-[#007AFF] uppercase">
                  Step 2
                </p>
                <h3 className="mt-1 text-base font-bold text-[#1D1D1F]">
                  Map domain subcategories
                </h3>
                <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                  Select every Master Inventory subcategory that should return products for this
                  domain.
                </p>
              </div>
              <MappingStatusBadge
                configured={subCategoryIds.length > 0}
                dirty={isDomainMappingDirty}
              />
            </div>
            <label
              className="block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
              htmlFor="master-inventory-domain"
            >
              Cost Optimizer domain
            </label>
            <select
              id="master-inventory-domain"
              value={activeDomainId}
              onChange={(event) => {
                clearSaveFeedback();
                setSubCategorySearch("");
                setAreSelectedSubCategoriesExpanded(false);
                setSelectedDomainId(event.target.value);
              }}
              disabled={!activeIndustryId || mappedDomains.length === 0}
              className="mt-2 h-10 w-full rounded-md border border-black/[0.14] bg-white px-3 text-sm text-[#171717] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
            >
              {mappedDomains.map((domain) => (
                <option key={domain.domainId} value={domain.domainId}>
                  {domain.domainName}
                </option>
              ))}
            </select>
            {activeIndustryId && mappedDomains.length === 0 ? (
              <p className="mt-2 text-xs leading-4 text-[#86868B]">
                Map a domain to this industry before configuring its product categories.
              </p>
            ) : null}
            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(250px,0.72fr)]">
              <fieldset
                disabled={!activeDomainId || isLoading}
                aria-describedby="master-inventory-sub-categories-help"
              >
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <legend className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
                    Master Inventory subcategories
                  </legend>
                  <p className="text-xs font-medium text-[#5F6368]" aria-live="polite">
                    {subCategoryIds.length} selected · {visibleSubCategories.length} visible
                  </p>
                </div>
                <p className="mt-1 text-xs text-[#86868B]">{subCategoryOptions.length} available</p>
                <div className="relative z-0 mt-2 overflow-visible rounded-md border border-black/[0.14] bg-white">
                  {selectedSubCategories.length > 0 ? (
                    <div className="border-b border-black/[0.08] bg-[#F7FBFF] p-2">
                      <div className="flex items-start gap-1.5">
                        <div
                          className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5"
                          aria-label="Selected Master Inventory subcategories"
                        >
                          {displayedSelectedSubCategories.map((subCategory) => (
                            <button
                              key={subCategory.id}
                              type="button"
                              onClick={() => toggleSubCategory(subCategory.id, false)}
                              disabled={isLoading}
                              className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-[#005CC8] shadow-sm ring-1 ring-[#007AFF]/20 transition hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Remove ${subCategory.name}`}
                            >
                              <span className="truncate">{subCategory.name}</span>
                              <X aria-hidden="true" size={13} className="shrink-0" />
                            </button>
                          ))}
                        </div>
                        {hasAdditionalSelectedSubCategories ? (
                          <button
                            type="button"
                            onClick={() =>
                              setAreSelectedSubCategoriesExpanded((isExpanded) => !isExpanded)
                            }
                            className="inline-flex h-7 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-xs font-semibold text-[#005CC8] hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
                            aria-expanded={areSelectedSubCategoriesExpanded}
                            aria-label={
                              areSelectedSubCategoriesExpanded
                                ? "Collapse selected subcategories"
                                : `Show ${selectedSubCategories.length - 2} more selected subcategories`
                            }
                          >
                            {!areSelectedSubCategoriesExpanded
                              ? `+${selectedSubCategories.length - 2}`
                              : null}
                            <ChevronDown
                              aria-hidden="true"
                              size={16}
                              className={`transition-transform ${
                                areSelectedSubCategoriesExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {areSelectedSubCategoriesExpanded ? (
                    <div className="absolute inset-x-0 top-0 z-30 rounded-md border border-[#8CC5FF] bg-[#F7FBFF] p-2 shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
                      <div className="flex items-start gap-1.5">
                        <div
                          className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5"
                          aria-label="Expanded selected Master Inventory subcategories"
                        >
                          {selectedSubCategories.map((subCategory) => (
                            <button
                              key={subCategory.id}
                              type="button"
                              onClick={() => toggleSubCategory(subCategory.id, false)}
                              disabled={isLoading}
                              className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-[#005CC8] shadow-sm ring-1 ring-[#007AFF]/20 transition hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Remove ${subCategory.name}`}
                            >
                              <span className="truncate">{subCategory.name}</span>
                              <X aria-hidden="true" size={13} className="shrink-0" />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setAreSelectedSubCategoriesExpanded(false)}
                          className="inline-flex h-7 shrink-0 items-center rounded-md px-1.5 text-[#005CC8] hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
                          aria-label="Collapse selected subcategories"
                        >
                          <ChevronDown aria-hidden="true" size={16} className="rotate-180" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="border-b border-black/[0.08] p-2">
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        size={15}
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#86868B]"
                      />
                      <input
                        type="search"
                        value={subCategorySearch}
                        onChange={(event) => setSubCategorySearch(event.target.value)}
                        disabled={!activeDomainId || isLoading}
                        placeholder="Search subcategories"
                        aria-label="Search Master Inventory subcategories"
                        className="h-9 w-full rounded-md border border-transparent bg-[#F8F9FA] pr-3 pl-9 text-sm text-[#171717] placeholder:text-[#86868B] focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
                      />
                    </div>
                  </div>
                  <div className="h-44 overflow-y-auto p-2 text-sm text-[#171717]">
                    {visibleSubCategories.map((subCategory) => (
                      <label
                        key={subCategory.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-[#F8F9FA] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[#86868B]"
                      >
                        <input
                          type="checkbox"
                          checked={subCategoryIds.includes(subCategory.id)}
                          onChange={(event) =>
                            toggleSubCategory(subCategory.id, event.target.checked)
                          }
                          disabled={!activeDomainId || isLoading}
                          className="size-4 rounded border-black/[0.25] accent-[#007AFF]"
                        />
                        <span>{subCategory.name}</span>
                      </label>
                    ))}
                    {visibleSubCategories.length === 0 ? (
                      <p className="px-1 py-2 text-xs text-[#86868B]">No matching subcategories.</p>
                    ) : null}
                  </div>
                </div>
              </fieldset>
              <div
                className="relative z-10 h-full rounded-lg border border-[#007AFF]/15 bg-[#F7FBFF] p-4"
                aria-live="polite"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
                      Product impact
                    </p>
                    <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                      Live coverage for this draft mapping.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#005CC8] ring-1 ring-[#007AFF]/20">
                    Preview
                  </span>
                </div>
                {subCategoryIds.length === 0 ? (
                  <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                    Select one or more subcategories to preview matching products and features.
                  </p>
                ) : isProductPreviewLoading ? (
                  <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                    Checking product coverage...
                  </p>
                ) : productPreviewError ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs leading-4 text-[#B42318]">
                    <span>Unable to preview product coverage.</span>
                    <button
                      type="button"
                      onClick={() => void refetchProductPreview()}
                      className="font-semibold text-[#007AFF] hover:underline focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
                    >
                      Retry
                    </button>
                  </div>
                ) : productPreview ? (
                  <>
                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2.5 ring-1 ring-black/[0.06]">
                        <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5F6368] uppercase">
                          Products
                        </p>
                        <p className="text-xl leading-none font-bold text-[#1D1D1F]">
                          {productPreview.productCount}
                        </p>
                      </div>
                    </div>
                    {productPreview.productCount === 0 ? (
                      <p className="mt-3 rounded-md bg-[#FFF7E8] px-2 py-2 text-xs leading-4 text-[#9A6700]">
                        No active Master Inventory products match this draft mapping. Update it
                        before saving.
                      </p>
                    ) : productPreview.sampleProducts.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5F6368] uppercase">
                          Sample products
                        </p>
                        <div className="mt-1 h-44 space-y-3 overflow-x-hidden overflow-y-auto pr-1">
                          {productPreview.sampleProducts.map((product) => {
                            const featureItems = Array.from(
                              new Map(
                                [...product.features, ...product.otherFeatures].map((feature) => [
                                  feature.toLowerCase(),
                                  { id: feature, label: feature },
                                ]),
                              ).values(),
                            );
                            const structuredFeatureCount = new Set(
                              product.features.map((feature) => feature.toLowerCase()),
                            ).size;
                            const otherFeatureCount = new Set(
                              product.otherFeatures.map((feature) => feature.toLowerCase()),
                            ).size;

                            return (
                              <div key={product.id} className="flex items-start gap-2">
                                <ProductLogo logoUrl={product.logoUrl} name={product.name} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs leading-4 font-semibold text-[#1D1D1F]">
                                    {product.name}
                                  </p>
                                  <p className="mt-0.5 text-[11px] leading-4 text-[#5F6368]">
                                    {structuredFeatureCount} structured{" "}
                                    {structuredFeatureCount === 1 ? "feature" : "features"} +{" "}
                                    {otherFeatureCount} other{" "}
                                    {otherFeatureCount === 1 ? "feature" : "features"} ={" "}
                                    {featureItems.length} unique{" "}
                                    {featureItems.length === 1 ? "chip" : "chips"}
                                  </p>
                                  {featureItems.length > 0 ? (
                                    <ExpandableChipPanel
                                      detailItems={featureItems}
                                      items={featureItems}
                                      detailLabel={`Features for ${product.name}`}
                                    />
                                  ) : (
                                    <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                                      No product feature metadata is available for this product.
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
            <p
              id="master-inventory-sub-categories-help"
              className="mt-2 text-xs leading-4 text-[#86868B]"
            >
              Select every Master Inventory subcategory that applies to this Cost Optimizer domain.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-4">
              <p className="max-w-xl text-xs leading-4 text-[#5F6368]">
                Saving makes this industry and domain combination available to customer
                technology-stack requests.
              </p>
              <button
                type="button"
                onClick={() => setIsDomainMappingConfirmationOpen(true)}
                disabled={
                  !activeDomainId ||
                  !isDomainMappingDirty ||
                  isLoading ||
                  updateDomainMappingMutation.isPending
                }
                className="rounded-md bg-[#007AFF] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#006FE6] disabled:cursor-not-allowed disabled:bg-[#A1A1AA]"
              >
                {updateDomainMappingMutation.isPending ? "Saving…" : "Save domain mapping"}
              </button>
            </div>
          </section>
        </div>
      </div>
      {isDomainMappingConfirmationOpen ? (
        <DomainMappingSaveConfirmationDialog
          activity={`This maps the selected Cost Optimizer industry and domain to ${
            industryIds[0] || "the selected Master Inventory industry"
          } and ${subCategoryIds.length} Master Inventory ${
            subCategoryIds.length === 1 ? "subcategory" : "subcategories"
          } for customer technology-stack product matching.`}
          domainName={
            mappedDomains.find((domain) => domain.domainId === activeDomainId)?.domainName ||
            "Selected domain"
          }
          errorMessage={saveError}
          industryName={
            industries.find((industry) => industry.id === activeIndustryId)?.name ||
            "Selected industry"
          }
          isSaving={updateDomainMappingMutation.isPending}
          onCancel={() => setIsDomainMappingConfirmationOpen(false)}
          onConfirm={() => void confirmDomainMappingSave()}
          parentIndustryName={industryIds[0] || "No industry selected"}
          productCount={productPreview?.productCount ?? null}
          productPreviewIsLoading={isProductPreviewLoading}
          productPreviewIsUnavailable={Boolean(productPreviewError)}
          subCategoryNames={selectedSubCategories.map((subCategory) => subCategory.name)}
        />
      ) : null}
    </DataDictionaryPanel>
  );
}

function DomainMappingSaveConfirmationDialog({
  activity,
  domainName,
  errorMessage,
  industryName,
  isSaving,
  onCancel,
  onConfirm,
  parentIndustryName,
  productCount,
  productPreviewIsLoading,
  productPreviewIsUnavailable,
  subCategoryNames,
}: {
  activity: string;
  domainName: string;
  errorMessage: string;
  industryName: string;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  parentIndustryName: string;
  productCount: number | null;
  productPreviewIsLoading: boolean;
  productPreviewIsUnavailable: boolean;
  subCategoryNames: string[];
}) {
  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onCancel();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSaving, onCancel]);

  return (
    <div
      aria-describedby="confirm-master-inventory-domain-mapping-save-description"
      aria-labelledby="confirm-master-inventory-domain-mapping-save-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
    >
      <div className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.08em] text-[#007AFF] uppercase">
              Confirm activity
            </p>
            <h2
              id="confirm-master-inventory-domain-mapping-save-title"
              className="mt-1 text-lg font-bold text-[#1D1D1F]"
            >
              Save domain mapping?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="Close save domain mapping confirmation"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 rounded-lg border border-[#CFE3FF] bg-[#F7FBFF] p-3">
          <p className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
            Mapping summary
          </p>
          <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)]">
            <section
              aria-label="Mapping source"
              className="rounded-md border border-black/[0.08] bg-white p-3"
            >
              <p className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
                From · Cost Optimizer
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-[#5F6368]">Industry</dt>
                  <dd className="mt-0.5 font-semibold text-[#1D1D1F]">{industryName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5F6368]">Domain</dt>
                  <dd className="mt-0.5 font-semibold text-[#1D1D1F]">{domainName}</dd>
                </div>
              </dl>
            </section>
            <div className="flex items-center justify-center text-[#007AFF]" aria-hidden="true">
              <ArrowRight size={20} strokeWidth={2.25} className="rotate-90 sm:rotate-0" />
            </div>
            <section
              aria-label="Mapping target"
              className="rounded-md border border-[#007AFF]/20 bg-white p-3"
            >
              <p className="text-xs font-bold tracking-[0.06em] text-[#005CC8] uppercase">
                To · Master Inventory
              </p>
              <p className="mt-3 text-xs text-[#5F6368]">Industry</p>
              <p className="mt-0.5 text-sm font-semibold text-[#1D1D1F]">{parentIndustryName}</p>
              <p className="mt-3 text-xs text-[#5F6368]">Target subcategories</p>
              <div className="mt-1.5 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {subCategoryNames.length > 0 ? (
                  subCategoryNames.map((subCategoryName) => (
                    <span
                      key={subCategoryName}
                      className="rounded-full border border-[#007AFF]/20 bg-[#F7FBFF] px-2 py-1 text-xs font-medium text-[#005CC8]"
                    >
                      {subCategoryName}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#5F6368]">No subcategories will be mapped.</span>
                )}
              </div>
            </section>
          </div>
        </div>
        <div className="mt-3 rounded-md border border-black/[0.08] bg-[#FAFAFA] px-3 py-2.5">
          <p className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
            Product impact
          </p>
          {productPreviewIsLoading ? (
            <p className="mt-1 text-sm text-[#5F6368]">Checking matching products…</p>
          ) : productPreviewIsUnavailable ? (
            <p className="mt-1 text-sm text-[#9A6700]">
              Product impact is unavailable right now. You can retry the preview before saving.
            </p>
          ) : productCount !== null ? (
            <p className="mt-1 text-sm font-semibold text-[#1D1D1F]">
              {productCount} matching {productCount === 1 ? "product" : "products"}
            </p>
          ) : null}
        </div>
        <p className="mt-3 rounded-md bg-[#FFF7E8] px-3 py-2 text-xs leading-4 text-[#9A6700]">
          Saving replaces the currently saved Master Inventory subcategory mapping for this Cost
          Optimizer domain.
        </p>
        {productCount === 0 && !productPreviewIsLoading ? (
          <p className="mt-3 rounded-md bg-[#FFF1F0] px-3 py-2 text-xs leading-4 text-[#C5221F]">
            No active Master Inventory products match this draft mapping. Update the mapping before
            saving if matching products are expected.
          </p>
        ) : null}
        <p
          id="confirm-master-inventory-domain-mapping-save-description"
          className="mt-4 text-sm leading-5 text-[#5F6368]"
        >
          {activity}
        </p>
        {errorMessage ? (
          <p
            role="alert"
            className="mt-3 rounded-md bg-[#FFF1F0] px-3 py-2 text-sm font-medium text-[#C5221F]"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-md border border-black/[0.12] bg-white px-3 py-2 text-sm font-bold text-[#3C4043] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="rounded-md bg-[#007AFF] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#006FE6] disabled:cursor-wait disabled:bg-[#A1A1AA]"
          >
            {isSaving ? "Saving..." : "Confirm and save"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ExpandableChipItem = {
  id: string;
  label: string;
};

/**
 * Product logo for the Product impact preview.
 *
 * Master Inventory logos live on vendor CDNs, so a plain `<img>` is used rather
 * than `next/image` to avoid maintaining a remote-host allowlist. Only http(s)
 * URLs are rendered (the backend already normalizes this), and any load error
 * falls back to the product's initials.
 */
function ProductLogo({ logoUrl, name }: { logoUrl: string; name: string }) {
  const [hasError, setHasError] = useState(false);
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "?";
  const isRenderable = /^https?:\/\//i.test(logoUrl.trim());

  if (!isRenderable || hasError) {
    return (
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-bold text-[#005CC8] ring-1 ring-black/[0.08]"
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl.trim()}
      alt=""
      loading="lazy"
      decoding="async"
      width={32}
      height={32}
      onError={() => setHasError(true)}
      className="size-8 shrink-0 rounded-md bg-white object-contain p-1 ring-1 ring-black/[0.08]"
    />
  );
}

function ExpandableChipPanel({
  detailItems,
  detailLabel,
  items,
}: {
  detailItems: ExpandableChipItem[];
  detailLabel: string;
  items: ExpandableChipItem[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = items.slice(0, 2);
  const additionalItemCount = Math.max(0, items.length - visibleItems.length);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isExpanded]);

  return (
    <div ref={containerRef} className="relative mt-1 rounded-md border border-black/[0.14] p-2">
      <div className="flex items-start gap-1.5">
        <div className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5">
          {visibleItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-[#005CC8] shadow-sm ring-1 ring-[#007AFF]/20"
            >
              <span className="truncate">{item.label}</span>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          disabled={detailItems.length === 0}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? `Hide ${detailLabel.toLowerCase()}` : `Show ${detailLabel.toLowerCase()}`
          }
          className="inline-flex h-7 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-xs font-semibold text-[#005CC8] hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {additionalItemCount > 0 ? `+${additionalItemCount}` : null}
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {isExpanded ? (
        <div
          role="region"
          aria-label={detailLabel}
          className="absolute inset-x-0 top-0 z-30 rounded-md border border-[#8CC5FF] bg-[#F7FBFF] p-2 shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
        >
          <div className="flex items-start gap-1.5">
            <div className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5">
              {detailItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-[#005CC8] shadow-sm ring-1 ring-[#007AFF]/20"
                >
                  <span className="truncate">{item.label}</span>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="inline-flex h-7 shrink-0 items-center rounded-md px-1.5 text-[#005CC8] hover:bg-[#EAF4FF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:outline-none"
              aria-label={`Hide ${detailLabel.toLowerCase()}`}
            >
              <ChevronDown aria-hidden="true" size={16} className="rotate-180" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MappingStatusBadge({ dirty, configured }: { dirty: boolean; configured: boolean }) {
  const label = dirty ? "Unsaved" : configured ? "Saved" : "Needs setup";
  const className = dirty
    ? "bg-[#FFF7E8] text-[#9A6700]"
    : configured
      ? "bg-[#EAF8EF] text-[#137333]"
      : "bg-[#F1F3F4] text-[#5F6368]";

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

type MasterInventoryOption = {
  id: string;
  name: string;
};

type MasterInventorySearchSelectProps = {
  ariaDescribedBy: string;
  ariaLabelledBy: string;
  disabled: boolean;
  emptyMessage: string;
  onChange: (value: string) => void;
  options: MasterInventoryOption[];
  placeholder: string;
  searchLabel: string;
  value: string;
};

function MasterInventorySearchSelect({
  ariaDescribedBy,
  ariaLabelledBy,
  disabled,
  emptyMessage,
  onChange,
  options,
  placeholder,
  searchLabel,
  value,
}: MasterInventorySearchSelectProps) {
  const dropdownId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const selectedOption = options.find((option) => option.id === value);
  const filteredOptions = useMemo(
    () =>
      options.filter(
        (option) => !normalizedSearch || option.name.toLowerCase().includes(normalizedSearch),
      ),
    [normalizedSearch, options],
  );

  function closeDropdown(restoreFocus = false) {
    setIsOpen(false);
    setSearch("");
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }

  function selectOption(optionId: string) {
    onChange(optionId);
    closeDropdown(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeDropdown();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown(true);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative mt-2">
      <button
        ref={triggerRef}
        type="button"
        aria-controls={dropdownId}
        aria-describedby={ariaDescribedBy}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-black/[0.14] bg-white px-3 text-left text-sm text-[#171717] transition hover:border-[#007AFF]/60 focus-visible:border-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.name || placeholder}</span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`shrink-0 text-[#5F6368] transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen ? (
        <div
          id={dropdownId}
          role="dialog"
          aria-label={searchLabel}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[#BFD9F6] bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.16)]"
        >
          <div className="relative">
            <Search
              aria-hidden="true"
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#86868B]"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search industries"
              aria-label={searchLabel}
              className="h-9 w-full rounded-md border border-black/[0.14] bg-white pr-9 pl-9 text-sm text-[#171717] placeholder:text-[#86868B] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-[#5F6368] hover:bg-[#F1F3F4] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:outline-none"
                aria-label="Clear industry search"
              >
                <X aria-hidden="true" size={15} />
              </button>
            ) : null}
          </div>
          <div className="mt-2 max-h-52 overflow-y-auto" aria-live="polite">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.id === value;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectOption(option.id)}
                    className={`flex min-h-9 w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:outline-none ${
                      isSelected
                        ? "bg-[#EAF4FF] font-semibold text-[#005CC8]"
                        : "text-[#171717] hover:bg-[#F8F9FA]"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.name}</span>
                    {isSelected ? <Check aria-hidden="true" size={16} /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-2 py-3 text-sm text-[#5F6368]">
                {emptyMessage} “{search.trim()}”.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
