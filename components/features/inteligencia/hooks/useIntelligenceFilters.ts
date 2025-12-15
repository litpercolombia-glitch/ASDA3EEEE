/**
 * USE INTELLIGENCE FILTERS HOOK
 *
 * Hook para manejar filtros de inteligencia logistica.
 */

import { useState, useCallback, useMemo } from 'react';
import { IntelligenceFilters } from '../types';
import { Shipment } from '../../../../types';

const DEFAULT_FILTERS: IntelligenceFilters = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atras
    end: new Date(),
  },
  carriers: [],
  status: [],
  cities: [],
  riskLevel: [],
};

interface UseIntelligenceFiltersProps {
  shipments: Shipment[];
  initialFilters?: Partial<IntelligenceFilters>;
}

interface UseIntelligenceFiltersReturn {
  // Current filters
  filters: IntelligenceFilters;

  // Filtered data
  filteredShipments: Shipment[];

  // Available options
  availableCarriers: string[];
  availableCities: string[];
  availableStatuses: string[];

  // Actions
  setFilter: <K extends keyof IntelligenceFilters>(
    key: K,
    value: IntelligenceFilters[K]
  ) => void;
  setFilters: (filters: Partial<IntelligenceFilters>) => void;
  resetFilters: () => void;
  clearFilter: (key: keyof IntelligenceFilters) => void;

  // Helpers
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export function useIntelligenceFilters({
  shipments,
  initialFilters,
}: UseIntelligenceFiltersProps): UseIntelligenceFiltersReturn {
  const [filters, setFiltersState] = useState<IntelligenceFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Extraer opciones disponibles de los shipments
  const availableCarriers = useMemo(() => {
    const carriers = new Set<string>();
    shipments.forEach((s) => {
      if (s.carrier) carriers.add(s.carrier);
    });
    return Array.from(carriers).sort();
  }, [shipments]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    shipments.forEach((s) => {
      if (s.detailedInfo?.destination) {
        cities.add(s.detailedInfo.destination);
      }
    });
    return Array.from(cities).sort();
  }, [shipments]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    shipments.forEach((s) => {
      if (s.status) statuses.add(s.status);
    });
    return Array.from(statuses).sort();
  }, [shipments]);

  // Aplicar filtros a los shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      // Filtro por carriers
      if (filters.carriers.length > 0) {
        if (!shipment.carrier || !filters.carriers.includes(shipment.carrier)) {
          return false;
        }
      }

      // Filtro por status
      if (filters.status.length > 0) {
        if (!shipment.status || !filters.status.includes(shipment.status)) {
          return false;
        }
      }

      // Filtro por cities
      if (filters.cities.length > 0) {
        const city = shipment.detailedInfo?.destination;
        if (!city || !filters.cities.includes(city)) {
          return false;
        }
      }

      // Filtro por riskLevel
      if (filters.riskLevel.length > 0) {
        const days = shipment.detailedInfo?.daysInTransit || 0;
        const hasIssue = shipment.status === 'issue';
        const level = hasIssue || days > 5 ? 'high' : days > 3 ? 'medium' : 'low';
        if (!filters.riskLevel.includes(level)) {
          return false;
        }
      }

      return true;
    });
  }, [shipments, filters]);

  // Actions
  const setFilter = useCallback(
    <K extends keyof IntelligenceFilters>(key: K, value: IntelligenceFilters[K]) => {
      setFiltersState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const setFilters = useCallback((newFilters: Partial<IntelligenceFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const clearFilter = useCallback((key: keyof IntelligenceFilters) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: DEFAULT_FILTERS[key],
    }));
  }, []);

  // Helpers
  const hasActiveFilters = useMemo(() => {
    return (
      filters.carriers.length > 0 ||
      filters.status.length > 0 ||
      filters.cities.length > 0 ||
      filters.riskLevel.length > 0
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.carriers.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.cities.length > 0) count++;
    if (filters.riskLevel.length > 0) count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredShipments,
    availableCarriers,
    availableCities,
    availableStatuses,
    setFilter,
    setFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
  };
}

export default useIntelligenceFilters;
