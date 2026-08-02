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
  DeleteAllToolsConfirmationModalProps,
  DeleteProcessConfirmationModalProps,
  DeleteToolConfirmationModalProps,
} from "./confirmation-modals";
import type { ProcessFormState } from "./new-process-modal";
import type { ToolFormState } from "./tech-stack-tool-modal";
import {
  createDataDictionaryDomain,
  createDataDictionaryDomainProcess,
  createDataDictionaryIndustry,
  createDataDictionaryIndustryProcess,
  createDataDictionaryProcessLibrary,
  createDataDictionaryTechStack,
  deleteDataDictionaryProcess,
  deleteDataDictionaryIndustry,
  deleteDataDictionaryProcessLibrary,
  deleteAllDataDictionaryTechStack,
  deleteDataDictionaryTechStack,
  reorderDataDictionaryDomains,
  reorderDataDictionaryIndustries,
  updateDataDictionaryCurrencyConversionRate,
  updateDataDictionaryTechStack,
  updateDataDictionaryProcess,
  updateDataDictionaryProcessStatus,
} from "@/features/data-dictionary/api";
import {
  archiveProcessesQueryKey,
  dataDictionaryQueryKey,
  techStackQueryKey,
  useDataDictionary,
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
  normalizeSearch,
  toDisplayName,
} from "@/features/data-dictionary/utils/domain-mapping";
import {
  createDictionaryProcessListRows,
  createDomainIdentityById,
  filterDictionaryProcessRows,
  getSelectedProcessDomainFilterKey,
  type DictionaryProcessFilters,
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
const technologyStackLibraryPageSize = 20;
const emptyIndustries: DictionaryIndustry[] = [];
const emptyDomains: DictionaryDomain[] = [];
const emptyLibraries: DictionaryLibrary[] = [];
const emptyProcesses: DictionaryProcess[] = [];
const emptyTechStack: TechStackTool[] = [];
const DeleteProcessConfirmationModal = dynamic<DeleteProcessConfirmationModalProps>(
  () =>
    import("./confirmation-modals").then(
      (module) => module.DeleteProcessConfirmationModal,
    ),
  { ssr: false },
);
const DeleteToolConfirmationModal = dynamic<DeleteToolConfirmationModalProps>(
  () =>
    import("./confirmation-modals").then(
      (module) => module.DeleteToolConfirmationModal,
    ),
  { ssr: false },
);
const DeleteAllToolsConfirmationModal = dynamic<DeleteAllToolsConfirmationModalProps>(
  () =>
    import("./confirmation-modals").then(
      (module) => module.DeleteAllToolsConfirmationModal,
    ),
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
  const [toolScopeFilter, setToolScopeFilter] = useState("all");
  const [toolPage, setToolPage] = useState(1);
  const [processForm, setProcessForm] = useState<ProcessFormState>(() =>
    createEmptyProcessForm([]),
  );
  const [editingProcess, setEditingProcess] = useState<DictionaryProcess | null>(null);
  const [processActionId, setProcessActionId] = useState("");
  const [processDeleteTarget, setProcessDeleteTarget] = useState<DictionaryProcess | null>(null);
  const [currencyRateInput, setCurrencyRateInput] = useState<string | null>(null);
  const [savedDisplayToBaseCurrencyRateOverride, setSavedDisplayToBaseCurrencyRateOverride] = useState<number | null>(null);
  const [toolForm, setToolForm] = useState<ToolFormState>(emptyToolForm);
  const [toolActionId, setToolActionId] = useState("");
  const [editingTool, setEditingTool] = useState<TechStackTool | null>(null);
  const [toolDeleteTarget, setToolDeleteTarget] = useState<TechStackTool | null>(null);
  const [isDeleteAllToolsOpen, setIsDeleteAllToolsOpen] = useState(false);
  const [isTechnologyStackReady, setIsTechnologyStackReady] = useState(false);
  const [techStackToasts, setTechStackToasts] = useState<ReorderToastState[]>([]);
  const [expandedProcessId, setExpandedProcessId] = useState(initialExpandedProcessId);
  const [dictionaryError, setDictionaryError] = useState("");
  const techStackToastIdRef = useRef(0);
  const techStackToastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const {
    data: dictionaryData,
    error: dictionaryQueryError,
    isLoading: isCatalogLoading,
  } = useDataDictionary();
  const {
    data: techStackData,
    error: techStackQueryError,
    isLoading: isTechStackLoading,
  } = useMappedTechStackPage({
    catalog: dictionaryData,
    enabled: Boolean(dictionaryData && isTechnologyStackReady),
    limit: technologyStackLibraryPageSize,
    page: toolPage,
    search: toolSearch,
    scopeFilter: toolScopeFilter,
  });
  const createIndustryMutation = useMutation({
    mutationFn: createDataDictionaryIndustry,
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
  const createProcessLibraryMutation = useMutation({
    mutationFn: createDataDictionaryProcessLibrary,
  });
  const deleteProcessLibraryMutation = useMutation({
    mutationFn: deleteDataDictionaryProcessLibrary,
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
  const deleteTechStackMutation = useMutation({
    mutationFn: deleteDataDictionaryTechStack,
  });
  const deleteAllTechStackMutation = useMutation({
    mutationFn: deleteAllDataDictionaryTechStack,
  });
  const industries = dictionaryData?.industries ?? emptyIndustries;
  const domains = dictionaryData?.domains ?? emptyDomains;
  const libraries = dictionaryData?.libraries ?? emptyLibraries;
  const inactiveIndustries = dictionaryData?.inactiveIndustries ?? emptyIndustries;
  const processes = dictionaryData?.processes ?? emptyProcesses;
  const tools = techStackData?.tools ?? emptyTechStack;
  const toolTotalCount = techStackData?.pagination.totalCount ?? 0;
  const categoryOptions = useMemo(
    () =>
      dictionaryData?.options.categories.length
        ? dictionaryData.options.categories
        : processCategories,
    [dictionaryData],
  );
  const tierOptions = useMemo(
    () =>
      dictionaryData?.options.tiers.length
        ? dictionaryData.options.tiers
        : processTiers.map((tier) => ({ label: tier.label, value: tier.slug })),
    [dictionaryData],
  );
  const activeExpandedProcessId =
    expandedProcessId === initialExpandedProcessId ? processes[0]?.id ?? "" : expandedProcessId;
  const isProcessSaving =
    createIndustryProcessMutation.isPending ||
    createDomainProcessMutation.isPending ||
    updateProcessMutation.isPending;
  const isToolSaving = createTechStackMutation.isPending || updateTechStackMutation.isPending;
  const dictionaryErrorMessage =
    dictionaryError ||
    (dictionaryQueryError ? getErrorMessage(dictionaryQueryError) : "") ||
    (techStackQueryError ? getErrorMessage(techStackQueryError) : "");
  const savedDisplayToBaseCurrencyRate =
    savedDisplayToBaseCurrencyRateOverride ?? dictionaryData?.options.currencyConversionRate ?? defaultDisplayToBaseCurrencyRate;
  const currencyRateValue = currencyRateInput ?? formatConversionRateInput(savedDisplayToBaseCurrencyRate);
  const domainIdentityById = useMemo(
    () => createDomainIdentityById(domains, libraries),
    [domains, libraries],
  );
  const selectedProcessDomainFilterKey = useMemo(
    () => getSelectedProcessDomainFilterKey(processDomainFilter, domainIdentityById),
    [domainIdentityById, processDomainFilter],
  );
  const processListRows = useMemo(
    () => createDictionaryProcessListRows(processes, domainIdentityById),
    [domainIdentityById, processes],
  );
  const processFilters = useMemo<DictionaryProcessFilters>(
    () => ({
      domainFilter: processDomainFilter,
      industryFilter: processIndustryFilter,
      search: processSearch,
    }),
    [processDomainFilter, processIndustryFilter, processSearch],
  );
  const filteredProcesses = useMemo(
    () =>
      filterDictionaryProcessRows(
        processListRows,
        processFilters,
        selectedProcessDomainFilterKey,
      ),
    [processFilters, processListRows, selectedProcessDomainFilterKey],
  );

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
      setTechStackToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== toastId),
      );
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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
        queryClient.invalidateQueries({ queryKey: techStackQueryKey }),
      ]);
      setDomainIndustryId(selectedIndustryId);
      setMappingIndustryId(selectedIndustryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }

    setDomainName("");
    return true;
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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });

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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
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
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
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
          (domain) =>
            domain.id === processForm.domainId && domain.industryIds.includes(industryId),
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

      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
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
      queryClient.setQueryData(dataDictionaryQueryKey, (currentData: typeof dictionaryData) => {
        if (!currentData) {
          return currentData;
        }

        return {
          ...currentData,
          processes: nextIsActive
            ? currentData.processes.map((item) =>
                item.id === process.id ? { ...item, isActive: true } : item,
              )
            : currentData.processes.filter((item) => item.id !== process.id),
        };
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
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
          name,
          scope: "common",
          vendor,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
        queryClient.invalidateQueries({ queryKey: techStackQueryKey }),
      ]);
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
    setToolForm(createToolFormFromTool(tool, industries));
    setIsToolFormOpen(true);
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
    if (toolTotalCount === 0 || deleteAllTechStackMutation.isPending) {
      return;
    }

    setIsDeleteAllToolsOpen(true);
  }

  async function confirmDeleteAllTools() {
    if (toolTotalCount === 0 || deleteAllTechStackMutation.isPending) {
      return;
    }

    const deletedToolCount = toolTotalCount;

    try {
      setDictionaryError("");
      await deleteAllTechStackMutation.mutateAsync();
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
        queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey }),
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
  const handleToolScopeFilterChange = useCallback((value: string) => {
    setToolPage(1);
    setToolScopeFilter(value);
  }, []);
  const handleToolSearchChange = useCallback((value: string) => {
    setToolPage(1);
    setToolSearch(value);
  }, []);
  const handleTechnologyStackVisible = useCallback(() => {
    setIsTechnologyStackReady(true);
  }, []);

  return (
    <AdminShell activeItem="Data Dictionary">
      <div className="max-w-full overflow-hidden lg:pr-6">
        <DataDictionaryPageHeader />
        <section className="mt-7 grid gap-5 xl:grid-cols-2" aria-label="Reference scales">
          <AutomationLevelsCard />
          <ProcessTiersCard />
        </section>
        <BenchmarkCard />
        <LazyViewportSection minHeight={414}>
          <IndustryDomainManager
            domainName={domainName}
            domains={domains}
            industryName={industryName}
            industries={industries}
            isCatalogLoading={isCatalogLoading}
            isDomainSaving={createDomainMutation.isPending}
            isDeletingDomain={deleteProcessLibraryMutation.isPending}
            isDeletingIndustry={deleteIndustryMutation.isPending}
            isIndustrySaving={createIndustryMutation.isPending || activateIndustryMutation.isPending}
            isMappingDomain={createProcessLibraryMutation.isPending}
            libraries={libraries}
            inactiveIndustries={inactiveIndustries}
            mappingIndustryId={mappingIndustryId}
            processes={processes}
            setDomainIndustryId={setDomainIndustryId}
            setDomainName={setDomainName}
            setIndustryName={setIndustryName}
            setMappingIndustryId={setMappingIndustryId}
            onAddDomain={handleAddDomain}
            onAddIndustry={handleAddIndustry}
            onActivateIndustry={handleActivateIndustry}
            onDeleteDomain={handleDeleteDomain}
            onDeleteIndustry={handleDeleteIndustry}
            onMapDomain={handleMapDomain}
            onMapDomainToIndustry={handleMapDomainToIndustry}
            onReorderDomains={handleReorderDomains}
            onReorderIndustries={handleReorderIndustries}
          />
        </LazyViewportSection>
        <LazyViewportSection minHeight={758}>
          <ProcessLibraryCard
            domains={domains}
            dictionaryError={dictionaryErrorMessage}
            expandedProcessId={activeExpandedProcessId}
            filteredProcesses={filteredProcesses}
            industries={industries}
            isCatalogLoading={isCatalogLoading}
            isProcessSaving={isProcessSaving}
            isProcessFormOpen={isProcessFormOpen}
            categoryOptions={categoryOptions}
            tierOptions={tierOptions}
            editingProcess={editingProcess}
            processDomainFilter={processDomainFilter}
            processForm={processForm}
            processActionId={processActionId}
            processIndustryFilter={processIndustryFilter}
            processPage={processPage}
            processSearch={processSearch}
            processes={processes}
            setExpandedProcessId={setExpandedProcessId}
            setIsProcessFormOpen={setIsProcessFormOpen}
            setProcessDomainFilter={handleProcessDomainFilterChange}
            setProcessForm={setProcessForm}
            setProcessIndustryFilter={handleProcessIndustryFilterChange}
            setProcessPage={setProcessPage}
            setProcessSearch={handleProcessSearchChange}
            onAddProcess={handleAddProcess}
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
        <LazyViewportSection
          minHeight={535}
          onVisible={handleTechnologyStackVisible}
        >
          <TechnologyStackCard
            domains={domains}
            filteredTools={filteredTools}
            industries={industries}
            isCatalogLoading={isCatalogLoading || isTechStackLoading}
            isToolDeleting={deleteTechStackMutation.isPending || deleteAllTechStackMutation.isPending}
            isDeletingAllTools={deleteAllTechStackMutation.isPending}
            isToolFormOpen={isToolFormOpen}
            isToolSaving={isToolSaving}
            setToolForm={setToolForm}
            setToolPage={setToolPage}
            setToolScopeFilter={handleToolScopeFilterChange}
            setToolSearch={handleToolSearchChange}
            toolForm={toolForm}
            toolActionId={toolActionId}
            toolPage={toolPage}
            toolScopeFilter={toolScopeFilter}
            toolSearch={toolSearch}
            toolTotalCount={toolTotalCount}
            editingTool={editingTool}
            onAddTool={handleAddTool}
            onCloseToolForm={handleCloseToolForm}
            onDeleteAllTools={handleDeleteAllTools}
            onDeleteTool={handleDeleteTool}
            onEditTool={handleEditTool}
            onOpenNewToolForm={handleOpenNewToolForm}
          />
        </LazyViewportSection>
        {processDeleteTarget ? (
          <DeleteProcessConfirmationModal
            isDeleting={deleteProcessMutation.isPending && processActionId === processDeleteTarget.id}
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
        <ReorderToastStack
          ariaLabel="Data dictionary notifications"
          successDescription="Technology Stack Library"
          toasts={techStackToasts}
        />
      </div>
    </AdminShell>
  );
}
