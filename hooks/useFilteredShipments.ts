// hooks/useFilteredShipments.ts
// Hook para filtrar guías/envíos

import { useMemo, useState, useCallback } from 'react';
import { GuiaCarga, FiltrosCarga } from '../types/carga.types';

export interface FilterOptions {
  busqueda?: string;
  estado?: string;
  transportadora?: string;
  ciudadDestino?: string;
  soloConNovedad?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  diasMinimo?: number;
  diasMaximo?: number;
}

export interface FilteredResult<T> {
  items: T[];
  totalFiltrados: number;
  totalOriginal: number;
  estadisticas: {
    porEstado: Record<string, number>;
    porTransportadora: Record<string, number>;
    porCiudad: Record<string, number>;
    conNovedad: number;
  };
  filtrosAplicados: string[];
}

export function useFilteredShipments<T extends GuiaCarga>(
  items: T[],
  filtrosIniciales: FilterOptions = {}
): {
  resultado: FilteredResult<T>;
  filtros: FilterOptions;
  setFiltro: (campo: keyof FilterOptions, valor: unknown) => void;
  setFiltros: (filtros: FilterOptions) => void;
  limpiarFiltros: () => void;
  buscar: (texto: string) => void;
} {
  const [filtros, setFiltrosState] = useState<FilterOptions>(filtrosIniciales);

  const resultado = useMemo(() => {
    let filtrados = [...items];
    const filtrosAplicados: string[] = [];

    // Búsqueda por texto (número de guía, nombre, teléfono)
    if (filtros.busqueda && filtros.busqueda.trim()) {
      const busquedaLower = filtros.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(
        (item) =>
          item.numeroGuia.toLowerCase().includes(busquedaLower) ||
          item.nombreCliente?.toLowerCase().includes(busquedaLower) ||
          item.telefono?.includes(busquedaLower) ||
          item.ciudadDestino?.toLowerCase().includes(busquedaLower)
      );
      filtrosAplicados.push(`Búsqueda: "${filtros.busqueda}"`);
    }

    // Filtro por estado
    if (filtros.estado) {
      const estadoLower = filtros.estado.toLowerCase();
      filtrados = filtrados.filter((item) =>
        item.estado.toLowerCase().includes(estadoLower)
      );
      filtrosAplicados.push(`Estado: ${filtros.estado}`);
    }

    // Filtro por transportadora
    if (filtros.transportadora) {
      filtrados = filtrados.filter(
        (item) =>
          item.transportadora.toLowerCase() === filtros.transportadora!.toLowerCase()
      );
      filtrosAplicados.push(`Transportadora: ${filtros.transportadora}`);
    }

    // Filtro por ciudad
    if (filtros.ciudadDestino) {
      filtrados = filtrados.filter(
        (item) =>
          item.ciudadDestino?.toLowerCase().includes(filtros.ciudadDestino!.toLowerCase())
      );
      filtrosAplicados.push(`Ciudad: ${filtros.ciudadDestino}`);
    }

    // Solo con novedad
    if (filtros.soloConNovedad) {
      filtrados = filtrados.filter((item) => item.tieneNovedad);
      filtrosAplicados.push('Solo con novedad');
    }

    // Filtro por días mínimos
    if (filtros.diasMinimo !== undefined) {
      filtrados = filtrados.filter((item) => item.diasTransito >= filtros.diasMinimo!);
      filtrosAplicados.push(`Días mínimo: ${filtros.diasMinimo}`);
    }

    // Filtro por días máximos
    if (filtros.diasMaximo !== undefined) {
      filtrados = filtrados.filter((item) => item.diasTransito <= filtros.diasMaximo!);
      filtrosAplicados.push(`Días máximo: ${filtros.diasMaximo}`);
    }

    // Calcular estadísticas
    const estadisticas = {
      porEstado: {} as Record<string, number>,
      porTransportadora: {} as Record<string, number>,
      porCiudad: {} as Record<string, number>,
      conNovedad: 0,
    };

    filtrados.forEach((item) => {
      // Por estado (normalizado)
      const estadoNormalizado = normalizarEstado(item.estado);
      estadisticas.porEstado[estadoNormalizado] =
        (estadisticas.porEstado[estadoNormalizado] || 0) + 1;

      // Por transportadora
      estadisticas.porTransportadora[item.transportadora] =
        (estadisticas.porTransportadora[item.transportadora] || 0) + 1;

      // Por ciudad
      if (item.ciudadDestino) {
        estadisticas.porCiudad[item.ciudadDestino] =
          (estadisticas.porCiudad[item.ciudadDestino] || 0) + 1;
      }

      // Con novedad
      if (item.tieneNovedad) {
        estadisticas.conNovedad++;
      }
    });

    return {
      items: filtrados,
      totalFiltrados: filtrados.length,
      totalOriginal: items.length,
      estadisticas,
      filtrosAplicados,
    };
  }, [items, filtros]);

  const setFiltro = useCallback((campo: keyof FilterOptions, valor: unknown) => {
    setFiltrosState((prev) => ({
      ...prev,
      [campo]: valor || undefined,
    }));
  }, []);

  const setFiltros = useCallback((nuevosFiltros: FilterOptions) => {
    setFiltrosState(nuevosFiltros);
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltrosState({});
  }, []);

  const buscar = useCallback((texto: string) => {
    setFiltrosState((prev) => ({
      ...prev,
      busqueda: texto,
    }));
  }, []);

  return {
    resultado,
    filtros,
    setFiltro,
    setFiltros,
    limpiarFiltros,
    buscar,
  };
}

// Normalizar estados para estadísticas
function normalizarEstado(estado: string): string {
  const lower = estado.toLowerCase();

  if (lower.includes('entregado')) return 'Entregado';
  if (lower.includes('tránsito') || lower.includes('transito')) return 'En Tránsito';
  if (lower.includes('reparto')) return 'En Reparto';
  if (lower.includes('novedad')) return 'Con Novedad';
  if (lower.includes('devuelto') || lower.includes('retorno')) return 'Devuelto';
  if (lower.includes('oficina') || lower.includes('sucursal')) return 'En Oficina';
  if (lower.includes('distribu')) return 'En Distribución';

  return 'Otro';
}

// Hook auxiliar para extraer opciones únicas
export function useFilterOptionsFromItems<T extends GuiaCarga>(items: T[]): {
  transportadoras: string[];
  ciudades: string[];
  estados: string[];
} {
  return useMemo(() => {
    const transportadorasSet = new Set<string>();
    const ciudadesSet = new Set<string>();
    const estadosSet = new Set<string>();

    items.forEach((item) => {
      if (item.transportadora) transportadorasSet.add(item.transportadora);
      if (item.ciudadDestino) ciudadesSet.add(item.ciudadDestino);
      estadosSet.add(normalizarEstado(item.estado));
    });

    return {
      transportadoras: Array.from(transportadorasSet).sort(),
      ciudades: Array.from(ciudadesSet).sort(),
      estados: Array.from(estadosSet).sort(),
    };
  }, [items]);
}

export default useFilteredShipments;
