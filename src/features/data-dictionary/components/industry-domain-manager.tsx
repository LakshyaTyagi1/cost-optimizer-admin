"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  Check,
  ChevronDown,
  Database,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Trash2,
  X,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state/empty-state";
import {
  ReorderToastStack,
  type ReorderToastState,
} from "@/features/data-dictionary/components/reorder-toast-stack";
import { SearchInput } from "@/features/data-dictionary/components/search-input";
import type {
  DictionaryDomain,
  DictionaryIndustry,
  DictionaryLibrary,
} from "@/features/data-dictionary/model";
import type { DomainDisplayNameUpdateResult } from "@/features/data-dictionary/api";
import type { DomainDisplayNameModalProps } from "@/features/data-dictionary/components/domain-display-name-modal";
import {
  getDomainCountByIndustry,
  getDomainDisplayTitle,
  getDomainIdentity,
  getIndustryUsageByDomainKey,
  getMappedDomainsForIndustry,
  getRelationCellKey,
  getUniqueDomains,
  normalizeSearch,
  orderItemsByDisplayOrder,
  orderItemsByKey,
  reorderItemKeys,
  toDisplayName,
  type MappedDictionaryDomain,
} from "@/features/data-dictionary/utils/domain-mapping";
import { getErrorMessage } from "@/features/data-dictionary/utils/error";
import type { DefaultIndustriesWorkspaceProps } from "@/features/data-dictionary/components/default-industries-workspace";
import type { DefaultDomainsWorkspaceProps } from "@/features/data-dictionary/components/default-domains-workspace";

const dataDictionaryToastDismissMs = 8000;

const mappingColumnStyle = {
  contain: "layout paint style",
  containIntrinsicSize: "320px",
  contentVisibility: "auto",
} satisfies CSSProperties;
const mappingGridClassName =
  "grid min-h-[320px] items-start gap-4 xl:grid-cols-[350px_minmax(0,1fr)_320px]";
const mappingPanelClassName =
  "relative flex h-[320px] min-h-[320px] flex-col overflow-hidden rounded-md border border-black/[0.06] bg-white p-4";
const DefaultIndustriesWorkspace = dynamic<DefaultIndustriesWorkspaceProps>(
  () =>
    import("@/features/data-dictionary/components/default-industries-workspace").then(
      (module) => module.DefaultIndustriesWorkspace,
    ),
  { ssr: false },
);
const DefaultDomainsWorkspace = dynamic<DefaultDomainsWorkspaceProps>(
  () =>
    import("@/features/data-dictionary/components/default-domains-workspace").then(
      (module) => module.DefaultDomainsWorkspace,
    ),
  { ssr: false },
);
const DomainDisplayNameModal = dynamic<DomainDisplayNameModalProps>(
  () =>
    import("@/features/data-dictionary/components/domain-display-name-modal").then(
      (module) => module.DomainDisplayNameModal,
    ),
  { ssr: false },
);

