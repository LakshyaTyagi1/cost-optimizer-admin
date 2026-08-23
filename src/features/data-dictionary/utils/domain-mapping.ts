import type {
  DictionaryDomain,
  DictionaryIndustry,
  DictionaryLibrary,
} from "@/features/data-dictionary/model";

export type MappedDictionaryDomain = DictionaryDomain & {
  key: string;
  processCount: number;
};

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getDomainIdentity(domain: DictionaryDomain) {
  return domain.slug || toSlug(domain.name);
}

export function getRelationCellKey(industryId: string, domainId: string) {
  return `${industryId}:${domainId}`;
}

export function getDomainDisplayTitle(name: string) {
  const normalizedName = toSlug(name);
  const expandedNames: Record<string, string> = {
    cx: "Customer Experience (CX)",
    hr: "Human Resources (HR)",
    "it-ops": "IT Operations (IT Ops)",
    mktg: "Marketing (Mktg)",
  };

  return expandedNames[normalizedName] || name;
}

export function orderItemsByKey<T>(items: T[], order: string[], getKey: (item: T) => string) {
  const itemByKey = new Map(items.map((item) => [getKey(item), item]));
  const orderedItems = order
    .map((key) => itemByKey.get(key))
    .filter((item): item is T => Boolean(item));
  const orderedKeys = new Set(order);
  const unorderedItems = items.filter((item) => !orderedKeys.has(getKey(item)));

  return [...orderedItems, ...unorderedItems];
}

