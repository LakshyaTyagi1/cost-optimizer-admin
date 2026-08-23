"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import { AdminShell } from "@/components/admin-shell/admin-shell";

import {
  processCategories,
  processTiers,
  type DictionaryDomain,
  type DictionaryIndustry,
  type DictionaryLibrary,
  type DictionaryProcess,
  type TechStackTool,
} from "@/features/data-dictionary/model";
import type {
  ActivateAllToolsConfirmationModalProps,
  ArchiveAllToolsConfirmationModalProps,
  DeleteAllToolsConfirmationModalProps,
  DeleteProcessConfirmationModalProps,
  DeleteToolConfirmationModalProps,
} from "./confirmation-modals";
import type { ProcessFormState } from "./new-process-modal";
import type { ToolFormState } from "./tech-stack-tool-modal";
import {
  activateAllDataDictionaryTechStack,
  addDataDictionaryDefaultDomains,
  addDataDictionaryDefaultIndustries,
  addDataDictionaryDefaultIndustryDomainProcesses,
  addDataDictionaryDefaultIndustryProcesses,
  archiveAllDataDictionaryTechStack,
  createDataDictionaryDomain,
  createDataDictionaryDomainProcess,
  createDataDictionaryIndustry,
  createDataDictionaryIndustryProcess,
  createDataDictionaryProcessLibrary,
  createDataDictionaryTechStack,
  deleteDataDictionaryProcess,
  deleteDataDictionaryIndustry,
  deleteDataDictionaryProcessLibrary,
  permanentlyDeleteDataDictionaryDomain,
  deleteAllDataDictionaryTechStack,
  deleteDataDictionaryTechStack,
  reorderDataDictionaryDomains,
  reorderDataDictionaryIndustries,
  updateDataDictionaryCurrencyConversionRate,
  updateDataDictionaryDomainDisplayName,
  updateDataDictionaryTechStack,
  updateDataDictionaryTechStackStatus,
  updateDataDictionaryProcess,
  updateDataDictionaryProcessStatus,
  type DataDictionaryProcessPage,
} from "@/features/data-dictionary/api";
import {
  archiveProcessesQueryKey,
  dataDictionaryCatalogQueryKey,
  dataDictionaryOptionsQueryKey,
  dataDictionaryProcessesQueryKey,
  techStackQueryKey,
  useDataDictionaryOptions,
  useDataDictionaryPageCatalog,
  useDataDictionaryProcessPage,
  useMappedTechStackPage,
} from "@/features/data-dictionary/queries";
import { dashboardQueryKey } from "@/features/dashboard/queries";
import { assessmentsQueryKey } from "@/features/assessments/queries";

import { BenchmarkCard } from "@/features/data-dictionary/components/benchmark-card";
import { IndustryDomainManager } from "@/features/data-dictionary/components/industry-domain-manager";
import { LazyViewportSection } from "@/features/data-dictionary/components/lazy-viewport-section";
import { ProcessLibraryCard } from "@/features/data-dictionary/components/process-library-card";
import { DataDictionaryPageHeader } from "@/features/data-dictionary/components/page-header";
import {
  ReorderToastStack,
  type ReorderToastState,
} from "@/features/data-dictionary/components/reorder-toast-stack";
import { TechnologyStackCard } from "@/features/data-dictionary/components/technology-stack-card";
import {
  AutomationLevelsCard,
  ProcessTiersCard,
} from "@/features/data-dictionary/components/reference-scale-cards";
import {
  getDomainIdentity,
  normalizeSearch,
  toDisplayName,
} from "@/features/data-dictionary/utils/domain-mapping";
import {
  createDomainIdentityById,
  getSelectedProcessDomainFilterKey,
} from "@/features/data-dictionary/utils/process-library";
import {
  formatConversionRateInput,
  getDisplayToBaseCurrencyRate,
  parseAmount,
  defaultDisplayToBaseCurrencyRate,
} from "@/features/data-dictionary/utils/amount";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";
import {
  createEmptyProcessForm,
  createProcessFormFromProcess,
  createToolBenchmarkPricingPayload,
  createToolFormFromTool,
  emptyToolForm,
} from "@/features/data-dictionary/utils/form-state";

const dataDictionaryToastDismissMs = 8000;
const initialExpandedProcessId = "__initial_process__";
const processLibraryPageSize = 12;
const technologyStackLibraryPageSize = 20;
const emptyIndustries: DictionaryIndustry[] = [];
const emptyDomains: DictionaryDomain[] = [];
const emptyLibraries: DictionaryLibrary[] = [];
const emptyProcesses: DictionaryProcess[] = [];
const emptyTechStack: TechStackTool[] = [];
const DeleteProcessConfirmationModal = dynamic<DeleteProcessConfirmationModalProps>(
  () => import("./confirmation-modals").then((module) => module.DeleteProcessConfirmationModal),
  { ssr: false },
);
const DeleteToolConfirmationModal = dynamic<DeleteToolConfirmationModalProps>(
  () => import("./confirmation-modals").then((module) => module.DeleteToolConfirmationModal),
  { ssr: false },
);
const DeleteAllToolsConfirmationModal = dynamic<DeleteAllToolsConfirmationModalProps>(
  () => import("./confirmation-modals").then((module) => module.DeleteAllToolsConfirmationModal),
  { ssr: false },
);
const ArchiveAllToolsConfirmationModal = dynamic<ArchiveAllToolsConfirmationModalProps>(
  () => import("./confirmation-modals").then((module) => module.ArchiveAllToolsConfirmationModal),
  { ssr: false },
);
const ActivateAllToolsConfirmationModal = dynamic<ActivateAllToolsConfirmationModalProps>(
  () => import("./confirmation-modals").then((module) => module.ActivateAllToolsConfirmationModal),
  { ssr: false },
);

