"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

function haveSameNames(left: string[], right: string[]) {
  const normalize = (names: string[]) =>
    Array.from(new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))).sort();

  const leftNames = normalize(left);
  const rightNames = normalize(right);

  return (
    leftNames.length === rightNames.length && leftNames.every((name) => rightNames.includes(name))
  );
}

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
  const [industrySelection, setIndustrySelection] = useState<{
    ids: string[];
    scopeId: string;
  } | null>(null);
  const [subCategorySelection, setSubCategorySelection] = useState<{
    ids: string[];
    scopeId: string;
  } | null>(null);
  const [subCategorySearch, setSubCategorySearch] = useState("");
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
  const selectedIndustries =
    industrySelection?.scopeId === activeIndustryId ? industrySelection.ids : persistedIndustries;
  const persistedSubCategories =
    domainMapping?.industryDomainId === activeDomainId ? (domainMapping.subCategories ?? []) : [];
  const selectedSubCategories =
    subCategorySelection?.scopeId === activeDomainId
      ? subCategorySelection.ids
      : persistedSubCategories;

  const industryOptions = classifications?.industries ?? [];
  const subCategoryOptions = classifications?.subCategories ?? [];
  const normalizedSubCategorySearch = subCategorySearch.trim().toLowerCase();
  const visibleSubCategories = subCategoryOptions.filter(
    (name) =>
      !normalizedSubCategorySearch || name.toLowerCase().includes(normalizedSubCategorySearch),
  );

  const isIndustryMappingDirty = !haveSameNames(selectedIndustries, persistedIndustries);
  const isDomainMappingDirty = !haveSameNames(selectedSubCategories, persistedSubCategories);
  const hasUnsavedChanges = isIndustryMappingDirty || isDomainMappingDirty;

  const {
    data: productPreview,
    error: productPreviewError,
    isLoading: isProductPreviewLoading,
    refetch: refetchProductPreview,
  } = useMasterInventoryMappingPreview({
    enabled: enabled && Boolean(activeDomainId),
    industries: selectedIndustries,
    subCategories: selectedSubCategories,
  });

  function clearSaveFeedback() {
    setSaveError("");
    setSaveSuccess("");
  }

  function toggleName(
    kind: "industry" | "subCategory",
    name: string,
    isSelected: boolean,
    current: string[],
    scopeId: string,
    setSelection: (selection: { ids: string[]; scopeId: string }) => void,
  ) {
    clearSaveFeedback();
    const next = isSelected
      ? Array.from(new Set([...current, name]))
      : current.filter((item) => item.toLowerCase() !== name.toLowerCase());

    setSelection({ ids: next, scopeId });

    if (kind === "subCategory" && next.length === 0) {
      setSubCategorySearch("");
    }
  }

  async function saveIndustryMapping() {
    if (!activeIndustryId || selectedIndustries.length === 0) {
      return;
    }

    try {
      setSaveError("");
      setSaveSuccess("");
      await updateIndustryMappingMutation.mutateAsync({
        industries: selectedIndustries,
        industryId: activeIndustryId,
      });
      await queryClient.invalidateQueries({
        queryKey: [...masterInventoryMappingQueryKey, "industry", activeIndustryId],
      });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryCatalogQueryKey });
      setSaveSuccess("Master Inventory industry mapping saved.");
    } catch (error) {
      setSaveSuccess("");
      setSaveError(getErrorMessage(error));
    }
  }

  async function saveDomainMapping() {
    if (!activeDomainId || selectedSubCategories.length === 0) {
      return;
    }

    try {
      setSaveError("");
      setSaveSuccess("");
      await updateDomainMappingMutation.mutateAsync({
        domainId: activeDomainId,
        subCategories: selectedSubCategories,
      });
      await queryClient.invalidateQueries({
        queryKey: [...masterInventoryMappingQueryKey, "domain", activeDomainId],
      });
      setSaveSuccess("Master Inventory domain mapping saved.");
    } catch (error) {
      setSaveSuccess("");
      setSaveError(getErrorMessage(error));
    }
  }

  const isLoading = isClassificationsLoading || isIndustryMappingLoading || isDomainMappingLoading;
  const loadError = classificationsError || industryMappingError || domainMappingError;

  return (
    <DataDictionaryPanel title="Master Inventory Mapping" className="mt-5">
      <div className="mt-5 space-y-5">
        <p className="text-sm leading-5 text-[#5F6368]">
          Map each Cost Optimizer industry to one or more Master Inventory industries, then map its
          domain to one or more Master Inventory sub-categories. Customer technology-stack requests
          use both selections to return matching canonical child products.
        </p>
        <div
          className="grid gap-3 rounded-md border border-[#007AFF]/15 bg-[#F7FBFF] p-3 text-sm text-[#1D1D1F] lg:grid-cols-3"
          aria-live="polite"
        >
          <p>
            <span className="font-semibold">Industry mapping: </span>
            {selectedIndustries.length > 0
              ? `${selectedIndustries.length} industr${selectedIndustries.length === 1 ? "y" : "ies"} selected`
              : "Needs industries"}
          </p>
          <p>
            <span className="font-semibold">Domain mapping: </span>
            {selectedSubCategories.length > 0
              ? `${selectedSubCategories.length} subcategor${selectedSubCategories.length === 1 ? "y" : "ies"} selected`
              : "Needs sub-categories"}
          </p>
          <p>
            <span className="font-semibold">Mapping status: </span>
            <span
              className={
                hasUnsavedChanges
                  ? "text-[#9A6700]"
                  : selectedIndustries.length > 0 && selectedSubCategories.length > 0
                    ? "text-[#137333]"
                    : "text-[#5F6368]"
              }
            >
              {hasUnsavedChanges
                ? "Changes not saved"
                : selectedIndustries.length > 0 && selectedSubCategories.length > 0
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
            <div className="mb-5">
              <p className="text-xs font-bold tracking-[0.06em] text-[#007AFF] uppercase">Step 1</p>
              <h3 className="mt-1 text-base font-bold text-[#1D1D1F]">Choose industries</h3>
              <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                These industries apply to every mapped domain below.
              </p>
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
            <fieldset disabled={!activeIndustryId || isLoading} className="mt-4">
              <legend className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
                Master Inventory industries
              </legend>
              <p className="mt-1 text-xs text-[#86868B]" aria-live="polite">
                {selectedIndustries.length} selected · {industryOptions.length} available
              </p>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-black/[0.14] bg-white p-2 text-sm text-[#171717]">
                {industryOptions.map((name) => (
                  <label
                    key={name}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-[#F8F9FA] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[#86868B]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndustries.some(
                        (item) => item.toLowerCase() === name.toLowerCase(),
                      )}
                      onChange={(event) =>
                        toggleName(
                          "industry",
                          name,
                          event.target.checked,
                          selectedIndustries,
                          activeIndustryId,
                          setIndustrySelection,
                        )
                      }
                      disabled={!activeIndustryId || isLoading}
                      className="size-4 rounded border-black/[0.25] accent-[#007AFF]"
                    />
                    <span>{name}</span>
                  </label>
                ))}
                {industryOptions.length === 0 && !isLoading ? (
                  <p className="px-1 py-2 text-xs text-[#86868B]">
                    No Master Inventory industries available.
                  </p>
                ) : null}
              </div>
            </fieldset>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-4">
              <p className="max-w-44 text-xs leading-4 text-[#5F6368]">
                Save this selection before moving to another Cost Optimizer industry.
              </p>
              <button
                type="button"
                onClick={() => void saveIndustryMapping()}
                disabled={
                  !activeIndustryId ||
                  selectedIndustries.length === 0 ||
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
            <div className="mb-5">
              <p className="text-xs font-bold tracking-[0.06em] text-[#007AFF] uppercase">Step 2</p>
              <h3 className="mt-1 text-base font-bold text-[#1D1D1F]">Map domain sub-categories</h3>
              <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                Select every Master Inventory sub-category that should return products for this
                domain.
              </p>
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
            <fieldset
              disabled={!activeDomainId || isLoading}
              aria-describedby="master-inventory-sub-categories-help"
              className="mt-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <legend className="text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
                  Master Inventory sub-categories
                </legend>
                <p className="text-xs font-medium text-[#5F6368]" aria-live="polite">
                  {selectedSubCategories.length} selected · {visibleSubCategories.length} visible
                </p>
              </div>
              <div className="relative mt-2">
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
                  placeholder="Search sub-categories"
                  aria-label="Search Master Inventory sub-categories"
                  className="h-9 w-full rounded-md border border-black/[0.14] bg-white pr-3 pl-9 text-sm text-[#171717] placeholder:text-[#86868B] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
                />
              </div>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-black/[0.14] bg-white p-2 text-sm text-[#171717]">
                {visibleSubCategories.map((name) => (
                  <label
                    key={name}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-[#F8F9FA] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[#86868B]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubCategories.some(
                        (item) => item.toLowerCase() === name.toLowerCase(),
                      )}
                      onChange={(event) =>
                        toggleName(
                          "subCategory",
                          name,
                          event.target.checked,
                          selectedSubCategories,
                          activeDomainId,
                          setSubCategorySelection,
                        )
                      }
                      disabled={!activeDomainId || isLoading}
                      className="size-4 rounded border-black/[0.25] accent-[#007AFF]"
                    />
                    <span>{name}</span>
                  </label>
                ))}
                {visibleSubCategories.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-[#86868B]">No matching sub-categories.</p>
                ) : null}
              </div>
            </fieldset>
            <div
              className="relative z-10 mt-4 rounded-lg border border-[#007AFF]/15 bg-[#F7FBFF] p-4"
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
              {selectedIndustries.length === 0 ? (
                <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                  Select one or more Master Inventory industries to preview matching products.
                </p>
              ) : selectedSubCategories.length === 0 ? (
                <p className="mt-1 text-xs leading-4 text-[#5F6368]">
                  Select one or more sub-categories to preview matching products and features.
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
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2.5 ring-1 ring-black/[0.06]">
                    <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5F6368] uppercase">
                      Products
                    </p>
                    <p className="text-xl leading-none font-bold text-[#1D1D1F]">
                      {productPreview.productCount}
                    </p>
                  </div>
                  {productPreview.truncated ? (
                    <p className="mt-2 text-xs leading-4 text-[#5F6368]">
                      Coverage is capped while the catalog is large; counts reflect the first fetch
                      window.
                    </p>
                  ) : null}
                  {productPreview.productCount === 0 ? (
                    <p className="mt-3 rounded-md bg-[#FFF7E8] px-2 py-2 text-xs leading-4 text-[#9A6700]">
                      No active Master Inventory products match this draft mapping. Update it before
                      saving.
                    </p>
                  ) : productPreview.sampleProducts.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5F6368] uppercase">
                        Sample products
                      </p>
                      <ul className="mt-1 max-h-44 space-y-1 overflow-y-auto pr-1">
                        {productPreview.sampleProducts.map((product) => (
                          <li
                            key={product.id}
                            className="text-xs leading-4 font-semibold text-[#1D1D1F]"
                          >
                            {product.name}
                            <span className="ml-1 font-normal text-[#5F6368]">
                              · {product.features.length}{" "}
                              {product.features.length === 1 ? "feature" : "features"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
            <p
              id="master-inventory-sub-categories-help"
              className="mt-2 text-xs leading-4 text-[#86868B]"
            >
              Select every Master Inventory sub-category that applies to this Cost Optimizer domain.
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
                  selectedSubCategories.length === 0 ||
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
