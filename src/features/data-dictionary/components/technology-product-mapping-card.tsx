"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DataDictionaryPanel } from "@/features/data-dictionary/components/data-dictionary-panel";
import type { DictionaryIndustry, DictionaryLibrary } from "@/features/data-dictionary/model";
import {
  dataDictionaryCatalogQueryKey,
  technologyProductMappingQueryKey,
  useTechnologyProductDomainMapping,
  useTechnologyProductIndustryMapping,
  useTechnologyProductMappingPreview,
  useZoftwarehubParentIndustries,
  useZoftwarehubSubCategories,
} from "@/features/data-dictionary/queries";
import {
  updateTechnologyProductDomainMapping,
  updateTechnologyProductIndustryMapping,
} from "@/features/data-dictionary/api";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";

export function TechnologyProductMappingCard({
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
  const [parentIndustrySelection, setParentIndustrySelection] = useState<ScopedSelection | null>(
    null,
  );
  const [subCategorySelection, setSubCategorySelection] = useState<ScopedSelection | null>(null);
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [areSelectedSubCategoriesExpanded, setAreSelectedSubCategoriesExpanded] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

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
    data: availableParentIndustries,
    error: parentIndustriesError,
    isLoading: isParentIndustriesLoading,
  } = useZoftwarehubParentIndustries({ enabled });
  const {
    data: availableSubCategories,
    error: subCategoriesError,
    isLoading: isSubCategoriesLoading,
  } = useZoftwarehubSubCategories({ enabled });
  const {
    data: industryMapping,
    error: industryMappingError,
    isLoading: isIndustryMappingLoading,
  } = useTechnologyProductIndustryMapping({
    enabled,
    industryId: activeIndustryId,
  });
  const {
    data: domainMapping,
    error: domainMappingError,
    isLoading: isDomainMappingLoading,
  } = useTechnologyProductDomainMapping({
    domainId: activeDomainId,
    enabled,
  });
  const updateIndustryMappingMutation = useMutation({
    mutationFn: updateTechnologyProductIndustryMapping,
  });
  const updateDomainMappingMutation = useMutation({
    mutationFn: updateTechnologyProductDomainMapping,
  });

  const persistedParentIndustryIds =
    industryMapping?.industryId === activeIndustryId
      ? industryMapping.parentIndustries.slice(0, 1).map((industry) => industry.id)
      : [];
  const parentIndustryIds =
    parentIndustrySelection?.scopeId === activeIndustryId
      ? parentIndustrySelection.ids
      : persistedParentIndustryIds;
  const persistedSubCategoryIds =
    domainMapping?.industryDomainId === activeDomainId
      ? domainMapping.subCategories.map((subCategory) => subCategory.id)
      : [];
  const subCategoryIds =
    subCategorySelection?.scopeId === activeDomainId
      ? subCategorySelection.ids
      : persistedSubCategoryIds;
  const parentIndustryOptions = availableParentIndustries ?? [];
  const parentIndustryIdsMappedToOtherIndustries = new Set(
    industries
      .filter((industry) => industry.id !== activeIndustryId)
      .flatMap((industry) => industry.zoftwarehubParentIndustryIds ?? []),
  );
  const availableParentIndustryOptions = parentIndustryOptions.filter(
    (industry) =>
      industry.id === parentIndustryIds[0] ||
      !parentIndustryIdsMappedToOtherIndustries.has(industry.id),
  );
  const subCategoryOptions = availableSubCategories ?? [];
  const selectedParentIndustry = parentIndustryOptions.find(
    (industry) => industry.id === parentIndustryIds[0],
  );
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
  const isIndustryMappingDirty = !haveSameIds(parentIndustryIds, persistedParentIndustryIds);
  const isDomainMappingDirty = !haveSameIds(subCategoryIds, persistedSubCategoryIds);
  const hasUnsavedChanges = isIndustryMappingDirty || isDomainMappingDirty;
  const {
    data: productPreview,
    error: productPreviewError,
    isLoading: isProductPreviewLoading,
    refetch: refetchProductPreview,
  } = useTechnologyProductMappingPreview({
    enabled: enabled && Boolean(activeDomainId),
    parentIndustryId: parentIndustryIds[0] || "",
    subCategoryIds,
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

    setSubCategorySelection({
      ids: nextSubCategoryIds,
      scopeId: activeDomainId,
    });
  }

  async function saveIndustryMapping() {
    if (!activeIndustryId || parentIndustryIds.length !== 1) {
      return;
    }

    try {
      setSaveError("");
      setSaveSuccess("");
      await updateIndustryMappingMutation.mutateAsync({
        industryId: activeIndustryId,
        parentIndustryIds,
      });
      await queryClient.invalidateQueries({
        queryKey: [...technologyProductMappingQueryKey, "industry", activeIndustryId],
      });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryCatalogQueryKey });
      setSaveSuccess("Industry mapping saved.");
    } catch (error) {
      setSaveSuccess("");
      setSaveError(getErrorMessage(error));
    }
  }

  async function saveDomainMapping() {
    if (!activeDomainId) {
      return;
    }

    try {
      setSaveError("");
      setSaveSuccess("");
      await updateDomainMappingMutation.mutateAsync({
        domainId: activeDomainId,
        subCategoryIds,
      });
      await queryClient.invalidateQueries({
        queryKey: [...technologyProductMappingQueryKey, "domain", activeDomainId],
      });
      setSaveSuccess("Domain subcategory mapping saved.");
    } catch (error) {
      setSaveSuccess("");
      setSaveError(getErrorMessage(error));
    }
  }

  const isLoading =
    isParentIndustriesLoading ||
    isSubCategoriesLoading ||
    isIndustryMappingLoading ||
    isDomainMappingLoading;
  const loadError =
    parentIndustriesError || subCategoriesError || industryMappingError || domainMappingError;

  return (
    <DataDictionaryPanel title="Technology Product Mapping" className="mt-5">
      <div className="mt-5 space-y-5">
        <p className="text-sm leading-5 text-[#5F6368]">
          Map each Cost Optimizer industry to one Zoftwarehub parent industry, then map its domain
          to one or more Zoftwarehub subcategories. Customer technology-stack requests use both
          selections to return matching products and their features.
        </p>
        <div
          className="grid gap-3 rounded-md border border-[#007AFF]/15 bg-[#F7FBFF] p-3 text-sm text-[#1D1D1F] lg:grid-cols-3"
          aria-live="polite"
        >
          <p>
            <span className="font-semibold">Industry mapping: </span>
            {selectedParentIndustry?.name || "Needs one parent industry"}
          </p>
          <p>
            <span className="font-semibold">Domain mapping: </span>
            {subCategoryIds.length > 0
              ? `${subCategoryIds.length} subcategor${subCategoryIds.length === 1 ? "y" : "ies"} selected`
              : "Needs subcategories"}
          </p>
          <p>
            <span className="font-semibold">Mapping status: </span>
            <span
              className={
                hasUnsavedChanges
                  ? "text-[#9A6700]"
                  : parentIndustryIds.length === 1 && subCategoryIds.length > 0
                    ? "text-[#137333]"
                    : "text-[#5F6368]"
              }
            >
              {hasUnsavedChanges
                ? "Changes not saved"
                : parentIndustryIds.length === 1 && subCategoryIds.length > 0
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
                <h3 className="mt-1 text-base font-bold text-[#1D1D1F]">
                  Choose the parent industry
                </h3>
                <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                  This single industry applies to every mapped domain below.
                </p>
              </div>
              <MappingStatusBadge
                configured={parentIndustryIds.length === 1}
                dirty={isIndustryMappingDirty}
              />
            </div>
            <label
              className="block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
              htmlFor="technology-product-industry"
            >
              Cost Optimizer industry
            </label>
            <select
              id="technology-product-industry"
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
              id="zoftwarehub-parent-industries-label"
              className="mt-4 block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
            >
              Zoftwarehub parent industry
            </span>
            <ParentIndustrySearchSelect
              key={activeIndustryId}
              ariaDescribedBy="zoftwarehub-parent-industries-help"
              ariaLabelledBy="zoftwarehub-parent-industries-label"
              disabled={!activeIndustryId || isLoading}
              onChange={(parentIndustryId) => {
                clearSaveFeedback();
                setParentIndustrySelection({
                  ids: parentIndustryId ? [parentIndustryId] : [],
                  scopeId: activeIndustryId,
                });
              }}
              options={availableParentIndustryOptions}
              value={parentIndustryIds[0] || ""}
            />
            <p
              id="zoftwarehub-parent-industries-help"
              className="mt-2 text-xs leading-4 text-[#86868B]"
            >
              Select one Zoftwarehub parent industry for this Cost Optimizer industry. Parent
              industries already mapped to another Cost Optimizer industry are unavailable.
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
                  parentIndustryIds.length !== 1 ||
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
                  Select every Zoftwarehub subcategory that should return products for this domain.
                </p>
              </div>
              <MappingStatusBadge
                configured={subCategoryIds.length > 0}
                dirty={isDomainMappingDirty}
              />
            </div>
            <label
              className="block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
              htmlFor="technology-product-domain"
            >
              Cost Optimizer domain
            </label>
            <select
              id="technology-product-domain"
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
                aria-describedby="zoftwarehub-sub-categories-help"
              >
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <legend className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
                    Zoftwarehub subcategories
                  </legend>
                  <p className="text-xs font-medium text-[#5F6368]" aria-live="polite">
                    {subCategoryIds.length} selected · {visibleSubCategories.length} visible
                  </p>
                </div>
                <p className="mt-1 text-xs text-[#86868B]">
                  {subCategoryOptions.length} available for this parent industry
                </p>
                <div className="relative z-0 mt-2 overflow-visible rounded-md border border-black/[0.14] bg-white">
                  {selectedSubCategories.length > 0 ? (
                    <div className="border-b border-black/[0.08] bg-[#F7FBFF] p-2">
                      <div className="flex items-start gap-1.5">
                        <div
                          className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5"
                          aria-label="Selected Zoftwarehub subcategories"
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
                          aria-label="Expanded selected Zoftwarehub subcategories"
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
                        aria-label="Search Zoftwarehub subcategories"
                        className="h-9 w-full rounded-md border border-transparent bg-[#F8F9FA] pr-3 pl-9 text-sm text-[#171717] placeholder:text-[#86868B] focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-2 text-sm text-[#171717]">
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
                className="rounded-lg border border-[#007AFF]/15 bg-[#F7FBFF] p-4"
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
                {parentIndustryIds.length !== 1 ? (
                  <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                    Select one parent industry to preview matching products.
                  </p>
                ) : subCategoryIds.length === 0 ? (
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
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-white p-3 ring-1 ring-black/[0.06]">
                        <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5F6368] uppercase">
                          Products
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#1D1D1F]">
                          {productPreview.productCount}
                        </p>
                      </div>
                      <div className="rounded-md bg-white p-3 ring-1 ring-black/[0.06]">
                        <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5F6368] uppercase">
                          Features
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#1D1D1F]">
                          {productPreview.featureCount}
                        </p>
                      </div>
                    </div>
                    {productPreview.productCount === 0 ? (
                      <p className="mt-3 rounded-md bg-[#FFF7E8] px-2 py-2 text-xs leading-4 text-[#9A6700]">
                        No active Zoftwarehub products match this draft mapping. Update it before
                        saving.
                      </p>
                    ) : productPreview.sampleProducts.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5F6368] uppercase">
                          Sample products
                        </p>
                        <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                          {productPreview.sampleProducts
                            .map((product) => product.name)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
            <p
              id="zoftwarehub-sub-categories-help"
              className="mt-2 text-xs leading-4 text-[#86868B]"
            >
              Select every Zoftwarehub subcategory that applies to this Cost Optimizer domain.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-4">
              <p className="max-w-xl text-xs leading-4 text-[#5F6368]">
                Saving makes this industry and domain combination available to customer
                technology-stack requests.
              </p>
              <button
                type="button"
                onClick={() => void saveDomainMapping()}
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
    </DataDictionaryPanel>
  );
}

type ParentIndustryOption = {
  id: string;
  name: string;
};

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

function haveSameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

type ParentIndustrySearchSelectProps = {
  ariaDescribedBy: string;
  ariaLabelledBy: string;
  disabled: boolean;
  onChange: (value: string) => void;
  options: ParentIndustryOption[];
  value: string;
};

function ParentIndustrySearchSelect({
  ariaDescribedBy,
  ariaLabelledBy,
  disabled,
  onChange,
  options,
  value,
}: ParentIndustrySearchSelectProps) {
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
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.name || "Select a parent industry"}
        </span>
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
          aria-label="Search Zoftwarehub parent industries"
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
              placeholder="Search parent industries"
              aria-label="Search Zoftwarehub parent industries"
              className="h-9 w-full rounded-md border border-black/[0.14] bg-white pr-9 pl-9 text-sm text-[#171717] placeholder:text-[#86868B] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-[#5F6368] hover:bg-[#F1F3F4] focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 focus-visible:outline-none"
                aria-label="Clear parent industry search"
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
                No Zoftwarehub parent industry matches “{search.trim()}”.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ScopedSelection = {
  ids: string[];
  scopeId: string;
};
