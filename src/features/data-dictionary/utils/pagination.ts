export function getPaginationPages(totalPages: number, currentPage: number) {
  if (totalPages <= 1) {
    return [];
  }

  const pageCount = Math.min(totalPages, 5);
  const startPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - pageCount + 1),
  );

  return Array.from({ length: pageCount }, (_, index) => startPage + index);
}