export function DataDictionaryPage() {
  const queryClient = useQueryClient();
  const [industryName, setIndustryName] = useState("");
  const [domainName, setDomainName] = useState("");
  const [domainIndustryId, setDomainIndustryId] = useState("");
  const [mappingIndustryId, setMappingIndustryId] = useState("");
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);
  const [isToolFormOpen, setIsToolFormOpen] = useState(false);
  const [processSearch, setProcessSearch] = useState("");
  const [processDomainFilter, setProcessDomainFilter] = useState("all");
  const [processIndustryFilter, setProcessIndustryFilter] = useState("all");
  const [processPage, setProcessPage] = useState(1);
  const [toolSearch, setToolSearch] = useState("");
  const [toolPage, setToolPage] = useState(1);
  const [processForm, setProcessForm] = useState<ProcessFormState>(() =>
    createEmptyProcessForm([]),
  );
  const [editingProcess, setEditingProcess] = useState<DictionaryProcess | null>(null);
  const [processActionId, setProcessActionId] = useState("");
  const [processDeleteTarget, setProcessDeleteTarget] = useState<DictionaryProcess | null>(null);
  const [currencyRateInput, setCurrencyRateInput] = useState<string | null>(null);
  const [savedDisplayToBaseCurrencyRateOverride, setSavedDisplayToBaseCurrencyRateOverride] =
    useState<number | null>(null);
  const [toolForm, setToolForm] = useState<ToolFormState>(emptyToolForm);
  const [toolActionId, setToolActionId] = useState("");
  const [editingTool, setEditingTool] = useState<TechStackTool | null>(null);
  const [toolDeleteTarget, setToolDeleteTarget] = useState<TechStackTool | null>(null);
  const [isActivateAllToolsOpen, setIsActivateAllToolsOpen] = useState(false);
  const [isArchiveAllToolsOpen, setIsArchiveAllToolsOpen] = useState(false);
  const [isDeleteAllToolsOpen, setIsDeleteAllToolsOpen] = useState(false);
  const [isIndustryDomainReady, setIsIndustryDomainReady] = useState(false);
  const [isProcessLibraryReady, setIsProcessLibraryReady] = useState(false);
  const [isTechnologyStackReady, setIsTechnologyStackReady] = useState(false);
  const [debouncedProcessSearch, setDebouncedProcessSearch] = useState("");
  const [techStackToasts, setTechStackToasts] = useState<ReorderToastState[]>([]);
  const [expandedProcessId, setExpandedProcessId] = useState(initialExpandedProcessId);
  const [dictionaryError, setDictionaryError] = useState("");
  const techStackToastIdRef = useRef(0);
  const techStackToastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedProcessSearch(processSearch.trim());
    }, 275);

    return () => window.clearTimeout(timeoutId);
  }, [processSearch]);

  const {
    data: catalogData,
    error: catalogQueryError,
    isLoading: isCatalogLoading,
  } = useDataDictionaryPageCatalog({
    enabled: isIndustryDomainReady || isProcessLibraryReady,
  });
  const {
    data: processOptions,
    error: processOptionsQueryError,
    isLoading: isProcessOptionsLoading,
  } = useDataDictionaryOptions({ enabled: isProcessLibraryReady });
  const processCatalog = useMemo(
    () =>
      catalogData && processOptions
        ? {
            ...catalogData,
            options: processOptions,
          }
        : undefined,
    [catalogData, processOptions],
  );
  const industries = catalogData?.industries ?? emptyIndustries;
  const domains = catalogData?.domains ?? emptyDomains;
  const inactiveDomains = catalogData?.inactiveDomains ?? emptyDomains;
  const libraries = catalogData?.libraries ?? emptyLibraries;
  const inactiveIndustries = catalogData?.inactiveIndustries ?? emptyIndustries;
  const domainIdentityById = useMemo(
    () => createDomainIdentityById(domains, libraries),
    [domains, libraries],
  );
  const selectedProcessDomainFilterKey = useMemo(
    () => getSelectedProcessDomainFilterKey(processDomainFilter, domainIdentityById),
    [domainIdentityById, processDomainFilter],
  );
  const processScope =
    processDomainFilter === "industry-default"
      ? "industry-default"
      : processDomainFilter === "all"
        ? undefined
        : "industry-domain";
  const {
    data: processPageData,
    error: processQueryError,
    isLoading: isProcessLoading,
  } = useDataDictionaryProcessPage({
    catalog: processCatalog,
    domainKey: processScope === "industry-domain" ? selectedProcessDomainFilterKey : undefined,
    enabled: isProcessLibraryReady,
    industryId: processIndustryFilter === "all" ? undefined : processIndustryFilter,
    limit: processLibraryPageSize,
    page: processPage,
    scope: processScope,
    search: debouncedProcessSearch,
  });
  const {
    data: techStackData,
    error: techStackQueryError,
    isLoading: isTechStackLoading,
  } = useMappedTechStackPage({
    enabled: isTechnologyStackReady,
    limit: technologyStackLibraryPageSize,
    page: toolPage,
    search: toolSearch,
  });
  const createIndustryMutation = useMutation({
    mutationFn: createDataDictionaryIndustry,
  });
  const addDefaultIndustriesMutation = useMutation({
    mutationFn: addDataDictionaryDefaultIndustries,
  });
  const addDefaultDomainsMutation = useMutation({
    mutationFn: addDataDictionaryDefaultDomains,
  });
  const activateIndustryMutation = useMutation({
    mutationFn: createDataDictionaryIndustry,
  });
  const deleteIndustryMutation = useMutation({
    mutationFn: deleteDataDictionaryIndustry,
  });
  const createDomainMutation = useMutation({
    mutationFn: createDataDictionaryDomain,
  });
  const renameDomainMutation = useMutation({
    mutationFn: updateDataDictionaryDomainDisplayName,
  });
  const createProcessLibraryMutation = useMutation({
    mutationFn: createDataDictionaryProcessLibrary,
  });
  const deleteProcessLibraryMutation = useMutation({
    mutationFn: deleteDataDictionaryProcessLibrary,
  });
  const permanentlyDeleteDomainMutation = useMutation({
    mutationFn: permanentlyDeleteDataDictionaryDomain,
  });
  const reorderIndustriesMutation = useMutation({
    mutationFn: reorderDataDictionaryIndustries,
  });
  const reorderDomainsMutation = useMutation({
    mutationFn: reorderDataDictionaryDomains,
  });
  const updateCurrencyConversionRateMutation = useMutation({
    mutationFn: updateDataDictionaryCurrencyConversionRate,
  });
  const createIndustryProcessMutation = useMutation({
    mutationFn: createDataDictionaryIndustryProcess,
  });
  const addDefaultIndustryProcessesMutation = useMutation({
    mutationFn: addDataDictionaryDefaultIndustryProcesses,
  });
  const addDefaultIndustryDomainProcessesMutation = useMutation({
    mutationFn: addDataDictionaryDefaultIndustryDomainProcesses,
  });
  const createDomainProcessMutation = useMutation({
    mutationFn: createDataDictionaryDomainProcess,
  });
  const updateProcessMutation = useMutation({
    mutationFn: updateDataDictionaryProcess,
  });
  const updateProcessStatusMutation = useMutation({
    mutationFn: updateDataDictionaryProcessStatus,
  });
  const deleteProcessMutation = useMutation({
    mutationFn: deleteDataDictionaryProcess,
  });
  const createTechStackMutation = useMutation({
    mutationFn: createDataDictionaryTechStack,
  });
  const updateTechStackMutation = useMutation({
    mutationFn: updateDataDictionaryTechStack,
  });
  const updateTechStackStatusMutation = useMutation({
    mutationFn: updateDataDictionaryTechStackStatus,
  });
  const deleteTechStackMutation = useMutation({
    mutationFn: deleteDataDictionaryTechStack,
  });
  const activateAllTechStackMutation = useMutation({
    mutationFn: activateAllDataDictionaryTechStack,
  });
  const archiveAllTechStackMutation = useMutation({
    mutationFn: archiveAllDataDictionaryTechStack,
  });
  const deleteAllTechStackMutation = useMutation({
    mutationFn: deleteAllDataDictionaryTechStack,
  });
  const processes = processPageData?.processes ?? emptyProcesses;
  const processTotalCount = processPageData?.pagination.totalCount ?? 0;
  const processTotalPages = processPageData?.pagination.totalPages ?? 0;
  const processLibraryCount = catalogData?.processSummary?.activeCount ?? processTotalCount;
  const tools = techStackData?.tools ?? emptyTechStack;
  const toolTotalCount = techStackData?.pagination.totalCount ?? 0;
  const categoryOptions = useMemo(
    () =>
      processOptions?.categories.length
        ? processOptions.categories
        : processCategories,
    [processOptions],
  );
  const tierOptions = useMemo(
    () =>
      processOptions?.tiers.length
        ? processOptions.tiers
        : processTiers.map((tier) => ({ label: tier.label, value: tier.slug })),
    [processOptions],
  );
  const activeExpandedProcessId =
    expandedProcessId === initialExpandedProcessId ? (processes[0]?.id ?? "") : expandedProcessId;
  const isProcessSaving =
    addDefaultIndustryProcessesMutation.isPending ||
    createIndustryProcessMutation.isPending ||
    createDomainProcessMutation.isPending ||
    updateProcessMutation.isPending;
  const isToolSaving = createTechStackMutation.isPending || updateTechStackMutation.isPending;
  const dictionaryErrorMessage =
    dictionaryError ||
    (catalogQueryError ? getErrorMessage(catalogQueryError) : "") ||
    (processOptionsQueryError ? getErrorMessage(processOptionsQueryError) : "") ||
    (processQueryError ? getErrorMessage(processQueryError) : "") ||
    (techStackQueryError ? getErrorMessage(techStackQueryError) : "");
  const savedDisplayToBaseCurrencyRate =
    savedDisplayToBaseCurrencyRateOverride ??
    processOptions?.currencyConversionRate ??
    defaultDisplayToBaseCurrencyRate;
  const currencyRateValue =
    currencyRateInput ?? formatConversionRateInput(savedDisplayToBaseCurrencyRate);

  const filteredTools = tools;

  useEffect(() => {
    const toastTimeouts = techStackToastTimeoutsRef.current;

    return () => {
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();
    };
  }, []);

  function clearTechStackToastTimeout(toastId: string) {
    const toastTimeout = techStackToastTimeoutsRef.current.get(toastId);

    if (toastTimeout) {
      clearTimeout(toastTimeout);
      techStackToastTimeoutsRef.current.delete(toastId);
    }
  }

  function scheduleTechStackToastDismiss(toastId: string, tone: ReorderToastState["tone"]) {
    clearTechStackToastTimeout(toastId);

    if (tone === "processing") {
      return;
    }

    const toastTimeout = setTimeout(() => {
      setTechStackToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
      techStackToastTimeoutsRef.current.delete(toastId);
    }, dataDictionaryToastDismissMs);

    techStackToastTimeoutsRef.current.set(toastId, toastTimeout);
  }

  function showTechStackToast(
    message: string,
    tone: ReorderToastState["tone"],
    description?: string,
  ) {
    techStackToastIdRef.current += 1;
    const toastId = `tech-stack-toast-${techStackToastIdRef.current}`;

    setTechStackToasts((currentToasts) =>
      [{ description, id: toastId, message, tone }, ...currentToasts].slice(0, 3),
    );
    scheduleTechStackToastDismiss(toastId, tone);
    return toastId;
  }

  function updateTechStackToast(
    toastId: string,
    message: string,
    tone: ReorderToastState["tone"],
    description?: string,
  ) {
    setTechStackToasts((currentToasts) => {
      const nextToast = { description, id: toastId, message, tone };

      if (!currentToasts.some((toast) => toast.id === toastId)) {
        return [nextToast, ...currentToasts].slice(0, 3);
      }

      return currentToasts.map((toast) => (toast.id === toastId ? nextToast : toast));
    });
    scheduleTechStackToastDismiss(toastId, tone);
  }

  function dismissTechStackToast(toastId: string) {
    clearTechStackToastTimeout(toastId);
    setTechStackToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }

  function invalidateCatalogQueries() {
    return queryClient.invalidateQueries({ queryKey: dataDictionaryCatalogQueryKey });
  }

  function invalidateProcessQueries() {
    return queryClient.invalidateQueries({ queryKey: dataDictionaryProcessesQueryKey });
  }

  async function invalidateCatalogAndProcessQueries() {
    await invalidateCatalogQueries();
    await invalidateProcessQueries();
  }

  async function handleAddIndustry() {
    const name = toDisplayName(industryName);
    if (!name) return false;

    const exists = industries.some(
      (industry) => normalizeSearch(industry.name) === normalizeSearch(name),
    );
    if (exists) {
      setIndustryName("");
      return false;
    }

    try {
      setDictionaryError("");
      const savedIndustry = await createIndustryMutation.mutateAsync({ name });
      await invalidateCatalogQueries();

      if (savedIndustry) {
        setDomainIndustryId(savedIndustry.id);
        setMappingIndustryId(savedIndustry.id);
        setProcessForm((current) => ({
          ...current,
          industryId: savedIndustry.id,
        }));
      }
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }

    setIndustryName("");
    return true;
  }

  async function handleAddDefaultIndustries(industryKey?: string) {
    if (addDefaultIndustriesMutation.isPending) {
      return false;
    }

    const toastId = showTechStackToast(
      industryKey ? "Adding default industry..." : "Adding all default industries...",
      "processing",
    );

    try {
      setDictionaryError("");
      const result = await addDefaultIndustriesMutation.mutateAsync(
        industryKey ? { industryKey } : {},
      );
      await invalidateCatalogQueries();

      const details = [
        `${result.createdCount} added`,
        `${result.reactivatedCount} reactivated`,
        `${result.skippedCount} already configured`,
      ].join(", ");
      updateTechStackToast(
        toastId,
        industryKey ? "Default industry is configured" : "Default industries are configured",
        "success",
        details,
      );
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      updateTechStackToast(toastId, message, "error");
      return false;
    }
  }

  async function handleAddDefaultDomains(domainKey?: string) {
    if (addDefaultDomainsMutation.isPending) {
      return false;
    }

    const toastId = showTechStackToast(
      domainKey ? "Adding default domain..." : "Adding all default domains...",
      "processing",
    );

    try {
      setDictionaryError("");
      const result = await addDefaultDomainsMutation.mutateAsync(domainKey ? { domainKey } : {});
      await invalidateCatalogQueries();

      const details = [
        `${result.createdCount} added`,
        `${result.reactivatedCount} reactivated`,
        `${result.skippedCount} already configured`,
      ].join(", ");
      updateTechStackToast(
        toastId,
        domainKey ? "Default domain is configured" : "Default domains are configured",
        "success",
        details,
      );
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      updateTechStackToast(toastId, message, "error");
      return false;
    }
  }

  async function handleAddDomain() {
    const name = toDisplayName(domainName);
    if (!name) return false;

    const selectedIndustryId = mappingIndustryId || domainIndustryId || industries[0]?.id || "";

    try {
      if (!selectedIndustryId) {
        throw new Error("Select an industry before adding a domain");
      }

      setDictionaryError("");
      await createDomainMutation.mutateAsync({
        industryId: selectedIndustryId,
        name,
      });
      await invalidateCatalogQueries();
      setDomainIndustryId(selectedIndustryId);
      setMappingIndustryId(selectedIndustryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }

    setDomainName("");
    return true;
  }

  async function handleRenameDomain(domain: DictionaryDomain, name: string) {
    const domainKey = getDomainIdentity(domain);

    try {
      if (!domainKey) {
        throw new Error("The domain stable key is missing");
      }

      setDictionaryError("");
      const result = await renameDomainMutation.mutateAsync({ domainKey, name });
      await invalidateCatalogAndProcessQueries();
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleMapDomain(domainId: string) {
    const selectedIndustryId = mappingIndustryId || industries[0]?.id || "";

    try {
      if (!selectedIndustryId) {
        throw new Error("Select an industry before mapping a domain");
      }

      if (!domainId) {
        throw new Error("Select a domain to map");
      }

      setDictionaryError("");
      await createProcessLibraryMutation.mutateAsync({
        domainId,
        industryId: selectedIndustryId,
      });
      await invalidateCatalogQueries();
      setDomainIndustryId(selectedIndustryId);
      setMappingIndustryId(selectedIndustryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleMapDomainToIndustry(industryId: string, domainId: string) {
    try {
      if (!industryId) {
        throw new Error("Select an industry before mapping a domain");
      }

      if (!domainId) {
        throw new Error("Select a domain to map");
      }

      setDictionaryError("");
      await createProcessLibraryMutation.mutateAsync({
        domainId,
        industryId,
      });
      await invalidateCatalogQueries();
      setDomainIndustryId(industryId);
      setMappingIndustryId(industryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleDeleteIndustry(industryId: string, force = false) {
    try {
      if (!industryId) {
        throw new Error("Select an industry before deleting it");
      }

      setDictionaryError("");
      await deleteIndustryMutation.mutateAsync({ force, industryId });
      await invalidateCatalogQueries();
      setDomainIndustryId("");
      setMappingIndustryId("");
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleActivateIndustry(industry: DictionaryIndustry) {
    try {
      if (!industry.name) {
        throw new Error("Select an industry before activating it");
      }

      setDictionaryError("");
      const savedIndustry = await activateIndustryMutation.mutateAsync({ name: industry.name });
      await invalidateCatalogQueries();

      if (savedIndustry) {
        setDomainIndustryId(savedIndustry.id);
        setMappingIndustryId(savedIndustry.id);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleDeleteDomain(domainId: string) {
    try {
      if (!domainId) {
        throw new Error("Select a domain before removing it");
      }

      setDictionaryError("");
      await deleteProcessLibraryMutation.mutateAsync(domainId);
      await invalidateCatalogQueries();
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleReorderIndustries(industryIds: string[]) {
    if (industryIds.length === 0) return;

    try {
      setDictionaryError("");
      await reorderIndustriesMutation.mutateAsync({ industryIds });
      await invalidateCatalogQueries();
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
      throw error;
    }
  }

  async function handleReorderDomains(industryId: string, domainIds: string[]) {
    if (!industryId || domainIds.length === 0) return;

    try {
      setDictionaryError("");
      await reorderDomainsMutation.mutateAsync({ domainIds, industryId });
      await invalidateCatalogQueries();
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
      throw error;
    }
  }

  async function handleAddProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProcessSaving) return;

    const name = toDisplayName(processForm.name);
    const industryId = processForm.industryId || industries[0]?.id || "";
    const category = processForm.category.trim();
    const tier = processForm.tier.trim();
    const isUpdatingProcess = Boolean(editingProcess);

    if (!name || !industryId || !category || !tier) return;

    const processPayload = {
      category,
      description:
        processForm.description.trim() || "Newly added process for assessment configuration",
      estimatedAnnualCost: {
        amount: parseAmount(processForm.cost),
        currency: processForm.costCurrency,
      },
      hoursPerYear: parseAmount(processForm.hours),
      name,
      tier,
    };

    try {
      setDictionaryError("");
      let createdProcessId = "";

      if (editingProcess) {
        createdProcessId = await updateProcessMutation.mutateAsync({
          process: editingProcess,
          values: processPayload,
        });
      } else if (processForm.domainId) {
        const selectedDomain = domains.find(
          (domain) => domain.id === processForm.domainId && domain.industryIds.includes(industryId),
        );

        if (!selectedDomain) {
          throw new Error("Select a domain mapped to the selected industry");
        }

        createdProcessId = await createDomainProcessMutation.mutateAsync({
          ...processPayload,
          industryDomainId: selectedDomain.id,
        });
      } else {
        createdProcessId = await createIndustryProcessMutation.mutateAsync({
          ...processPayload,
          industryId,
        });
      }

      await invalidateCatalogAndProcessQueries();
      setExpandedProcessId(createdProcessId);
      setEditingProcess(null);
      setProcessForm(createEmptyProcessForm(industries));
      setIsProcessFormOpen(false);
      if (!isUpdatingProcess) {
        showTechStackToast(`${name} added to Process Library`, "success", "Process Library");
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      showTechStackToast(message, "error");
    }
  }

  async function handlePermanentlyDeleteDomain(domain: DictionaryDomain) {
    try {
      if (!domain.id || domain.isActive !== false) {
        throw new Error("Only inactive domains can be permanently deleted");
      }

      setDictionaryError("");
      await permanentlyDeleteDomainMutation.mutateAsync(domain);
      await invalidateCatalogQueries();
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleActivateDomain(domain: DictionaryDomain) {
    const selectedIndustryId =
      domain.industryIds.find((industryId) =>
        industries.some((industry) => industry.id === industryId),
      ) ||
      mappingIndustryId ||
      domainIndustryId ||
      industries[0]?.id ||
      "";

    try {
      if (!selectedIndustryId) {
        throw new Error("Select an industry before activating a domain");
      }

      setDictionaryError("");
      await createDomainMutation.mutateAsync({
        industryId: selectedIndustryId,
        name: domain.name,
        slug: domain.slug,
      });
      await invalidateCatalogQueries();
      setDomainIndustryId(selectedIndustryId);
      setMappingIndustryId(selectedIndustryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleAddDefaultIndustryProcesses(industryId?: string) {
    if (addDefaultIndustryProcessesMutation.isPending) {
      return false;
    }

    const selectedIndustry = industryId
      ? industries.find((industry) => industry.id === industryId)
      : undefined;
    const isSeedingAllIndustries = !industryId;
    const toastId = showTechStackToast(
      isSeedingAllIndustries
        ? "Adding default processes for all industries..."
        : `Adding default processes for ${selectedIndustry?.name || "industry"}...`,
      "processing",
    );

    try {
      if (industryId && !selectedIndustry) {
        throw new Error("Select an industry before adding default processes");
      }

      setDictionaryError("");
      const result = await addDefaultIndustryProcessesMutation.mutateAsync(
        industryId ? { industryId } : {},
      );
      await invalidateCatalogAndProcessQueries();
      setProcessPage(1);

      const details = [];
      if (result.skippedCount > 0) {
        details.push(
          `${result.skippedCount} existing ${result.skippedCount === 1 ? "process was" : "processes were"} skipped`,
        );
      }
      if (result.unavailableIndustryCount > 0) {
        details.push(
          `${result.unavailableIndustryCount} supported ${
            result.unavailableIndustryCount === 1 ? "industry was" : "industries were"
          } not configured`,
        );
      }
      const description = details.join(" · ") || "Process Library";

      if (result.createdCount > 0) {
        updateTechStackToast(
          toastId,
          isSeedingAllIndustries
            ? `${result.createdCount} industry default ${
                result.createdCount === 1 ? "process" : "processes"
              } added`
            : `${result.createdCount} ${selectedIndustry?.name || "industry"} default ${
                result.createdCount === 1 ? "process" : "processes"
              } added`,
          "success",
          description,
        );
      } else if (result.skippedCount > 0) {
        updateTechStackToast(
          toastId,
          isSeedingAllIndustries
            ? "All configured industry defaults are already up to date"
            : `${selectedIndustry?.name || "Industry"} default processes are already up to date`,
          "success",
          description,
        );
      } else if (isSeedingAllIndustries && result.unavailableIndustryCount > 0) {
        const message = "No supported industries are currently configured for default processes";
        setDictionaryError(message);
        updateTechStackToast(toastId, message, "error", description);
        return false;
      } else if (result.totalCount > 0) {
        const message = `${selectedIndustry?.name || "Industry"} defaults could not be added because the catalog changed. Refresh and retry.`;
        setDictionaryError(message);
        updateTechStackToast(toastId, message, "error", description);
        return false;
      } else {
        const message = `No industry-specific default processes are available for ${selectedIndustry?.name || "the selected industry"}`;
        setDictionaryError(message);
        updateTechStackToast(toastId, message, "error", description);
        return false;
      }

      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      updateTechStackToast(toastId, message, "error");
      return false;
    }
  }

  async function handleAddDefaultIndustryDomainProcesses(industryDomainId?: string) {
    if (addDefaultIndustryDomainProcessesMutation.isPending) {
      return false;
    }

    const selectedMapping = industryDomainId
      ? libraries.find((library) => library.id === industryDomainId)
      : undefined;
    const isSeedingAllMappings = !industryDomainId;
    const mappingLabel = selectedMapping
      ? `${selectedMapping.industryName} — ${selectedMapping.domainName}`
      : "Industry × Domain";
    const toastId = showTechStackToast(
      isSeedingAllMappings
        ? "Adding default processes for all Industry × Domain mappings..."
        : `Adding default processes for ${mappingLabel}...`,
      "processing",
    );

    try {
      if (industryDomainId && !selectedMapping) {
        throw new Error("Select an active Industry × Domain mapping before adding defaults");
      }

      setDictionaryError("");
      const result = await addDefaultIndustryDomainProcessesMutation.mutateAsync(
        industryDomainId ? { industryDomainId } : {},
      );
      await invalidateCatalogAndProcessQueries();
      setProcessPage(1);

      const unavailableCount =
        result.unavailableIndustryDomainCount ?? result.unavailableDomainCount ?? 0;
      const details = [];
      if (result.skippedCount > 0) {
        details.push(
          `${result.skippedCount} existing ${result.skippedCount === 1 ? "process was" : "processes were"} skipped`,
        );
      }
      if (unavailableCount > 0) {
        details.push(
          `${unavailableCount} ${unavailableCount === 1 ? "mapping has" : "mappings have"} no built-in defaults`,
        );
      }
      const description = details.join(" · ") || "Industry × Domain Defaults";

      if (result.createdCount > 0) {
        updateTechStackToast(
          toastId,
          isSeedingAllMappings
            ? `${result.createdCount} Industry × Domain default ${
                result.createdCount === 1 ? "process" : "processes"
              } added`
            : `${result.createdCount} ${mappingLabel} default ${
                result.createdCount === 1 ? "process" : "processes"
              } added`,
          "success",
          description,
        );
      } else if (result.skippedCount > 0) {
        updateTechStackToast(
          toastId,
          isSeedingAllMappings
            ? "All configured Industry × Domain defaults are already up to date"
            : `${mappingLabel} defaults are already up to date`,
          "success",
          description,
        );
      } else if (unavailableCount > 0) {
        const message = isSeedingAllMappings
          ? "No supported active Industry × Domain mappings are configured"
          : `No built-in domain defaults are available for ${mappingLabel}`;
        setDictionaryError(message);
        updateTechStackToast(toastId, message, "error", description);
        return false;
      } else if (result.totalCount > 0) {
        const message = `${mappingLabel} defaults could not be added because the catalog changed. Refresh and retry.`;
        setDictionaryError(message);
        updateTechStackToast(toastId, message, "error", description);
        return false;
      } else {
        const message = `No Industry × Domain default processes are available for ${mappingLabel}`;
        setDictionaryError(message);
        updateTechStackToast(toastId, message, "error", description);
        return false;
      }

      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      updateTechStackToast(toastId, message, "error");
      return false;
    }
  }

  const handleOpenNewProcessForm = useCallback(() => {
    setEditingProcess(null);
    setProcessForm(createEmptyProcessForm(industries));
    setIsProcessFormOpen(true);
  }, [industries]);

  function handleEditProcess(process: DictionaryProcess) {
    setEditingProcess(process);
    setProcessForm(createProcessFormFromProcess(process, industries));
    setIsProcessFormOpen(true);
  }

  async function handleToggleProcessStatus(process: DictionaryProcess) {
    const nextIsActive = process.isActive === false;

    try {
      setDictionaryError("");
      setProcessActionId(process.id);
      await updateProcessStatusMutation.mutateAsync({
        isActive: nextIsActive,
        process,
      });
      queryClient.setQueriesData<DataDictionaryProcessPage>(
        { queryKey: dataDictionaryProcessesQueryKey },
        (currentData) => {
        if (!currentData) {
          return currentData;
        }

        const containsProcess = currentData.processes.some((item) => item.id === process.id);
        const nextTotalCount =
          !nextIsActive && containsProcess
            ? Math.max(0, currentData.pagination.totalCount - 1)
            : currentData.pagination.totalCount;

        return {
          ...currentData,
          pagination: {
            ...currentData.pagination,
            totalCount: nextTotalCount,
            totalPages: Math.ceil(nextTotalCount / currentData.pagination.limit),
          },
          processes: nextIsActive
            ? currentData.processes.map((item) =>
                item.id === process.id ? { ...item, isActive: true } : item,
              )
            : currentData.processes.filter((item) => item.id !== process.id),
        };
        },
      );
      if (!nextIsActive && processes.length === 1 && processPage > 1) {
        setProcessPage(processPage - 1);
      }
      await Promise.all([
        invalidateCatalogQueries(),
        invalidateProcessQueries(),
        queryClient.invalidateQueries({ queryKey: archiveProcessesQueryKey }),
      ]);
      setExpandedProcessId(nextIsActive ? process.id : "");
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    } finally {
      setProcessActionId("");
    }
  }

  function handleDeleteProcess(process: DictionaryProcess) {
    setProcessDeleteTarget(process);
  }

  async function confirmDeleteProcess() {
    const process = processDeleteTarget;

    if (!process || deleteProcessMutation.isPending) {
      return;
    }

    try {
      setDictionaryError("");
      setProcessActionId(process.id);
      await deleteProcessMutation.mutateAsync(process);
      if (processes.length === 1 && processPage > 1) {
        setProcessPage(processPage - 1);
      }
      await Promise.all([
        invalidateCatalogQueries(),
        invalidateProcessQueries(),
        queryClient.invalidateQueries({ queryKey: archiveProcessesQueryKey }),
      ]);
      setExpandedProcessId("");
      setProcessDeleteTarget(null);
      if (editingProcess?.id === process.id) {
        setEditingProcess(null);
        setIsProcessFormOpen(false);
      }
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    } finally {
      setProcessActionId("");
    }
  }

  async function handleAddTool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = toDisplayName(toolForm.name);
    const vendor = toDisplayName(toolForm.vendor);
    const category = toDisplayName(toolForm.category);
    const description = toolForm.description.trim();
    const isUpdatingTool = Boolean(editingTool);
    if (!name || !vendor || !category) return;

    try {
      setDictionaryError("");
      const benchmarkPricing = createToolBenchmarkPricingPayload(toolForm);

      if (editingTool) {
        setToolActionId(editingTool.id);
        await updateTechStackMutation.mutateAsync({
          tool: editingTool,
          values: {
            benchmarkPricing,
            category,
            description,
            name,
            vendor,
          },
        });
        setEditingTool(null);
        setToolActionId("");
      } else {
        await createTechStackMutation.mutateAsync({
          benchmarkPricing,
          category,
          description,
          name,
          vendor,
        });
      }

      await queryClient.invalidateQueries({ queryKey: techStackQueryKey });
      setToolForm(emptyToolForm);
      setIsToolFormOpen(false);
      showTechStackToast(
        isUpdatingTool
          ? `${name} updated in Technology Stack Library`
          : `${name} added to Technology Stack Library`,
        "success",
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      showTechStackToast(message, "error");
      setToolActionId("");
    }
  }

  const handleOpenNewToolForm = useCallback(() => {
    setEditingTool(null);
    setToolForm(emptyToolForm);
    setIsToolFormOpen(true);
  }, []);

  const handleCloseToolForm = useCallback(() => {
    setEditingTool(null);
    setToolForm(emptyToolForm);
    setIsToolFormOpen(false);
  }, []);

  function handleEditTool(tool: TechStackTool) {
    setEditingTool(tool);
    setToolForm(createToolFormFromTool(tool));
    setIsToolFormOpen(true);
  }

  async function handleToggleToolStatus(tool: TechStackTool) {
    if (updateTechStackStatusMutation.isPending) {
      return;
    }

    const nextIsActive = tool.isActive === false;

    try {
      setDictionaryError("");
      setToolActionId(tool.id);
      await updateTechStackStatusMutation.mutateAsync({
        isActive: nextIsActive,
        tool,
      });
      await queryClient.invalidateQueries({ queryKey: techStackQueryKey });
      if (!nextIsActive && editingTool?.id === tool.id) {
        handleCloseToolForm();
      }
      showTechStackToast(
        `${tool.name} ${nextIsActive ? "activated" : "deactivated"} in Technology Stack Library`,
        "success",
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      showTechStackToast(message, "error");
    } finally {
      setToolActionId("");
    }
  }

  function handleDeleteTool(tool: TechStackTool) {
    setToolDeleteTarget(tool);
  }

  async function confirmDeleteTool() {
    const tool = toolDeleteTarget;

    if (!tool || deleteTechStackMutation.isPending) {
      return;
    }

    try {
      setDictionaryError("");
      setToolActionId(tool.id);
      await deleteTechStackMutation.mutateAsync(tool.id);
      if (tools.length === 1 && toolPage > 1) {
        setToolPage(toolPage - 1);
      }
      await queryClient.invalidateQueries({ queryKey: techStackQueryKey });
      setToolDeleteTarget(null);
      if (editingTool?.id === tool.id) {
        handleCloseToolForm();
      }
      showTechStackToast(`${tool.name} deleted from Technology Stack Library`, "success");
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      showTechStackToast(message, "error");
    } finally {
      setToolActionId("");
    }
  }

  function handleDeleteAllTools() {
    if (
      toolTotalCount === 0 ||
      activateAllTechStackMutation.isPending ||
      archiveAllTechStackMutation.isPending ||
      deleteAllTechStackMutation.isPending
    ) {
      return;
    }

    setIsDeleteAllToolsOpen(true);
  }

  function handleActivateAllTools() {
    if (
      toolTotalCount === 0 ||
      activateAllTechStackMutation.isPending ||
      archiveAllTechStackMutation.isPending ||
      deleteAllTechStackMutation.isPending
    ) {
      return;
    }

    setIsActivateAllToolsOpen(true);
  }

  async function confirmActivateAllTools() {
    if (
      toolTotalCount === 0 ||
      activateAllTechStackMutation.isPending ||
      archiveAllTechStackMutation.isPending ||
      deleteAllTechStackMutation.isPending
    ) {
      return;
    }

    try {
      setDictionaryError("");
      const { activatedCount, skippedCount } = await activateAllTechStackMutation.mutateAsync();
      setIsActivateAllToolsOpen(false);
      setToolPage(1);
      await queryClient.invalidateQueries({ queryKey: techStackQueryKey });
      setToolDeleteTarget(null);
      handleCloseToolForm();

      const message =
        activatedCount > 0
          ? `${activatedCount} ${activatedCount === 1 ? "tool" : "tools"} activated in Technology Stack Library`
          : skippedCount > 0
            ? "Duplicate archived tools remain inactive"
            : "All technology tools are already active";
      const description =
        skippedCount > 0
          ? `${skippedCount} duplicate ${skippedCount === 1 ? "tool was" : "tools were"} left archived`
          : undefined;
      showTechStackToast(message, "success", description);
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      showTechStackToast(message, "error");
    }
  }

  function handleArchiveAllTools() {
    if (
      toolTotalCount === 0 ||
      activateAllTechStackMutation.isPending ||
      archiveAllTechStackMutation.isPending ||
      deleteAllTechStackMutation.isPending
    ) {
      return;
    }

    setIsArchiveAllToolsOpen(true);
  }

  async function confirmArchiveAllTools() {
    if (
      toolTotalCount === 0 ||
      activateAllTechStackMutation.isPending ||
      archiveAllTechStackMutation.isPending ||
      deleteAllTechStackMutation.isPending
    ) {
      return;
    }

    try {
      setDictionaryError("");
      const archivedToolCount = await archiveAllTechStackMutation.mutateAsync();
      setIsArchiveAllToolsOpen(false);
      setToolPage(1);
      await queryClient.invalidateQueries({ queryKey: techStackQueryKey });
      setToolDeleteTarget(null);
      handleCloseToolForm();
      showTechStackToast(
        archivedToolCount > 0
          ? `${archivedToolCount} ${archivedToolCount === 1 ? "tool" : "tools"} archived in Technology Stack Library`
          : "All technology tools are already archived",
        "success",
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      showTechStackToast(message, "error");
    }
  }

  async function confirmDeleteAllTools() {
    if (
      toolTotalCount === 0 ||
      activateAllTechStackMutation.isPending ||
      archiveAllTechStackMutation.isPending ||
      deleteAllTechStackMutation.isPending
    ) {
      return;
    }

    try {
      setDictionaryError("");
      const deletedToolCount = await deleteAllTechStackMutation.mutateAsync();
      setIsDeleteAllToolsOpen(false);
      setToolPage(1);
      await queryClient.invalidateQueries({ queryKey: techStackQueryKey });
      setToolDeleteTarget(null);
      handleCloseToolForm();
      showTechStackToast(
        `${deletedToolCount} ${
          deletedToolCount === 1 ? "tool" : "tools"
        } deleted from Technology Stack Library`,
        "success",
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setDictionaryError(message);
      showTechStackToast(message, "error");
    }
  }

  async function handleSaveCurrencyRate() {
    const nextRate = getDisplayToBaseCurrencyRate(currencyRateValue);

    try {
      setDictionaryError("");
      const savedRate = await updateCurrencyConversionRateMutation.mutateAsync(nextRate);
      setSavedDisplayToBaseCurrencyRateOverride(savedRate);
      setCurrencyRateInput(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dataDictionaryOptionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
        queryClient.invalidateQueries({ queryKey: assessmentsQueryKey }),
      ]);
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    }
  }

  const handleProcessDomainFilterChange = useCallback((value: string) => {
    setProcessPage(1);
    setProcessDomainFilter(value);
  }, []);
  const handleProcessIndustryFilterChange = useCallback((value: string) => {
    setProcessPage(1);
    setProcessIndustryFilter(value);
  }, []);
  const handleProcessSearchChange = useCallback((value: string) => {
    setProcessPage(1);
    setProcessSearch(value);
  }, []);
  const handleToolSearchChange = useCallback((value: string) => {
    setToolPage(1);
    setToolSearch(value);
  }, []);
  const handleIndustryDomainVisible = useCallback(() => {
    setIsIndustryDomainReady(true);
  }, []);
  const handleProcessLibraryVisible = useCallback(() => {
    setIsProcessLibraryReady(true);
  }, []);
  const handleTechnologyStackVisible = useCallback(() => {
    setIsTechnologyStackReady(true);
  }, []);

  return (
    <AdminShell activeItem="Data Dictionary">
      <div className="max-w-full overflow-hidden lg:pr-6">
        <DataDictionaryPageHeader />
        <section className="mt-7 grid gap-5 md:grid-cols-2" aria-label="Reference scales">
          <AutomationLevelsCard />
          <ProcessTiersCard />
        </section>
        <BenchmarkCard />
        <LazyViewportSection minHeight={414} onVisible={handleIndustryDomainVisible}>
          <IndustryDomainManager
            domainName={domainName}
            domains={domains}
            inactiveDomains={inactiveDomains}
            industryName={industryName}
            industries={industries}
            isCatalogLoading={isCatalogLoading}
            isDomainSaving={createDomainMutation.isPending || addDefaultDomainsMutation.isPending}
            isDeletingDomain={deleteProcessLibraryMutation.isPending}
            isPermanentlyDeletingDomain={permanentlyDeleteDomainMutation.isPending}
            isDeletingIndustry={deleteIndustryMutation.isPending}
            isDefaultDomainsSaving={addDefaultDomainsMutation.isPending}
            isDefaultIndustriesSaving={addDefaultIndustriesMutation.isPending}
            isIndustrySaving={
              createIndustryMutation.isPending ||
              activateIndustryMutation.isPending ||
              addDefaultIndustriesMutation.isPending
            }
            isMappingDomain={createProcessLibraryMutation.isPending}
            isRenamingDomain={renameDomainMutation.isPending}
            libraries={libraries}
            inactiveIndustries={inactiveIndustries}
            mappingIndustryId={mappingIndustryId}
            setDomainIndustryId={setDomainIndustryId}
            setDomainName={setDomainName}
            setIndustryName={setIndustryName}
            setMappingIndustryId={setMappingIndustryId}
            onAddDomain={handleAddDomain}
            onAddIndustry={handleAddIndustry}
            onActivateDomain={handleActivateDomain}
            onActivateIndustry={handleActivateIndustry}
            onDeleteDomain={handleDeleteDomain}
            onPermanentlyDeleteDomain={handlePermanentlyDeleteDomain}
            onDeleteIndustry={handleDeleteIndustry}
            onSeedDefaultDomains={handleAddDefaultDomains}
            onSeedDefaultIndustries={handleAddDefaultIndustries}
            onMapDomain={handleMapDomain}
            onMapDomainToIndustry={handleMapDomainToIndustry}
            onRenameDomain={handleRenameDomain}
            onReorderDomains={handleReorderDomains}
            onReorderIndustries={handleReorderIndustries}
          />
        </LazyViewportSection>
        <LazyViewportSection minHeight={758} onVisible={handleProcessLibraryVisible}>
          <ProcessLibraryCard
            domains={domains}
            dictionaryError={dictionaryErrorMessage}
            expandedProcessId={activeExpandedProcessId}
            filteredProcesses={processes}
            industries={industries}
            isCatalogLoading={
              isCatalogLoading || isProcessOptionsLoading || isProcessLoading
            }
            isDefaultDomainProcessesSaving={addDefaultIndustryDomainProcessesMutation.isPending}
            isDefaultProcessesSaving={addDefaultIndustryProcessesMutation.isPending}
            isProcessSaving={isProcessSaving}
            isProcessFormOpen={isProcessFormOpen}
            categoryOptions={categoryOptions}
            tierOptions={tierOptions}
            editingProcess={editingProcess}
            processDomainFilter={processDomainFilter}
            processForm={processForm}
            processActionId={processActionId}
            processIndustryFilter={processIndustryFilter}
            processLibraryCount={processLibraryCount}
            processPage={processPage}
            processTotalCount={processTotalCount}
            processTotalPages={processTotalPages}
            processSearch={processSearch}
            libraries={libraries}
            setExpandedProcessId={setExpandedProcessId}
            setIsProcessFormOpen={setIsProcessFormOpen}
            setProcessDomainFilter={handleProcessDomainFilterChange}
            setProcessForm={setProcessForm}
            setProcessIndustryFilter={handleProcessIndustryFilterChange}
            setProcessPage={setProcessPage}
            setProcessSearch={handleProcessSearchChange}
            onAddProcess={handleAddProcess}
            onAddDefaultDomainProcesses={handleAddDefaultIndustryDomainProcesses}
            onAddDefaultProcesses={handleAddDefaultIndustryProcesses}
            currencyRateInput={currencyRateValue}
            isCurrencyRateSaving={updateCurrencyConversionRateMutation.isPending}
            savedDisplayToBaseCurrencyRate={savedDisplayToBaseCurrencyRate}
            setCurrencyRateInput={setCurrencyRateInput}
            onSaveCurrencyRate={handleSaveCurrencyRate}
            onDeleteProcess={handleDeleteProcess}
            onEditProcess={handleEditProcess}
            onOpenNewProcessForm={handleOpenNewProcessForm}
            onToggleProcessStatus={handleToggleProcessStatus}
          />
        </LazyViewportSection>
        <LazyViewportSection minHeight={535} onVisible={handleTechnologyStackVisible}>
          <TechnologyStackCard
            filteredTools={filteredTools}
            isActivatingAllTools={activateAllTechStackMutation.isPending}
            isArchivingAllTools={archiveAllTechStackMutation.isPending}
            isCatalogLoading={isTechStackLoading}
            isToolDeleting={
              deleteTechStackMutation.isPending ||
              activateAllTechStackMutation.isPending ||
              archiveAllTechStackMutation.isPending ||
              deleteAllTechStackMutation.isPending
            }
            isDeletingAllTools={deleteAllTechStackMutation.isPending}
            isToolFormOpen={isToolFormOpen}
            isToolSaving={isToolSaving}
            isToolStatusSaving={updateTechStackStatusMutation.isPending}
            setToolForm={setToolForm}
            setToolPage={setToolPage}
            setToolSearch={handleToolSearchChange}
            toolForm={toolForm}
            toolActionId={toolActionId}
            toolPage={toolPage}
            toolSearch={toolSearch}
            toolTotalCount={toolTotalCount}
            editingTool={editingTool}
            onAddTool={handleAddTool}
            onActivateAllTools={handleActivateAllTools}
            onArchiveAllTools={handleArchiveAllTools}
            onCloseToolForm={handleCloseToolForm}
            onDeleteAllTools={handleDeleteAllTools}
            onDeleteTool={handleDeleteTool}
            onEditTool={handleEditTool}
            onOpenNewToolForm={handleOpenNewToolForm}
            onToggleToolStatus={handleToggleToolStatus}
          />
        </LazyViewportSection>
        {processDeleteTarget ? (
          <DeleteProcessConfirmationModal
            isDeleting={
              deleteProcessMutation.isPending && processActionId === processDeleteTarget.id
            }
            process={processDeleteTarget}
            onCancel={() => {
              if (!deleteProcessMutation.isPending) {
                setProcessDeleteTarget(null);
              }
            }}
            onConfirm={() => {
              void confirmDeleteProcess();
            }}
          />
        ) : null}
        {toolDeleteTarget ? (
          <DeleteToolConfirmationModal
            isDeleting={deleteTechStackMutation.isPending && toolActionId === toolDeleteTarget.id}
            tool={toolDeleteTarget}
            onCancel={() => {
              if (!deleteTechStackMutation.isPending) {
                setToolDeleteTarget(null);
              }
            }}
            onConfirm={() => {
              void confirmDeleteTool();
            }}
          />
        ) : null}
        {isDeleteAllToolsOpen ? (
          <DeleteAllToolsConfirmationModal
            isDeleting={deleteAllTechStackMutation.isPending}
            toolCount={toolTotalCount}
            onCancel={() => {
              if (!deleteAllTechStackMutation.isPending) {
                setIsDeleteAllToolsOpen(false);
              }
            }}
            onConfirm={() => {
              void confirmDeleteAllTools();
            }}
          />
        ) : null}
        {isActivateAllToolsOpen ? (
          <ActivateAllToolsConfirmationModal
            isActivating={activateAllTechStackMutation.isPending}
            onCancel={() => {
              if (!activateAllTechStackMutation.isPending) {
                setIsActivateAllToolsOpen(false);
              }
            }}
            onConfirm={() => {
              void confirmActivateAllTools();
            }}
          />
        ) : null}
        {isArchiveAllToolsOpen ? (
          <ArchiveAllToolsConfirmationModal
            isArchiving={archiveAllTechStackMutation.isPending}
            toolCount={toolTotalCount}
            onCancel={() => {
              if (!archiveAllTechStackMutation.isPending) {
                setIsArchiveAllToolsOpen(false);
              }
            }}
            onConfirm={() => {
              void confirmArchiveAllTools();
            }}
          />
        ) : null}
        <ReorderToastStack
          ariaLabel="Data dictionary notifications"
          onDismiss={dismissTechStackToast}
          successDescription="Technology Stack Library"
          toasts={techStackToasts}
        />
      </div>
    </AdminShell>
  );
}