export function IndustryDomainManager({
  domainName,
  domains,
  inactiveDomains,
  industries,
  industryName,
  isCatalogLoading,
  inactiveIndustries,
  isDomainSaving,
  isDeletingDomain,
  isPermanentlyDeletingDomain,
  isDeletingIndustry,
  isDefaultDomainsSaving,
  isDefaultIndustriesSaving,
  isIndustrySaving,
  isMappingDomain,
  isRenamingDomain,
  libraries,
  mappingIndustryId,
  setDomainIndustryId,
  setDomainName,
  setIndustryName,
  setMappingIndustryId,
  onAddDomain,
  onAddIndustry,
  onActivateDomain,
  onActivateIndustry,
  onDeleteDomain,
  onPermanentlyDeleteDomain,
  onDeleteIndustry,
  onSeedDefaultDomains,
  onSeedDefaultIndustries,
  onMapDomain,
  onMapDomainToIndustry,
  onRenameDomain,
  onReorderDomains,
  onReorderIndustries,
}: {
  domainName: string;
  domains: DictionaryDomain[];
  inactiveDomains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  industryName: string;
  inactiveIndustries: DictionaryIndustry[];
  isCatalogLoading: boolean;
  isDomainSaving: boolean;
  isDeletingDomain: boolean;
  isPermanentlyDeletingDomain: boolean;
  isDeletingIndustry: boolean;
  isDefaultDomainsSaving: boolean;
  isDefaultIndustriesSaving: boolean;
  isIndustrySaving: boolean;
  isMappingDomain: boolean;
  isRenamingDomain: boolean;
  libraries: DictionaryLibrary[];
  mappingIndustryId: string;
  setDomainIndustryId: (value: string) => void;
  setDomainName: (value: string) => void;
  setIndustryName: (value: string) => void;
  setMappingIndustryId: (value: string) => void;
  onAddDomain: () => Promise<boolean>;
  onAddIndustry: () => Promise<boolean>;
  onActivateDomain: (domain: DictionaryDomain) => Promise<void>;
  onActivateIndustry: (industry: DictionaryIndustry) => Promise<void>;
  onDeleteDomain: (domainId: string) => Promise<void>;
  onPermanentlyDeleteDomain: (domain: DictionaryDomain) => Promise<void>;
  onDeleteIndustry: (industryId: string, force?: boolean) => Promise<void>;
  onSeedDefaultDomains: (domainKey?: string) => Promise<boolean>;
  onSeedDefaultIndustries: (industryKey?: string) => Promise<boolean>;
  onMapDomain: (domainId: string) => Promise<void>;
  onMapDomainToIndustry: (industryId: string, domainId: string) => Promise<void>;
  onRenameDomain: (
    domain: DictionaryDomain,
    name: string,
  ) => Promise<DomainDisplayNameUpdateResult>;
  onReorderDomains: (industryId: string, domainIds: string[]) => Promise<void>;
  onReorderIndustries: (industryIds: string[]) => Promise<void>;
}) {
  const [domainSearch, setDomainSearch] = useState("");
  const [draggedDomainKey, setDraggedDomainKey] = useState("");
  const [draggedIndustryId, setDraggedIndustryId] = useState("");
  const [industryDeleteImpact, setIndustryDeleteImpact] = useState<{
    defaultProcessCount: number;
    domainNames: string[];
    domainProcessCount: number;
    hasMappedData: boolean;
    hasProcesses: boolean;
    industry: DictionaryIndustry;
    processCount: number;
  } | null>(null);
  const [inactiveDomainDeleteTarget, setInactiveDomainDeleteTarget] =
    useState<MappedDictionaryDomain | null>(null);
  const [mappingView, setMappingView] = useState<"manage" | "table">("manage");
  const [isDefaultDomainsDialogOpen, setIsDefaultDomainsDialogOpen] = useState(false);
  const [isDefaultIndustriesDialogOpen, setIsDefaultIndustriesDialogOpen] = useState(false);
  const [domainRenameTarget, setDomainRenameTarget] = useState<DictionaryDomain | null>(null);
  const [reorderToasts, setReorderToasts] = useState<ReorderToastState[]>([]);
  const [canScrollDomainLibraryDown, setCanScrollDomainLibraryDown] = useState(false);
  const [canScrollIndustriesDown, setCanScrollIndustriesDown] = useState(false);
  const [canScrollMappedDomainsDown, setCanScrollMappedDomainsDown] = useState(false);
  const industryListRef = useRef<HTMLDivElement | null>(null);
  const domainLibraryListRef = useRef<HTMLDivElement | null>(null);
  const mappedDomainListRef = useRef<HTMLDivElement | null>(null);
  const inactiveDomainDeleteDialogRef = useRef<HTMLDivElement | null>(null);
  const inactiveDomainDeleteCancelRef = useRef<HTMLButtonElement | null>(null);
  const inactiveDomainDeleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const domainRenameTriggerRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreDomainRenameFocusRef = useRef(false);
  const inactiveDomainDeleteInFlightRef = useRef(false);
  const reorderToastIdRef = useRef(0);
  const reorderToastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [domainOrderByIndustryId, setDomainOrderByIndustryId] = useState<Record<string, string[]>>(
    {},
  );
  const [industryOrder, setIndustryOrder] = useState<string[]>([]);

  useEffect(() => {
    if (inactiveDomainDeleteTarget) {
      inactiveDomainDeleteCancelRef.current?.focus();
    }
  }, [inactiveDomainDeleteTarget]);

  useEffect(() => {
    if (domainRenameTarget || isRenamingDomain || !shouldRestoreDomainRenameFocusRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      shouldRestoreDomainRenameFocusRef.current = false;
      if (domainRenameTriggerRef.current?.isConnected) {
        domainRenameTriggerRef.current.focus();
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [domainRenameTarget, isRenamingDomain]);
  const selectedIndustryId = industries.some((industry) => industry.id === mappingIndustryId)
    ? mappingIndustryId
    : industries[0]?.id || "";
  const selectedIndustry = industries.find((industry) => industry.id === selectedIndustryId);
  const selectedIndustryName = selectedIndustry?.name || "Selected industry";
  const orderedIndustries = useMemo(
    () => orderItemsByKey(industries, industryOrder, (industry) => industry.id),
    [industries, industryOrder],
  );
  const orderedInactiveIndustries = useMemo(
    () => orderItemsByDisplayOrder(inactiveIndustries),
    [inactiveIndustries],
  );
  const displayedIndustries = useMemo(
    () => [...orderedIndustries, ...orderedInactiveIndustries],
    [orderedInactiveIndustries, orderedIndustries],
  );
  const activeIndustryCount = industries.length;
  const totalIndustryCount = displayedIndustries.length;
  const normalizedIndustrySearch = normalizeSearch(industryName);
  const exactActiveIndustryMatch = orderedIndustries.some(
    (industry) => normalizeSearch(industry.name) === normalizedIndustrySearch,
  );
  const exactInactiveIndustryMatch = orderedInactiveIndustries.some(
    (industry) => normalizeSearch(industry.name) === normalizedIndustrySearch,
  );
  const filteredOrderedIndustries = displayedIndustries.filter(
    (industry) =>
      !normalizedIndustrySearch ||
      normalizeSearch(industry.name).includes(normalizedIndustrySearch),
  );
  const uniqueDomains = useMemo(() => getUniqueDomains(domains), [domains]);
  const industryUsageByDomainKey = useMemo(
    () => getIndustryUsageByDomainKey(domains, libraries),
    [domains, libraries],
  );
  const domainCountByIndustryId = useMemo(
    () => getDomainCountByIndustry(industries, domains, libraries),
    [domains, industries, libraries],
  );
  const industryCountMetricsById = useMemo(() => {
    const metricsByIndustryId = new Map<
      string,
      {
        domainCount: number;
        industryDomainProcessCount: number;
        industrySpecificProcessCount: number;
      }
    >();

    industries.forEach((industry) => {
      const industrySpecificProcessCount = Math.max(0, industry.defaultProcessCount ?? 0);
      const mappedDomainProcessCount = getMappedDomainsForIndustry(
        industry.id,
        domains,
        libraries,
      ).reduce((total, domain) => total + domain.processCount, 0);
      const derivedIndustryDomainProcessCount = Math.max(
        mappedDomainProcessCount,
        (industry.associatedProcessCount ?? 0) - industrySpecificProcessCount,
      );

      metricsByIndustryId.set(industry.id, {
        domainCount: domainCountByIndustryId.get(industry.id) ?? 0,
        industryDomainProcessCount: Math.max(
          0,
          industry.industryDomainProcessCount ?? derivedIndustryDomainProcessCount,
        ),
        industrySpecificProcessCount,
      });
    });

    return metricsByIndustryId;
  }, [domainCountByIndustryId, domains, industries, libraries]);
  const mappedDomains = useMemo(
    () => getMappedDomainsForIndustry(selectedIndustryId, domains, libraries),
    [domains, libraries, selectedIndustryId],
  );
  const inactiveMappedDomains = useMemo(
    () =>
      orderItemsByDisplayOrder(
        inactiveDomains
          .filter((domain) => domain.industryIds.includes(selectedIndustryId))
          .map((domain) => ({
            ...domain,
            key: getDomainIdentity(domain),
            processCount: 0,
          })),
      ),
    [inactiveDomains, selectedIndustryId],
  );
  const orderedMappedDomains = useMemo(
    () =>
      orderItemsByKey(
        mappedDomains,
        domainOrderByIndustryId[selectedIndustryId] ?? [],
        (domain) => domain.id,
      ),
    [domainOrderByIndustryId, mappedDomains, selectedIndustryId],
  );
  const normalizedMappedDomainSearch = normalizeSearch(domainName);
  const exactMappedDomainMatch = orderedMappedDomains.some(
    (domain) =>
      normalizeSearch(domain.name) === normalizedMappedDomainSearch ||
      normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedMappedDomainSearch,
  );
  const exactInactiveMappedDomainMatch = inactiveMappedDomains.some(
    (domain) =>
      normalizeSearch(domain.name) === normalizedMappedDomainSearch ||
      normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedMappedDomainSearch,
  );
  const exactGlobalDomainMatch = uniqueDomains.some(
    (domain) =>
      normalizeSearch(domain.name) === normalizedMappedDomainSearch ||
      normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedMappedDomainSearch,
  );
  const displayedMappedDomains = useMemo(
    () => [...orderedMappedDomains, ...inactiveMappedDomains],
    [inactiveMappedDomains, orderedMappedDomains],
  );
  const filteredOrderedMappedDomains = displayedMappedDomains.filter(
    (domain) =>
      !normalizedMappedDomainSearch ||
      normalizeSearch(domain.name).includes(normalizedMappedDomainSearch) ||
      normalizeSearch(getDomainDisplayTitle(domain.name)).includes(normalizedMappedDomainSearch),
  );
  const mappedDomainKeys = new Set(mappedDomains.map((domain) => domain.key));
  const normalizedDomainSearch = normalizeSearch(domainSearch);
  const filteredGlobalDomains = uniqueDomains.filter(
    (domain) =>
      !normalizedDomainSearch || normalizeSearch(domain.name).includes(normalizedDomainSearch),
  );
  const isDeletingMapping = isDeletingDomain || isDeletingIndustry;
  const industryFieldHint = !normalizedIndustrySearch
    ? "Search or create"
    : exactActiveIndustryMatch
      ? "Enter to select"
      : exactInactiveIndustryMatch
        ? "Inactive"
        : "Enter to create";
  const domainFieldHint = !selectedIndustryId
    ? "Select industry"
    : !normalizedMappedDomainSearch
      ? "Search or create"
      : exactMappedDomainMatch
        ? "Already mapped"
        : exactInactiveMappedDomainMatch
          ? "Inactive"
          : exactGlobalDomainMatch
            ? "Enter to map"
            : "Enter to create";
  const isIndustryFieldBusy = isIndustrySaving;
  const isDomainFieldBusy = isDomainSaving || isMappingDomain;

  useEffect(() => {
    const toastTimeouts = reorderToastTimeoutsRef.current;

    return () => {
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    updateScrollDownState(industryListRef, setCanScrollIndustriesDown);
  }, [filteredOrderedIndustries, mappingView]);

  useEffect(() => {
    updateScrollDownState(domainLibraryListRef, setCanScrollDomainLibraryDown);
  }, [domainSearch, filteredGlobalDomains, mappingView]);

  useEffect(() => {
    updateScrollDownState(mappedDomainListRef, setCanScrollMappedDomainsDown);
  }, [filteredOrderedMappedDomains, mappingView, selectedIndustryId]);

  function clearReorderToastTimeout(toastId: string) {
    const toastTimeout = reorderToastTimeoutsRef.current.get(toastId);

    if (toastTimeout) {
      clearTimeout(toastTimeout);
      reorderToastTimeoutsRef.current.delete(toastId);
    }
  }

  function scheduleReorderToastDismiss(toastId: string, tone: ReorderToastState["tone"]) {
    clearReorderToastTimeout(toastId);

    if (tone === "processing") {
      return;
    }

    const toastTimeout = setTimeout(() => {
      setReorderToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
      reorderToastTimeoutsRef.current.delete(toastId);
    }, dataDictionaryToastDismissMs);

    reorderToastTimeoutsRef.current.set(toastId, toastTimeout);
  }

  function showReorderToast(message: string, tone: ReorderToastState["tone"]) {
    reorderToastIdRef.current += 1;
    const toastId = `mapping-toast-${reorderToastIdRef.current}`;

    setReorderToasts((currentToasts) =>
      [{ id: toastId, message, tone }, ...currentToasts].slice(0, 3),
    );
    scheduleReorderToastDismiss(toastId, tone);

    return toastId;
  }

  function dismissReorderToast(toastId: string) {
    clearReorderToastTimeout(toastId);
    setReorderToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }

  function updateReorderToast(toastId: string, message: string, tone: ReorderToastState["tone"]) {
    setReorderToasts((currentToasts) => {
      const toastExists = currentToasts.some((toast) => toast.id === toastId);
      const nextToast = { id: toastId, message, tone };

      if (!toastExists) {
        return [nextToast, ...currentToasts].slice(0, 3);
      }

      return currentToasts.map((toast) => (toast.id === toastId ? nextToast : toast));
    });
    scheduleReorderToastDismiss(toastId, tone);
  }

  function selectIndustry(industryId: string) {
    setDomainIndustryId(industryId);
    setMappingIndustryId(industryId);
  }

  async function mapDomain(domainId: string) {
    const domain = uniqueDomains.find((item) => item.id === domainId);

    try {
      await onMapDomain(domainId);
      showReorderToast(`${domain?.name || "Domain"} mapped to ${selectedIndustryName}`, "success");
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function mapDomainToIndustry(industryId: string, domainId: string) {
    const domain = uniqueDomains.find((item) => item.id === domainId);
    const industry = orderedIndustries.find((item) => item.id === industryId);

    try {
      await onMapDomainToIndustry(industryId, domainId);
      showReorderToast(
        `${domain?.name || "Domain"} mapped to ${industry?.name || "selected industry"}`,
        "success",
      );
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function renameDomain(name: string) {
    if (!domainRenameTarget) {
      return;
    }

    try {
      const result = await onRenameDomain(domainRenameTarget, name);
      closeDomainRenameDialog();
      showReorderToast(
        `${result.name} is now shown across ${result.matchedMappingCount} ${
          result.matchedMappingCount === 1 ? "mapping" : "mappings"
        }`,
        "success",
      );
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  function openDomainRenameDialog(domain: DictionaryDomain, trigger: HTMLButtonElement) {
    domainRenameTriggerRef.current = trigger;
    shouldRestoreDomainRenameFocusRef.current = false;
    setDomainRenameTarget(domain);
  }

  function closeDomainRenameDialog() {
    shouldRestoreDomainRenameFocusRef.current = true;
    setDomainRenameTarget(null);
  }

  async function createIndustryFromSearch() {
    const industryLabel = toDisplayName(industryName);

    try {
      const wasAdded = await onAddIndustry();

      if (wasAdded) {
        showReorderToast(`${industryLabel} industry added`, "success");
      }
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function createDomainFromSearch() {
    const domainLabel = toDisplayName(domainName);

    try {
      const wasAdded = await onAddDomain();

      if (wasAdded) {
        showReorderToast(`${domainLabel} added to ${selectedIndustryName}`, "success");
      }
    } catch (error) {
      showReorderToast(`${getErrorMessage(error)}: ${selectedIndustryName}`, "error");
    }
  }

  function handleIndustrySearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const normalizedSearch = normalizeSearch(industryName);
    if (!normalizedSearch || isIndustrySaving) {
      return;
    }

    const existingIndustry = orderedIndustries.find(
      (industry) => normalizeSearch(industry.name) === normalizedSearch,
    );

    if (existingIndustry) {
      selectIndustry(existingIndustry.id);
      setIndustryName("");
      return;
    }

    const inactiveIndustry = orderedInactiveIndustries.find(
      (industry) => normalizeSearch(industry.name) === normalizedSearch,
    );

    if (inactiveIndustry) {
      showReorderToast(`${inactiveIndustry.name} is inactive and hidden from users`, "error");
      return;
    }

    void createIndustryFromSearch();
  }

  function handleDomainSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const normalizedSearch = normalizeSearch(domainName);
    if (!normalizedSearch || isDomainSaving || isMappingDomain) {
      return;
    }

    if (!selectedIndustryId) {
      showReorderToast("Select an industry before adding a domain", "error");
      return;
    }

    const existingMappedDomain = orderedMappedDomains.find(
      (domain) =>
        normalizeSearch(domain.name) === normalizedSearch ||
        normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedSearch,
    );

    if (existingMappedDomain) {
      showReorderToast(
        `${getDomainDisplayTitle(existingMappedDomain.name)} is already mapped to ${selectedIndustryName}`,
        "success",
      );
      setDomainName("");
      return;
    }

    const inactiveMappedDomain = inactiveMappedDomains.find(
      (domain) =>
        normalizeSearch(domain.name) === normalizedSearch ||
        normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedSearch,
    );

    if (inactiveMappedDomain) {
      void activateDomain(inactiveMappedDomain).then(() => setDomainName(""));
      return;
    }

    const existingGlobalDomain = uniqueDomains.find(
      (domain) =>
        normalizeSearch(domain.name) === normalizedSearch ||
        normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedSearch,
    );

    if (existingGlobalDomain) {
      void mapDomain(existingGlobalDomain.id).then(() => setDomainName(""));
      return;
    }

    void createDomainFromSearch();
  }

  function getIndustryDeleteImpact(industryId: string) {
    const industry = orderedIndustries.find((item) => item.id === industryId);

    if (!industry) {
      return null;
    }

    const industryMappedDomains = getMappedDomainsForIndustry(industryId, domains, libraries);
    const mappedDomainProcessCount = industryMappedDomains.reduce(
      (total, domain) => total + domain.processCount,
      0,
    );
    const defaultProcessCount = Math.max(0, industry.defaultProcessCount || 0);
    const processCount = Math.max(
      industry.associatedProcessCount || 0,
      defaultProcessCount + mappedDomainProcessCount,
    );
    const domainProcessCount = Math.max(0, processCount - defaultProcessCount);

    return {
      defaultProcessCount,
      domainNames: industryMappedDomains.map((domain) => getDomainDisplayTitle(domain.name)),
      domainProcessCount,
      hasProcesses: processCount > 0,
      hasMappedData: industryMappedDomains.length > 0 || processCount > 0,
      industry,
      processCount,
    };
  }

  async function deleteIndustry(industryId: string, force = false) {
    const industry = orderedIndustries.find((item) => item.id === industryId);
    const deleteImpact = getIndustryDeleteImpact(industryId);

    if (deleteImpact?.hasProcesses) {
      setIndustryDeleteImpact(null);
      showReorderToast(
        `${deleteImpact.industry.name} cannot be deactivated while processes exist. Remove or archive its processes first.`,
        "error",
      );
      return;
    }

    try {
      await onDeleteIndustry(industryId, force);
      setIndustryDeleteImpact(null);
      showReorderToast(`${industry?.name || "Industry"} deactivated`, "success");
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function activateIndustry(industry: DictionaryIndustry) {
    try {
      await onActivateIndustry(industry);
      setIndustryName("");
      showReorderToast(`${industry.name} activated`, "success");
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function activateDomain(domain: DictionaryDomain) {
    const domainTitle = getDomainDisplayTitle(domain.name);

    try {
      await onActivateDomain(domain);
      setDomainName("");
      showReorderToast(`${domainTitle} activated for ${selectedIndustryName}`, "success");
    } catch (error) {
      showReorderToast(`${getErrorMessage(error)}: ${selectedIndustryName}`, "error");
    }
  }

  function requestPermanentDomainDelete(
    domain: MappedDictionaryDomain,
    trigger: HTMLButtonElement,
  ) {
    inactiveDomainDeleteTriggerRef.current = trigger;
    setInactiveDomainDeleteTarget(domain);
  }

  function closePermanentDomainDeleteDialog() {
    if (isPermanentlyDeletingDomain) {
      return;
    }

    setInactiveDomainDeleteTarget(null);
    window.requestAnimationFrame(() => inactiveDomainDeleteTriggerRef.current?.focus());
  }

  async function permanentlyDeleteDomain(domain: MappedDictionaryDomain) {
    if (inactiveDomainDeleteInFlightRef.current) {
      return;
    }

    inactiveDomainDeleteInFlightRef.current = true;
    const domainTitle = getDomainDisplayTitle(domain.name);

    try {
      await onPermanentlyDeleteDomain(domain);
      setInactiveDomainDeleteTarget(null);
      inactiveDomainDeleteTriggerRef.current = null;
      showReorderToast(`${domainTitle} permanently deleted`, "success");
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    } finally {
      inactiveDomainDeleteInFlightRef.current = false;
    }
  }

  function handlePermanentDomainDeleteDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePermanentDomainDeleteDialog();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      inactiveDomainDeleteDialogRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])",
      ) ?? [],
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function requestDeleteIndustry(industryId: string) {
    const deleteImpact = getIndustryDeleteImpact(industryId);

    if (!deleteImpact) {
      showReorderToast("Industry not found", "error");
      return;
    }

    if (deleteImpact.hasProcesses) {
      showReorderToast(
        `${deleteImpact.industry.name} cannot be deactivated while ${deleteImpact.processCount} ${
          deleteImpact.processCount === 1 ? "process exists" : "processes exist"
        }. Remove the ${deleteImpact.processCount === 1 ? "process" : "processes"} first.`,
        "error",
      );
      return;
    }

    if (deleteImpact.hasMappedData) {
      setIndustryDeleteImpact(deleteImpact);
      return;
    }

    void deleteIndustry(industryId);
  }

  async function deleteMappedDomain(domain: MappedDictionaryDomain) {
    const domainTitle = getDomainDisplayTitle(domain.name);

    try {
      await onDeleteDomain(domain.id);
      showReorderToast(`${domainTitle} removed from ${selectedIndustryName}`, "success");
    } catch (error) {
      showReorderToast(`${getErrorMessage(error)}: ${selectedIndustryName}`, "error");
    }
  }

  function allowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function persistIndustryOrder(nextOrder: string[]) {
    const toastId = showReorderToast("Saving industry order...", "processing");

    setIndustryOrder(nextOrder);
    void onReorderIndustries(nextOrder).then(
      () => {
        setIndustryOrder([]);
        updateReorderToast(toastId, "Industry order updated", "success");
      },
      () => {
        setIndustryOrder([]);
        updateReorderToast(toastId, "Industry order could not be saved", "error");
      },
    );
  }

  function persistDomainOrder(nextOrder: string[]) {
    const toastId = showReorderToast("Saving domain order...", "processing");

    setDomainOrderByIndustryId((currentOrderByIndustryId) => ({
      ...currentOrderByIndustryId,
      [selectedIndustryId]: nextOrder,
    }));
    void onReorderDomains(selectedIndustryId, nextOrder).then(
      () => {
        setDomainOrderByIndustryId((currentOrderByIndustryId) => ({
          ...currentOrderByIndustryId,
          [selectedIndustryId]: [],
        }));
        updateReorderToast(toastId, "Domain order updated", "success");
      },
      () => {
        setDomainOrderByIndustryId((currentOrderByIndustryId) => ({
          ...currentOrderByIndustryId,
          [selectedIndustryId]: [],
        }));
        updateReorderToast(toastId, "Domain order could not be saved", "error");
      },
    );
  }

  function reorderKeyByOffset(itemKeys: string[], itemKey: string, offset: number) {
    const currentIndex = itemKeys.indexOf(itemKey);
    const targetIndex = currentIndex + offset;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= itemKeys.length) {
      return [];
    }

    const nextOrder = [...itemKeys];
    const [movedKey] = nextOrder.splice(currentIndex, 1);

    if (!movedKey) {
      return [];
    }

    nextOrder.splice(targetIndex, 0, movedKey);

    return nextOrder;
  }

  function moveIndustry(targetIndustryId: string) {
    if (!draggedIndustryId || draggedIndustryId === targetIndustryId) {
      return;
    }

    const nextOrder = reorderItemKeys(
      orderedIndustries.map((industry) => industry.id),
      [],
      draggedIndustryId,
      targetIndustryId,
    );

    persistIndustryOrder(nextOrder);
  }

  function moveIndustryByKeyboard(industryId: string, offset: number) {
    const nextOrder = reorderKeyByOffset(
      orderedIndustries.map((industry) => industry.id),
      industryId,
      offset,
    );

    if (nextOrder.length > 0) {
      persistIndustryOrder(nextOrder);
    }
  }

  function moveMappedDomain(targetDomainId: string) {
    if (!draggedDomainKey || draggedDomainKey === targetDomainId) {
      return;
    }

    const nextOrder = reorderItemKeys(
      orderedMappedDomains.map((domain) => domain.id),
      [],
      draggedDomainKey,
      targetDomainId,
    );

    persistDomainOrder(nextOrder);
  }

  function moveMappedDomainByKeyboard(domainId: string, offset: number) {
    const nextOrder = reorderKeyByOffset(
      orderedMappedDomains.map((domain) => domain.id),
      domainId,
      offset,
    );

    if (nextOrder.length > 0) {
      persistDomainOrder(nextOrder);
    }
  }

  function handleIndustryKeyDown(event: KeyboardEvent<HTMLButtonElement>, industryId: string) {
    if (!event.altKey) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveIndustryByKeyboard(industryId, -1);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveIndustryByKeyboard(industryId, 1);
    }
  }

  function handleMappedDomainKeyDown(event: KeyboardEvent<HTMLElement>, domainId: string) {
    if (!event.altKey) {
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveMappedDomainByKeyboard(domainId, -1);
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveMappedDomainByKeyboard(domainId, 1);
    }
  }

  function scrollListDown(listRef: React.RefObject<HTMLDivElement | null>) {
    listRef.current?.scrollBy({ behavior: "smooth", top: 140 });
  }

  function handleListScroll(
    listRef: React.RefObject<HTMLDivElement | null>,
    setCanScrollDown: (value: boolean) => void,
  ) {
    updateScrollDownState(listRef, setCanScrollDown);
  }

  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-md border border-black/8 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="flex min-h-[54px] flex-col items-stretch gap-3 border-b border-black/[0.08] px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <p className="shrink-0 text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
          Industry and domain mapping
        </p>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <button
            type="button"
            onClick={() => setIsDefaultIndustriesDialogOpen(true)}
            disabled={isCatalogLoading || isDefaultIndustriesSaving}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[#B8D8FF] bg-[#F4FAFF] px-3 text-[11px] font-bold whitespace-nowrap text-[#007AFF] transition hover:border-[#007AFF] hover:bg-[#EAF4FF] disabled:cursor-wait disabled:opacity-50 sm:w-auto"
          >
            <Sparkles size={12} aria-hidden="true" />
            Add default industries
          </button>
          <button
            type="button"
            onClick={() => setIsDefaultDomainsDialogOpen(true)}
            disabled={isCatalogLoading || isDefaultDomainsSaving}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[#B8D8FF] bg-[#F4FAFF] px-3 text-[11px] font-bold whitespace-nowrap text-[#007AFF] transition hover:border-[#007AFF] hover:bg-[#EAF4FF] disabled:cursor-wait disabled:opacity-50 sm:w-auto"
          >
            <Sparkles size={12} aria-hidden="true" />
            Add default domains
          </button>
          <div
            aria-label="Industry and domain mapping view"
            className="grid h-8 w-full grid-cols-2 items-center rounded-md border border-black/[0.08] bg-[#F5F5F7] p-0.5 sm:inline-flex sm:w-auto"
            role="group"
          >
            <button
              type="button"
              onClick={() => setMappingView("manage")}
              aria-pressed={mappingView === "manage"}
              title="Manage industries and mapped domains"
              className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-[11px] font-bold transition ${
                mappingView === "manage"
                  ? "bg-white text-[#007AFF] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                  : "text-[#86868B] hover:text-[#171717]"
              }`}
            >
              <LayoutGrid size={12} aria-hidden="true" />
              Manage
            </button>
            <button
              type="button"
              onClick={() => setMappingView("table")}
              aria-pressed={mappingView === "table"}
              title="View industry and domain relationships as a table"
              className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-[11px] font-bold transition ${
                mappingView === "table"
                  ? "bg-white text-[#007AFF] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                  : "text-[#86868B] hover:text-[#171717]"
              }`}
            >
              <Table2 size={12} aria-hidden="true" />
              Relations
            </button>
          </div>
        </div>
      </div>
      {isDefaultIndustriesDialogOpen ? (
        <DefaultIndustriesWorkspace
          isSeeding={isDefaultIndustriesSaving}
          onClose={() => setIsDefaultIndustriesDialogOpen(false)}
          onSeedDefaults={onSeedDefaultIndustries}
        />
      ) : null}
      {isDefaultDomainsDialogOpen ? (
        <DefaultDomainsWorkspace
          isSeeding={isDefaultDomainsSaving}
          onClose={() => setIsDefaultDomainsDialogOpen(false)}
          onSeedDefaults={onSeedDefaultDomains}
        />
      ) : null}
      <div className="px-5 py-5">
        {isCatalogLoading ? (
          <IndustryDomainSkeleton />
        ) : mappingView === "table" ? (
          <IndustryDomainRelationTable
            domains={uniqueDomains}
            industries={orderedIndustries}
            isMappingDomain={isMappingDomain}
            isRenamingDomain={isRenamingDomain}
            libraries={libraries}
            onMapDomain={mapDomainToIndustry}
            onRenameDomain={openDomainRenameDialog}
          />
        ) : (
          <div className={mappingGridClassName}>
            <section className={mappingPanelClassName} style={mappingColumnStyle}>
              <div className="min-h-8 border-b border-black/[0.06]">
                <div className="flex min-h-5 items-center justify-between gap-3">
                  <p className="min-w-0 text-[11px] leading-4 font-bold tracking-[0.08em] text-[#86868B] uppercase">
                    Industries
                  </p>
                  <p className="shrink-0 text-xs leading-4 font-semibold text-[#A1A1AA]">
                    {activeIndustryCount} active / {totalIndustryCount} total
                  </p>
                </div>
              </div>
              <div className="mt-2 h-9">
                <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-[#007AFF]">
                  <Search size={14} className="shrink-0 text-[#A1A1AA]" aria-hidden="true" />
                  <input
                    value={industryName}
                    onChange={(event) => setIndustryName(event.target.value)}
                    onKeyDown={handleIndustrySearchKeyDown}
                    disabled={isIndustrySaving}
                    className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[#555555] outline-none placeholder:text-[#A1A1AA] focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none disabled:cursor-wait"
                    placeholder="Search industry or type new name"
                    title="Search industries, select an existing match, or press Enter to create a new industry"
                  />
                  {isIndustryFieldBusy ? (
                    <FieldSpinner label="Saving industry" />
                  ) : (
                    <span className="shrink-0 rounded-[4px] bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-bold text-[#86868B]">
                      {industryFieldHint}
                    </span>
                  )}
                </label>
              </div>
              <div
                aria-label="Industry count guide"
                className="mt-2 flex min-h-4 [scrollbar-width:none] items-center gap-2.5 overflow-x-auto px-0.5 text-[9px] leading-none font-semibold whitespace-nowrap text-[#6E6E73] [&::-webkit-scrollbar]:hidden"
              >
                <span className="inline-flex shrink-0 items-center gap-1">
                  <span className="size-2 rounded-full bg-[#007AFF]" aria-hidden="true" />
                  Domains
                </span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <span className="size-2 rounded-full bg-[#D97706]" aria-hidden="true" />
                  Industry-specific
                </span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <span className="size-2 rounded-full bg-[#A855F7]" aria-hidden="true" />
                  Industry × domain
                </span>
              </div>
              <div className="relative mt-2 min-h-0 flex-1">
                <div
                  ref={industryListRef}
                  onScroll={() => handleListScroll(industryListRef, setCanScrollIndustriesDown)}
                  className="scrollbar-hidden h-full space-y-1 overflow-y-auto pr-1"
                >
                  {filteredOrderedIndustries.map((industry) => {
                    const isSelected = industry.id === selectedIndustryId;
                    const countMetrics = industryCountMetricsById.get(industry.id);
                    const domainCount = countMetrics?.domainCount ?? 0;
                    const industrySpecificProcessCount =
                      countMetrics?.industrySpecificProcessCount ?? 0;
                    const industryDomainProcessCount =
                      countMetrics?.industryDomainProcessCount ?? 0;
                    const isInactiveIndustry = industry.isActive === false;
                    const processCount = Math.max(
                      0,
                      industry.associatedProcessCount || industry.defaultProcessCount || 0,
                    );
                    const cannotDeactivate = !isInactiveIndustry && processCount > 0;

                    return (
                      <div
                        key={industry.id}
                        draggable={!isInactiveIndustry}
                        onDragEnd={() => setDraggedIndustryId("")}
                        onDragOver={allowDrop}
                        onDragStart={(event) => {
                          if (isInactiveIndustry) {
                            return;
                          }

                          setDraggedIndustryId(industry.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!isInactiveIndustry) {
                            moveIndustry(industry.id);
                          }
                        }}
                        title={
                          isInactiveIndustry
                            ? `${industry.name} is inactive and hidden from users.`
                            : `${industry.name}: ${domainCount} mapped ${
                                domainCount === 1 ? "domain" : "domains"
                              }, ${industrySpecificProcessCount} industry-specific processes, and ${industryDomainProcessCount} industry × domain processes. Select or drag to reorder.`
                        }
                        className={`grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border-l-2 px-2 text-left transition ${
                          isSelected && !isInactiveIndustry
                            ? "border-[#007AFF] bg-[#EAF3FF] text-[#171717]"
                            : isInactiveIndustry
                              ? "border-transparent bg-[#FAFAFA] text-[#A1A1AA]"
                              : "cursor-grab border-transparent text-[#555555] hover:bg-[#FAFAFA] active:cursor-grabbing"
                        }`}
                      >
                        <button
                          type="button"
                          onKeyDown={(event) => handleIndustryKeyDown(event, industry.id)}
                          onClick={() => selectIndustry(industry.id)}
                          disabled={isInactiveIndustry}
                          aria-current={isSelected && !isInactiveIndustry ? "true" : undefined}
                          aria-label={
                            isInactiveIndustry
                              ? `${industry.name} is inactive and hidden from users.`
                              : `${industry.name}. ${domainCount} mapped ${
                                  domainCount === 1 ? "domain" : "domains"
                                }, ${industrySpecificProcessCount} industry-specific processes, and ${industryDomainProcessCount} industry × domain processes. Press Enter to select. Press Alt Arrow Up or Alt Arrow Down to reorder.`
                          }
                          className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto_auto] items-center gap-2 text-left"
                        >
                          <span className="flex size-6 items-center justify-center rounded-full bg-[#F0F0F0] text-[#86868B]">
                            <Building2 size={13} aria-hidden="true" />
                          </span>
                          <span className="truncate text-xs font-bold">{industry.name}</span>
                          <GripVertical
                            size={14}
                            className={isInactiveIndustry ? "text-[#D1D5DB]" : "text-[#A1A1AA]"}
                            aria-hidden="true"
                          />
                          {isInactiveIndustry ? (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#A1A1AA]">
                              Hidden
                            </span>
                          ) : (
                            <span
                              className="flex shrink-0 items-center gap-1"
                              aria-label={`${domainCount} mapped domains, ${industrySpecificProcessCount} industry-specific processes, ${industryDomainProcessCount} industry by domain processes`}
                            >
                              <span
                                title={`${domainCount} mapped ${domainCount === 1 ? "domain" : "domains"}`}
                                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#B8D8FF] bg-[#EAF3FF] px-1.5 text-[10px] font-bold text-[#007AFF]"
                              >
                                {domainCount}
                              </span>
                              <span
                                title={`${industrySpecificProcessCount} industry-specific ${industrySpecificProcessCount === 1 ? "process" : "processes"}`}
                                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#F5D48A] bg-[#FFF7E6] px-1.5 text-[10px] font-bold text-[#9A6700]"
                              >
                                {industrySpecificProcessCount}
                              </span>
                              <span
                                title={`${industryDomainProcessCount} industry × domain ${industryDomainProcessCount === 1 ? "process" : "processes"}`}
                                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#E2CBFA] bg-[#F5EDFF] px-1.5 text-[10px] font-bold text-[#7E22CE]"
                              >
                                {industryDomainProcessCount}
                              </span>
                            </span>
                          )}
                        </button>
                        {isInactiveIndustry || !cannotDeactivate ? (
                          <button
                            type="button"
                            onClick={() =>
                              isInactiveIndustry
                                ? void activateIndustry(industry)
                                : requestDeleteIndustry(industry.id)
                            }
                            disabled={isDeletingMapping || isIndustrySaving}
                            className={`flex size-7 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:text-[#C7C7CC] ${
                              isInactiveIndustry
                                ? "text-[#007AFF] hover:bg-[#EAF3FF]"
                                : "text-[#A1A1AA] hover:bg-[#FFF7F7] hover:text-[#EF4444]"
                            }`}
                            aria-label={
                              isInactiveIndustry
                                ? `Activate ${industry.name} industry`
                                : `Deactivate ${industry.name} industry`
                            }
                            title={
                              isInactiveIndustry
                                ? `Activate ${industry.name} industry`
                                : `Deactivate ${industry.name} industry`
                            }
                          >
                            {isInactiveIndustry ? (
                              <RotateCcw size={14} aria-hidden="true" />
                            ) : (
                              <EyeOff size={14} aria-hidden="true" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                  {filteredOrderedIndustries.length === 0 ? (
                    <EmptyState
                      className="h-full"
                      label={
                        industryName.trim()
                          ? "No industries match. Press Enter to create this industry."
                          : "No industries yet. Search and press Enter to create the first industry."
                      }
                    />
                  ) : null}
                </div>
                {canScrollIndustriesDown ? (
                  <ScrollDownButton
                    label="Scroll industries down"
                    onClick={() => scrollListDown(industryListRef)}
                  />
                ) : null}
              </div>
            </section>

            <section className={mappingPanelClassName} style={mappingColumnStyle}>
              <div className="min-h-8 border-b border-black/[0.06]">
                <div className="flex min-h-5 items-center justify-between gap-3">
                  <p className="min-w-0 text-[11px] leading-4 font-bold tracking-[0.08em] text-[#86868B] uppercase">
                    Mapped Domains
                  </p>
                  <p className="shrink-0 truncate text-xs leading-4 font-semibold text-[#A1A1AA]">
                    {selectedIndustryName} ·{" "}
                    {inactiveMappedDomains.length > 0
                      ? `${mappedDomains.length} active / ${displayedMappedDomains.length} total`
                      : `${mappedDomains.length} mapped`}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-9">
                <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-[#007AFF]">
                  <Search size={14} className="shrink-0 text-[#A1A1AA]" aria-hidden="true" />
                  <input
                    value={domainName}
                    onChange={(event) => {
                      setDomainIndustryId(selectedIndustryId);
                      setDomainName(event.target.value);
                    }}
                    onKeyDown={handleDomainSearchKeyDown}
                    disabled={!selectedIndustryId || isDomainSaving || isMappingDomain}
                    className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[#555555] outline-none placeholder:text-[#A1A1AA] focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none disabled:cursor-not-allowed disabled:text-[#A1A1AA]"
                    placeholder={
                      selectedIndustryId
                        ? "Search domain or type new name"
                        : "Select an industry first"
                    }
                    title={
                      selectedIndustryId
                        ? `Search mapped domains, map an existing global domain, or press Enter to create under ${selectedIndustryName}`
                        : "Select an industry before adding a domain"
                    }
                  />
                  {isDomainFieldBusy ? (
                    <FieldSpinner label="Saving domain" />
                  ) : (
                    <span className="shrink-0 rounded-[4px] bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-bold text-[#86868B]">
                      {domainFieldHint}
                    </span>
                  )}
                </label>
              </div>
              {filteredOrderedMappedDomains.length > 0 ? (
                <div className="relative mt-4 min-h-0 flex-1">
                  <div
                    ref={mappedDomainListRef}
                    aria-describedby="mapped-domain-keyboard-help"
                    aria-label={`${selectedIndustryName} mapped domains`}
                    onScroll={() =>
                      handleListScroll(mappedDomainListRef, setCanScrollMappedDomainsDown)
                    }
                    className="scrollbar-hidden h-full overflow-y-auto overscroll-contain pr-1"
                    role="list"
                  >
                    <div className="grid gap-2 md:grid-cols-2">
                      <p id="mapped-domain-keyboard-help" className="sr-only">
                        Press Alt Arrow Left or Alt Arrow Up to move a domain earlier. Press Alt
                        Arrow Right or Alt Arrow Down to move a domain later.
                      </p>
                      {filteredOrderedMappedDomains.map((domain) => (
                        <MappedDomainCard
                          key={domain.id}
                          domain={domain}
                          industryName={selectedIndustryName}
                          isActivating={isDomainSaving}
                          isDeleting={isDeletingDomain}
                          isDragging={draggedDomainKey === domain.id}
                          isRenaming={isRenamingDomain}
                          onDelete={() => void deleteMappedDomain(domain)}
                          onPermanentDelete={(trigger) =>
                            requestPermanentDomainDelete(domain, trigger)
                          }
                          onActivate={() => void activateDomain(domain)}
                          onDragEnd={() => setDraggedDomainKey("")}
                          onDragOver={allowDrop}
                          onDragStart={(event) => {
                            setDraggedDomainKey(domain.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onKeyDown={(event) => handleMappedDomainKeyDown(event, domain.id)}
                          onRename={(trigger) => openDomainRenameDialog(domain, trigger)}
                          onDrop={(event) => {
                            event.preventDefault();
                            moveMappedDomain(domain.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {canScrollMappedDomainsDown ? (
                    <ScrollDownButton
                      label="Scroll mapped domains down"
                      onClick={() => scrollListDown(mappedDomainListRef)}
                    />
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  className="mt-4 flex-1"
                  label={
                    domainName.trim()
                      ? "No mapped domains match. Press Enter to create or map this domain."
                      : "No domains mapped yet. Search and press Enter to create one, or map from the global library."
                  }
                />
              )}
            </section>

            <section className={mappingPanelClassName} style={mappingColumnStyle}>
              <ColumnHeader
                label="Domain Library"
                meta={`${uniqueDomains.length} unique libraries`}
              >
                <span
                  className="rounded-full bg-[#F5F5F7] px-2 py-1 text-[10px] font-bold text-[#86868B]"
                  title="Duplicate domain names are grouped into one library item"
                >
                  Deduped
                </span>
              </ColumnHeader>
              <SearchInput
                value={domainSearch}
                onChange={setDomainSearch}
                placeholder="Search domains..."
                title="Search global domains by name"
                className="mt-4 w-full"
              />
              <div className="relative mt-4 min-h-0 flex-1">
                <div
                  ref={domainLibraryListRef}
                  onScroll={() =>
                    handleListScroll(domainLibraryListRef, setCanScrollDomainLibraryDown)
                  }
                  className="scrollbar-hidden h-full space-y-2 overflow-y-auto overscroll-contain pr-1"
                >
                  {filteredGlobalDomains.map((domain) => {
                    const domainKey = getDomainIdentity(domain);
                    const isMapped = mappedDomainKeys.has(domainKey);

                    return (
                      <div
                        key={domain.id}
                        title={`${getDomainDisplayTitle(domain.name)} is used in ${
                          industryUsageByDomainKey.get(domainKey) ?? 0
                        } ${(industryUsageByDomainKey.get(domainKey) ?? 0) === 1 ? "industry" : "industries"}`}
                        className="grid min-h-10 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-black/[0.06] bg-[#FAFAFA] px-2"
                      >
                        <button
                          type="button"
                          onClick={(event) => openDomainRenameDialog(domain, event.currentTarget)}
                          disabled={isRenamingDomain}
                          className="col-span-2 grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 disabled:cursor-wait"
                          aria-label={`Rename ${getDomainDisplayTitle(domain.name)} display name`}
                          title={`Rename ${getDomainDisplayTitle(domain.name)} display name`}
                        >
                          <span className="flex size-6 items-center justify-center rounded-full bg-white text-[#86868B]">
                            <Database size={13} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-[#555555]">
                              {domain.name}
                            </span>
                            <span className="block truncate text-[11px] font-semibold text-[#A1A1AA]">
                              Used in {industryUsageByDomainKey.get(domainKey) ?? 0}{" "}
                              {(industryUsageByDomainKey.get(domainKey) ?? 0) === 1
                                ? "industry"
                                : "industries"}
                            </span>
                          </span>
                        </button>
                        {isMapped ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-[#EAF3FF] px-2 py-1 text-[10px] font-bold text-[#007AFF]"
                            title={`${getDomainDisplayTitle(domain.name)} is already mapped to ${selectedIndustryName}`}
                          >
                            <Check size={11} aria-hidden="true" />
                            Mapped
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => mapDomain(domain.id)}
                            disabled={!selectedIndustryId || isMappingDomain}
                            className="inline-flex h-7 items-center gap-1 rounded-md bg-white px-2 text-[10px] font-bold text-[#007AFF] disabled:cursor-not-allowed disabled:text-[#A1A1AA]"
                            title={
                              selectedIndustryId
                                ? `Map ${getDomainDisplayTitle(domain.name)} to ${selectedIndustryName}`
                                : "Select an industry before mapping a domain"
                            }
                          >
                            <Plus size={11} aria-hidden="true" />
                            Map
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filteredGlobalDomains.length === 0 ? (
                    <EmptyState className="h-full" label="No domains match this search." />
                  ) : null}
                </div>
                {canScrollDomainLibraryDown ? (
                  <ScrollDownButton
                    label="Scroll domain library down"
                    onClick={() => scrollListDown(domainLibraryListRef)}
                  />
                ) : null}
              </div>
            </section>
          </div>
        )}
      </div>
      {industryDeleteImpact ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-industry-title"
        >
          <div className="w-full max-w-[520px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id="delete-industry-title" className="text-sm font-bold text-[#171717]">
                  Deactivate {industryDeleteImpact.industry.name}
                </p>
                <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
                  This will hide the industry and its mapped data from customer process options. You
                  can activate the industry again from this list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIndustryDeleteImpact(null)}
                disabled={isDeletingIndustry}
                className="flex size-8 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed"
                aria-label="Close deactivate industry confirmation"
                title="Close confirmation"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <DeleteImpactMetric
                label="Mapped domains"
                value={industryDeleteImpact.domainNames.length}
              />
              <DeleteImpactMetric
                label="Default processes"
                value={industryDeleteImpact.defaultProcessCount}
              />
              <DeleteImpactMetric
                label="Domain processes"
                value={industryDeleteImpact.domainProcessCount}
              />
            </div>
            {industryDeleteImpact.domainNames.length > 0 ? (
              <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
                <p className="text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
                  Domains that will be hidden
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {industryDeleteImpact.domainNames.slice(0, 8).map((domainName) => (
                    <span
                      key={domainName}
                      className="rounded-md bg-[#EAF3FF] px-2 py-1 text-[11px] font-bold text-[#007AFF]"
                    >
                      {domainName}
                    </span>
                  ))}
                  {industryDeleteImpact.domainNames.length > 8 ? (
                    <span className="rounded-md bg-[#F5F5F7] px-2 py-1 text-[11px] font-bold text-[#86868B]">
                      +{industryDeleteImpact.domainNames.length - 8} more
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
              <button
                type="button"
                onClick={() => setIndustryDeleteImpact(null)}
                disabled={isDeletingIndustry}
                className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteIndustry(industryDeleteImpact.industry.id, true)}
                disabled={isDeletingIndustry}
                className="h-9 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
              >
                {isDeletingIndustry ? "Deactivating..." : "Confirm deactivate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {inactiveDomainDeleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="permanent-domain-delete-title"
          aria-describedby="permanent-domain-delete-description"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePermanentDomainDeleteDialog();
            }
          }}
          onKeyDown={handlePermanentDomainDeleteDialogKeyDown}
        >
          <div
            ref={inactiveDomainDeleteDialogRef}
            className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.2)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id="permanent-domain-delete-title" className="text-sm font-bold text-[#171717]">
                  Permanently delete {getDomainDisplayTitle(inactiveDomainDeleteTarget.name)}?
                </p>
                <p
                  id="permanent-domain-delete-description"
                  className="mt-2 text-xs leading-5 font-semibold text-[#86868B]"
                >
                  This cannot be undone. The domain and all archived or inactive process and
                  technology records stored inside it will be permanently removed.
                </p>
              </div>
              <button
                type="button"
                onClick={closePermanentDomainDeleteDialog}
                disabled={isPermanentlyDeletingDomain}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed"
                aria-label="Close permanent domain deletion confirmation"
                title="Close confirmation"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
              <button
                ref={inactiveDomainDeleteCancelRef}
                type="button"
                onClick={closePermanentDomainDeleteDialog}
                disabled={isPermanentlyDeletingDomain}
                className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void permanentlyDeleteDomain(inactiveDomainDeleteTarget)}
                disabled={isPermanentlyDeletingDomain}
                className="h-9 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
              >
                {isPermanentlyDeletingDomain ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {domainRenameTarget ? (
        <DomainDisplayNameModal
          domain={domainRenameTarget}
          isSaving={isRenamingDomain}
          onClose={closeDomainRenameDialog}
          onSave={renameDomain}
        />
      ) : null}
      <ReorderToastStack onDismiss={dismissReorderToast} toasts={reorderToasts} />
    </section>
  );
}

function DeleteImpactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
      <p className="text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#171717]">{value}</p>
    </div>
  );
}

function FieldSpinner({ label }: { label: string }) {
  return (
    <span
      className="flex size-4 shrink-0 animate-spin rounded-full border-2 border-[#D1D5DB] border-t-[#007AFF]"
      aria-label={label}
      role="status"
      title={label}
    />
  );
}

function MappedDomainCard({
  domain,
  industryName,
  isActivating,
  isDeleting,
  isDragging,
  isRenaming,
  onDelete,
  onPermanentDelete,
  onActivate,
  onDragEnd,
  onDragOver,
  onDragStart,
  onKeyDown,
  onRename,
  onDrop,
}: {
  domain: MappedDictionaryDomain;
  industryName: string;
  isActivating: boolean;
  isDeleting: boolean;
  isDragging: boolean;
  isRenaming: boolean;
  onDelete: () => void;
  onPermanentDelete: (trigger: HTMLButtonElement) => void;
  onActivate: () => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onRename: (trigger: HTMLButtonElement) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}) {
  const domainTitle = getDomainDisplayTitle(domain.name);
  const processLabel = domain.processCount === 1 ? "process" : "processes";
  const isInactive = domain.isActive === false;

  return (
    <article
      draggable={!isInactive && !isRenaming}
      aria-label={
        isInactive
          ? `${domainTitle} is inactive and hidden from users. Activate it for ${industryName}.`
          : `${domainTitle} mapped to ${industryName}. ${domain.processCount} ${processLabel}. Press Alt Arrow Left or Alt Arrow Up to move earlier. Press Alt Arrow Right or Alt Arrow Down to move later.`
      }
      title={
        isInactive
          ? `${domainTitle} is inactive and hidden from users`
          : `${domainTitle}: ${domain.processCount} ${processLabel} mapped to ${industryName}. Drag or use Alt Arrow keys to reorder.`
      }
      onDragEnd={isInactive ? undefined : onDragEnd}
      onDragOver={isInactive ? undefined : onDragOver}
      onDragStart={isInactive ? undefined : onDragStart}
      onKeyDown={isInactive ? undefined : onKeyDown}
      onDrop={isInactive ? undefined : onDrop}
      role="listitem"
      tabIndex={isInactive ? undefined : 0}
      className={`flex min-h-[58px] items-center justify-between gap-3 rounded-md border border-black/[0.08] px-4 py-2 transition ${
        isInactive
          ? "bg-[#F5F5F7] opacity-75"
          : "cursor-grab bg-[#FAFAFA] hover:border-[#B8D8FF] hover:bg-[#F8FBFF] active:cursor-grabbing"
      } ${isDragging ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={(event) => onRename(event.currentTarget)}
        onKeyDown={(event) => event.stopPropagation()}
        disabled={isRenaming}
        className="min-w-0 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 disabled:cursor-wait"
        aria-label={`Rename ${domainTitle} display name`}
        title={`Rename ${domainTitle} display name`}
      >
        <p
          className={`truncate text-sm leading-5 font-bold ${isInactive ? "text-[#86868B]" : "text-[#171717]"}`}
        >
          {domainTitle}
        </p>
        <p className="text-xs leading-4 font-semibold text-[#86868B]">
          {isInactive ? "Hidden from users" : `${domain.processCount} processes`}
        </p>
      </button>
      <div className="flex h-full shrink-0 items-center gap-1.5 text-[#A1A1AA]">
        {isInactive ? (
          <>
            <button
              type="button"
              onClick={onActivate}
              disabled={isActivating || isDeleting || isRenaming}
              title={`Activate ${domainTitle} for ${industryName}`}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-white px-2 text-[10px] font-bold text-[#007AFF] transition hover:bg-[#EAF3FF] disabled:cursor-wait disabled:text-[#A1A1AA]"
              aria-label={`Activate ${domainTitle} for ${industryName}`}
            >
              <RotateCcw size={12} aria-hidden="true" />
              Activate
            </button>
            <button
              type="button"
              onClick={(event) => onPermanentDelete(event.currentTarget)}
              disabled={isActivating || isDeleting || isRenaming}
              title={`Permanently delete ${domainTitle} from ${industryName}`}
              className="flex size-7 items-center justify-center rounded-md bg-white text-[#EF4444] transition hover:bg-[#FEECEC] disabled:cursor-not-allowed disabled:text-[#C7C7CC]"
              aria-label={`Permanently delete ${domainTitle} from ${industryName}`}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <span title={`Drag ${domainTitle} to reorder it within ${industryName}`}>
              <GripVertical size={16} aria-hidden="true" />
            </span>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || isRenaming}
              title={`Remove ${domainTitle} from ${industryName}`}
              className="flex size-4 items-center justify-center rounded-md text-[#A1A1AA] transition hover:text-[#EF4444] disabled:cursor-not-allowed disabled:text-[#C7C7CC]"
              aria-label={`Remove ${domainTitle} from ${industryName}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function ScrollDownButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-2 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#86868B] shadow-[0_4px_14px_rgba(15,23,42,0.12)] transition hover:border-[#007AFF]/30 hover:text-[#007AFF]"
      aria-label={label}
      title={label}
    >
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );
}

function updateScrollDownState(
  listRef: RefObject<HTMLDivElement | null>,
  setCanScrollDown: (value: boolean) => void,
) {
  window.requestAnimationFrame(() => {
    const listElement = listRef.current;

    if (!listElement) {
      setCanScrollDown(false);
      return;
    }

    const remainingScroll =
      listElement.scrollHeight - listElement.clientHeight - listElement.scrollTop;

    setCanScrollDown(remainingScroll > 2);
  });
}

function ColumnHeader({
  children,
  label,
  meta,
}: {
  children?: ReactNode;
  label: string;
  meta?: string;
}) {
  return (
    <div className="min-h-12 border-b border-black/[0.06]">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] leading-4 font-bold tracking-[0.08em] text-[#86868B] uppercase">
          {label}
        </p>
        {children ? <div className="flex shrink-0 items-center">{children}</div> : null}
      </div>
      {meta ? <p className="mt-1 text-xs leading-4 font-semibold text-[#A1A1AA]">{meta}</p> : null}
    </div>
  );
}

function IndustryDomainRelationTable({
  domains,
  industries,
  isMappingDomain,
  isRenamingDomain,
  libraries,
  onMapDomain,
  onRenameDomain,
}: {
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  isMappingDomain: boolean;
  isRenamingDomain: boolean;
  libraries: DictionaryLibrary[];
  onMapDomain: (industryId: string, domainId: string) => Promise<void>;
  onRenameDomain: (domain: DictionaryDomain, trigger: HTMLButtonElement) => void;
}) {
  const [mappingCellKey, setMappingCellKey] = useState("");
  const mappedDomainsByIndustryId = useMemo(() => {
    const mappings = new Map<
      string,
      Map<string, DictionaryDomain & { key: string; processCount: number }>
    >();

    industries.forEach((industry) => {
      mappings.set(
        industry.id,
        new Map(
          getMappedDomainsForIndustry(industry.id, domains, libraries).map((domain) => [
            domain.key,
            domain,
          ]),
        ),
      );
    });

    return mappings;
  }, [domains, industries, libraries]);

  async function mapRelationDomain(industryId: string, domainId: string) {
    const cellKey = getRelationCellKey(industryId, domainId);

    try {
      setMappingCellKey(cellKey);
      await onMapDomain(industryId, domainId);
    } finally {
      setMappingCellKey("");
    }
  }

  if (industries.length === 0 || domains.length === 0) {
    return <EmptyState label="Add industries and domains to see the relation table." />;
  }

  return (
    <div
      className="overflow-hidden rounded-md border border-black/[0.08] bg-white"
      style={mappingColumnStyle}
    >
      <div className="max-h-[420px] max-w-full overflow-auto">
        <table
          aria-label="Industry and domain relationship table"
          title="Industry and domain relationship table"
          className="w-full min-w-[760px] border-collapse text-left sm:min-w-[920px]"
        >
          <thead className="sticky top-0 z-10 bg-[#FAFAFA]">
            <tr>
              <th className="sticky left-0 z-30 w-[170px] min-w-[170px] border border-black/[0.1] bg-[#FAFAFA] px-3 py-3 text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase sm:w-[220px] sm:min-w-[220px] sm:px-4">
                Industry
              </th>
              {domains.map((domain) => (
                <th
                  key={domain.id}
                  title={`Domain column: ${getDomainDisplayTitle(domain.name)}`}
                  className="min-w-[150px] border border-black/[0.1] bg-[#FAFAFA] px-3 py-3 text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase sm:min-w-[190px] sm:px-4"
                >
                  <button
                    type="button"
                    onClick={(event) => onRenameDomain(domain, event.currentTarget)}
                    disabled={isRenamingDomain}
                    className="rounded-sm text-left transition outline-none hover:text-[#007AFF] focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 disabled:cursor-wait"
                    aria-label={`Rename ${getDomainDisplayTitle(domain.name)} display name`}
                  >
                    {getDomainDisplayTitle(domain.name)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {industries.map((industry) => {
              const mappedDomains = mappedDomainsByIndustryId.get(industry.id) ?? new Map();

              return (
                <tr key={industry.id}>
                  <th
                    className="sticky left-0 z-20 w-[170px] min-w-[170px] border border-black/[0.1] bg-white px-3 py-3 align-top sm:w-[220px] sm:min-w-[220px] sm:px-4"
                    title={`${industry.name}: ${mappedDomains.size} mapped ${mappedDomains.size === 1 ? "domain" : "domains"}`}
                  >
                    <p className="text-sm leading-5 font-bold text-[#171717]">{industry.name}</p>
                    <p className="text-xs leading-4 font-semibold text-[#86868B]">
                      {mappedDomains.size} domains
                    </p>
                  </th>
                  {domains.map((domain) => {
                    const mappedDomain = mappedDomains.get(getDomainIdentity(domain));
                    const isMappingCell =
                      mappingCellKey === getRelationCellKey(industry.id, domain.id);

                    return (
                      <td
                        key={`${industry.id}-${domain.id}`}
                        title={
                          mappedDomain
                            ? `${getDomainDisplayTitle(mappedDomain.name)} is mapped to ${industry.name}`
                            : `Map ${getDomainDisplayTitle(domain.name)} to ${industry.name}`
                        }
                        className={`h-[74px] min-w-[150px] border border-black/[0.1] px-3 py-3 align-top transition sm:min-w-[190px] sm:px-4 ${
                          isMappingCell ? "bg-[#EAF3FF]" : "bg-white"
                        }`}
                      >
                        {mappedDomain ? (
                          <div>
                            <button
                              type="button"
                              onClick={(event) => onRenameDomain(mappedDomain, event.currentTarget)}
                              disabled={isRenamingDomain}
                              className="inline-flex max-w-full items-center rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[11px] font-bold text-[#007AFF]"
                              title={`${getDomainDisplayTitle(mappedDomain.name)} is mapped to ${industry.name}`}
                              aria-label={`Rename ${getDomainDisplayTitle(mappedDomain.name)} display name`}
                            >
                              <span className="truncate">
                                {getDomainDisplayTitle(mappedDomain.name)}
                              </span>
                            </button>
                            <p className="mt-1 text-xs font-semibold text-[#86868B]">
                              {mappedDomain.processCount} processes
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void mapRelationDomain(industry.id, domain.id)}
                            disabled={isMappingDomain}
                            className="flex size-8 items-center justify-center rounded-md text-lg leading-none font-bold text-[#86868B] transition hover:bg-[#F0F8FF] disabled:cursor-not-allowed disabled:text-[#C7C7CC]"
                            aria-label={`Map ${getDomainDisplayTitle(domain.name)} to ${industry.name}`}
                            title={`Map ${getDomainDisplayTitle(domain.name)} to ${industry.name}`}
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndustryDomainSkeleton() {
  return (
    <div className={mappingGridClassName}>
      {[0, 1, 2].map((section) => (
        <div key={section} className={mappingPanelClassName}>
          <div className="min-h-8 border-b border-black/[0.06]">
            <div className="flex min-h-5 items-center justify-between gap-3">
              <div className="h-3 w-28 animate-pulse rounded bg-[#F0F0F0]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#F5F5F7]" />
            </div>
          </div>
          <div className="mt-2 h-9">
            <div className="h-9 animate-pulse rounded-md border border-black/[0.06] bg-[#F8F8FA]" />
          </div>
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-10 animate-pulse rounded-md bg-[#F5F5F7]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
