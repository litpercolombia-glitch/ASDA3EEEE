// hooks/usePagination.ts
// Hook de paginación para guías

import { useState, useMemo, useCallback, useEffect } from 'react';

export type PageSize = 50 | 100;

export interface PaginationState<T> {
  // Datos
  currentPage: number;
  pageSize: PageSize;
  totalItems: number;
  totalPages: number;
  paginatedItems: T[];

  // Info
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // Acciones
  setPage: (page: number) => void;
  setPageSize: (size: PageSize) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;

  // Números de página para mostrar
  pageNumbers: number[];
}

const STORAGE_KEY = 'litper_page_size_preference';

export function usePagination<T>(
  items: T[],
  initialPageSize: PageSize = 50
): PaginationState<T> {
  // Recuperar preferencia guardada
  const savedPageSize = typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY)
    : null;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<PageSize>(
    savedPageSize ? (parseInt(savedPageSize) as PageSize) : initialPageSize
  );

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Calcular índices
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Obtener items de la página actual
  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Navegación
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const setPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const setPageSize = useCallback((size: PageSize) => {
    setPageSizeState(size);
    localStorage.setItem(STORAGE_KEY, size.toString());
    // Recalcular página actual para mantener posición aproximada
    const currentFirstItem = (currentPage - 1) * pageSize;
    const newPage = Math.floor(currentFirstItem / size) + 1;
    setCurrentPage(Math.max(1, newPage));
  }, [currentPage, pageSize]);

  const nextPage = useCallback(() => {
    if (hasNextPage) setCurrentPage(prev => prev + 1);
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) setCurrentPage(prev => prev - 1);
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => setCurrentPage(1), []);
  const lastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);

  // Generar números de página para mostrar (máximo 7)
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar con elipsis
      if (currentPage <= 4) {
        // Inicio: 1 2 3 4 5 ... último
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // -1 = elipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Final: 1 ... últimos 5
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Medio: 1 ... actual-1, actual, actual+1 ... último
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Reset a página 1 cuando cambian los items
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalItems, totalPages, currentPage]);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    pageNumbers,
  };
}

export default usePagination;
