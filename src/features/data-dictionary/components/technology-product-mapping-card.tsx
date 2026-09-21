"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DataDictionaryPanel } from "@/features/data-dictionary/components/data-dictionary-panel";
import type { DictionaryIndustry, DictionaryLibrary } from "@/features/data-dictionary/model";
import {
  technologyProductMappingQueryKey,
  useTechnologyProductDomainMapping,
  useTechnologyProductIndustryMapping,
  useZoftwarehubParentIndustries,
  useZoftwarehubSubCategories,
} from "@/features/data-dictionary/queries";
import {
  updateTechnologyProductDomainMapping,
  updateTechnologyProductIndustryMapping,
} from "@/features/data-dictionary/api";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";

type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;

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
  const [saveError, setSaveError] = useState("");

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

  const parentIndustryIds =
    parentIndustrySelection?.scopeId === activeIndustryId
      ? parentIndustrySelection.ids
      : industryMapping?.industryId === activeIndustryId
        ? industryMapping.parentIndustries.map((industry) => industry.id)
        : [];
  const subCategoryIds =
    subCategorySelection?.scopeId === activeDomainId
      ? subCategorySelection.ids
      : domainMapping?.industryDomainId === activeDomainId
        ? domainMapping.subCategories.map((subCategory) => subCategory.id)
        : [];

  function toggleSubCategory(subCategoryId: string, isSelected: boolean) {
    setSubCategorySelection({
      ids: isSelected
        ? Array.from(new Set([...subCategoryIds, subCategoryId]))
        : subCategoryIds.filter((id) => id !== subCategoryId),
      scopeId: activeDomainId,
    });
  }

  async function saveIndustryMapping() {
    if (!activeIndustryId) {
      return;
    }

    try {
      setSaveError("");
      await updateIndustryMappingMutation.mutateAsync({
        industryId: activeIndustryId,
        parentIndustryIds,
      });
      await queryClient.invalidateQueries({
        queryKey: [...technologyProductMappingQueryKey, "industry", activeIndustryId],
      });
    } catch (error) {
      setSaveError(getErrorMessage(error));
    }
  }

  async function saveDomainMapping() {
    if (!activeDomainId) {
      return;
    }

    try {
      setSaveError("");
      await updateDomainMappingMutation.mutateAsync({
        domainId: activeDomainId,
        subCategoryIds,
      });
      await queryClient.invalidateQueries({
        queryKey: [...technologyProductMappingQueryKey, "domain", activeDomainId],
      });
    } catch (error) {
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
        <p className="max-w-3xl text-sm leading-5 text-[#5F6368]">
          Map each Cost Optimizer industry to Zoftwarehub parent industries, then map its domain to
          Zoftwarehub subcategories. Customer technology-stack requests use both selections to
          return matching products and their features.
        </p>
        {loadError || saveError ? (
          <p
            role="alert"
            className="rounded-md bg-[#FFF1F0] px-3 py-2 text-sm font-medium text-[#C5221F]"
          >
            {saveError || getErrorMessage(loadError)}
          </p>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-md border border-black/[0.08] p-4">
            <label
              className="block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
              htmlFor="technology-product-industry"
            >
              Cost Optimizer industry
            </label>
            <select
              id="technology-product-industry"
              value={activeIndustryId}
              onChange={(event) => setSelectedIndustryId(event.target.value)}
              disabled={!enabled || industries.length === 0}
              className="mt-2 h-10 w-full rounded-md border border-black/[0.14] bg-white px-3 text-sm text-[#171717] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
            >
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
            <label
              className="mt-4 block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
              htmlFor="zoftwarehub-parent-industries"
            >
              Zoftwarehub parent industries
            </label>
            <select
              id="zoftwarehub-parent-industries"
              multiple
              value={parentIndustryIds}
              onChange={(event) =>
                setParentIndustrySelection({
                  ids: getSelectedIds(event),
                  scopeId: activeIndustryId,
                })
              }
              disabled={!activeIndustryId || isLoading}
              className="mt-2 min-h-44 w-full rounded-md border border-black/[0.14] bg-white p-2 text-sm text-[#171717] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
              aria-describedby="zoftwarehub-parent-industries-help"
            >
              {(availableParentIndustries ?? []).map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
            <p
              id="zoftwarehub-parent-industries-help"
              className="mt-2 text-xs leading-4 text-[#86868B]"
            >
              Hold Ctrl or Command to select more than one industry.
            </p>
            <button
              type="button"
              onClick={() => void saveIndustryMapping()}
              disabled={!activeIndustryId || isLoading || updateIndustryMappingMutation.isPending}
              className="mt-4 rounded-md bg-[#007AFF] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#006FE6] disabled:cursor-not-allowed disabled:bg-[#A1A1AA]"
            >
              {updateIndustryMappingMutation.isPending ? "Saving…" : "Save industry mapping"}
            </button>
          </section>
          <section className="rounded-md border border-black/[0.08] p-4">
            <label
              className="block text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase"
              htmlFor="technology-product-domain"
            >
              Cost Optimizer domain
            </label>
            <select
              id="technology-product-domain"
              value={activeDomainId}
              onChange={(event) => setSelectedDomainId(event.target.value)}
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
            <fieldset
              disabled={!activeDomainId || isLoading}
              aria-describedby="zoftwarehub-sub-categories-help"
            >
              <legend className="mt-4 text-xs font-bold tracking-[0.06em] text-[#5F6368] uppercase">
                Zoftwarehub subcategories
              </legend>
              <div className="mt-2 max-h-44 w-full overflow-y-auto rounded-md border border-black/[0.14] bg-white p-2 text-sm text-[#171717] disabled:cursor-not-allowed disabled:bg-[#F8F9FA]">
                {(availableSubCategories ?? []).map((subCategory) => (
                  <label
                    key={subCategory.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-[#F8F9FA] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[#86868B]"
                  >
                    <input
                      type="checkbox"
                      checked={subCategoryIds.includes(subCategory.id)}
                      onChange={(event) => toggleSubCategory(subCategory.id, event.target.checked)}
                      disabled={!activeDomainId || isLoading}
                      className="size-4 rounded border-black/[0.25] accent-[#007AFF]"
                    />
                    <span>{subCategory.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p
              id="zoftwarehub-sub-categories-help"
              className="mt-2 text-xs leading-4 text-[#86868B]"
            >
              Select every Zoftwarehub subcategory that applies to this Cost Optimizer domain.
            </p>
            <button
              type="button"
              onClick={() => void saveDomainMapping()}
              disabled={!activeDomainId || isLoading || updateDomainMappingMutation.isPending}
              className="mt-4 rounded-md bg-[#007AFF] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#006FE6] disabled:cursor-not-allowed disabled:bg-[#A1A1AA]"
            >
              {updateDomainMappingMutation.isPending ? "Saving…" : "Save domain mapping"}
            </button>
          </section>
        </div>
      </div>
    </DataDictionaryPanel>
  );
}

type ScopedSelection = {
  ids: string[];
  scopeId: string;
};

function getSelectedIds(event: SelectChangeEvent) {
  return Array.from(event.target.selectedOptions, (option) => option.value);
}