export function orderItemsByDisplayOrder<T extends { displayOrder?: number }>(items: T[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((firstItem, secondItem) => {
      const firstOrder = getPositiveDisplayOrder(firstItem.item.displayOrder);
      const secondOrder = getPositiveDisplayOrder(secondItem.item.displayOrder);

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return firstItem.index - secondItem.index;
    })
    .map(({ item }) => item);
}

export function getPositiveDisplayOrder(displayOrder?: number) {
  const value = Number(displayOrder);

  return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

export function reorderItemKeys(
  itemKeys: string[],
  currentOrder: string[],
  draggedKey: string,
  targetKey: string,
) {
  const nextOrder = orderItemsByKey(itemKeys, currentOrder, (key) => key);
  const draggedIndex = nextOrder.indexOf(draggedKey);
  const targetIndex = nextOrder.indexOf(targetKey);

  if (draggedIndex < 0 || targetIndex < 0) {
    return currentOrder;
  }

  nextOrder.splice(draggedIndex, 1);
  nextOrder.splice(targetIndex, 0, draggedKey);

  return nextOrder;
}

export function isUsableLibrary(
  library: DictionaryLibrary | null | undefined,
): library is DictionaryLibrary {
  return Boolean(library?.industryId && library?.domainId);
}

export function getLibraryIdentity(library: DictionaryLibrary | null | undefined) {
  if (!library) {
    return "";
  }

  return library.domainSlug || toSlug(library.domainName || "") || library.domainId || "";
}

export function getUniqueDomains(domains: DictionaryDomain[]) {
  const domainByKey = new Map<string, DictionaryDomain>();

  domains.forEach((domain) => {
    const domainKey = getDomainIdentity(domain);
    const existingDomain = domainByKey.get(domainKey);

    if (!domainKey) {
      return;
    }

    if (!existingDomain) {
      domainByKey.set(domainKey, { ...domain, industryIds: [...domain.industryIds] });
      return;
    }

    domainByKey.set(domainKey, {
      ...existingDomain,
      industryIds: Array.from(new Set([...existingDomain.industryIds, ...domain.industryIds])),
    });
  });

  return orderItemsByDisplayOrder(Array.from(domainByKey.values()));
}

export function getDomainCountByIndustry(
  industries: DictionaryIndustry[],
  domains: DictionaryDomain[],
  libraries: DictionaryLibrary[],
) {
  const counts = new Map<string, number>();

  industries.forEach((industry) => {
    const domainKeys = new Set<string>();
    libraries
      .filter(
        (library) =>
          isUsableLibrary(library) &&
          library.industryId === industry.id &&
          library.isActive !== false,
      )
      .forEach((library) => {
        const domainKey = getLibraryIdentity(library);

        if (domainKey) {
          domainKeys.add(domainKey);
        }
      });

    if (domainKeys.size === 0) {
      domains
        .filter((domain) => domain.industryIds.includes(industry.id))
        .forEach((domain) => domainKeys.add(getDomainIdentity(domain)));
    }

    counts.set(industry.id, domainKeys.size);
  });

  return counts;
}

export function getIndustryUsageByDomainKey(
  domains: DictionaryDomain[],
  libraries: DictionaryLibrary[],
) {
  const industryIdsByDomainKey = new Map<string, Set<string>>();

  domains.forEach((domain) => {
    const domainKey = getDomainIdentity(domain);

    if (!domainKey) {
      return;
    }

    const industryIds = industryIdsByDomainKey.get(domainKey) ?? new Set<string>();
    domain.industryIds.forEach((industryId) => industryIds.add(industryId));
    industryIdsByDomainKey.set(domainKey, industryIds);
  });

  libraries
    .filter((library) => isUsableLibrary(library) && library.isActive !== false)
    .forEach((library) => {
      const domainKey = getLibraryIdentity(library);

      if (!domainKey) {
        return;
      }

      const industryIds = industryIdsByDomainKey.get(domainKey) ?? new Set<string>();
      industryIds.add(library.industryId);
      industryIdsByDomainKey.set(domainKey, industryIds);
    });

  return new Map(
    Array.from(industryIdsByDomainKey.entries()).map(([domainKey, industryIds]) => [
      domainKey,
      industryIds.size,
    ]),
  );
}

export function getMappedDomainsForIndustry(
  industryId: string,
  domains: DictionaryDomain[],
  libraries: DictionaryLibrary[],
) {
  if (!industryId) {
    return [];
  }

  const mappedLibraries = libraries.filter(
    (library) =>
      isUsableLibrary(library) && library.industryId === industryId && library.isActive !== false,
  );
  const libraryByKey = new Map<string, DictionaryLibrary>();
  mappedLibraries.forEach((library) => {
    const domainKey = getLibraryIdentity(library);

    if (domainKey) {
      libraryByKey.set(domainKey, library);
    }
  });
  const domainByKey = new Map<string, DictionaryDomain>();
  domains
    .filter((domain) => domain.industryIds.includes(industryId))
    .forEach((domain) => {
      const domainKey = getDomainIdentity(domain);

      if (!domainKey || domainByKey.has(domainKey)) {
        return;
      }

      domainByKey.set(domainKey, domain);
    });

  const mappedDomainByKey = new Map<string, MappedDictionaryDomain>();
  mappedLibraries.forEach((library) => {
    const domainKey = getLibraryIdentity(library);
    const domain = domainByKey.get(domainKey);

    if (!domainKey || mappedDomainByKey.has(domainKey)) {
      return;
    }

    mappedDomainByKey.set(domainKey, {
      ...(domain ?? {
        id: library.domainId,
        industryIds: [industryId],
        isActive: library.isActive,
        name: library.domainName,
        slug: domainKey,
      }),
      displayOrder: library.displayOrder || domain?.displayOrder || 0,
      id: library.domainId || domain?.id || domainKey,
      industryIds: domain?.industryIds.includes(industryId)
        ? domain.industryIds
        : [...(domain?.industryIds ?? []), industryId],
      isActive: domain?.isActive ?? library.isActive,
      key: domainKey,
      name: domain?.name || library.domainName,
      processCount: library.processCount ?? 0,
      slug: domain?.slug || domainKey,
    });
  });

  domainByKey.forEach((domain, domainKey) => {
    if (mappedDomainByKey.has(domainKey)) {
      return;
    }

    mappedDomainByKey.set(domainKey, {
      ...domain,
      key: domainKey,
      processCount: libraryByKey.get(domainKey)?.processCount ?? 0,
    });
  });

  return orderItemsByDisplayOrder(Array.from(mappedDomainByKey.values()));
}

export function toDisplayName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
