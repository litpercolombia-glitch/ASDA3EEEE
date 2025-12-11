// ============================================
// LITPER - GUIDE FILTER PANEL
// Panel de Filtros Inteligentes para Guías
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  Filter,
  Search,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Clock,
  MapPin,
  Truck,
  Tag,
  DollarSign,
  RefreshCw,
  Bookmark,
  Plus,
} from 'lucide-react';
import { CarrierName, ShipmentStatus } from '../../types';
import {
  GuideFilters,
  SavedView,
  DEFAULT_SAVED_VIEWS,
} from '../../types/intelligenceModule';
import {
  loadSavedViews,
  saveCustomView,
  deleteCustomView,
} from '../../services/guideLinkingService';

interface GuideFilterPanelProps {
  filters: GuideFilters;
  onFiltersChange: (filters: GuideFilters) => void;
  resultCount: number;
  onReset: () => void;
}

const initialFilters: GuideFilters = {
  estados: [],
  transportadoras: [],
  fechaInicio: undefined,
  fechaFin: undefined,
  ciudadOrigen: undefined,
  ciudadDestino: undefined,
  tieneNovedad: undefined,
  numeroGuia: undefined,
  diasSinMovimiento: undefined,
  scoreRiesgo: undefined,
  intentosEntrega: undefined,
  tiposNovedad: undefined,
  rangoRecaudo: undefined,
  vertical: undefined,
  soloUrgentes: undefined,
  soloPuntoDropo: undefined,
  soloRiesgoDevolucion: undefined,
};

const CARRIERS = [
  { value: CarrierName.COORDINADORA, label: 'Coordinadora' },
  { value: CarrierName.INTER_RAPIDISIMO, label: 'Inter Rapidísimo' },
  { value: CarrierName.ENVIA, label: 'Envía' },
  { value: CarrierName.TCC, label: 'TCC' },
  { value: CarrierName.VELOCES, label: 'Veloces' },
];

const STATUSES = [
  { value: ShipmentStatus.PENDING, label: 'Pendiente', color: 'bg-gray-100 text-gray-700' },
  { value: ShipmentStatus.IN_TRANSIT, label: 'En Tránsito', color: 'bg-blue-100 text-blue-700' },
  { value: ShipmentStatus.IN_OFFICE, label: 'En Oficina', color: 'bg-amber-100 text-amber-700' },
  { value: ShipmentStatus.DELIVERED, label: 'Entregado', color: 'bg-green-100 text-green-700' },
  { value: ShipmentStatus.ISSUE, label: 'Novedad', color: 'bg-red-100 text-red-700' },
];

const VERTICALS = [
  { value: 'Home', label: 'Home & Deco' },
  { value: 'Fashion', label: 'Moda' },
  { value: 'Tech', label: 'Tecnología' },
  { value: 'Beauty', label: 'Belleza' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Other', label: 'Otros' },
];

export const GuideFilterPanel: React.FC<GuideFilterPanelProps> = ({
  filters,
  onFiltersChange,
  resultCount,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadSavedViews);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewIcon, setNewViewIcon] = useState('📌');

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.estados?.length) count++;
    if (filters.transportadoras?.length) count++;
    if (filters.fechaInicio || filters.fechaFin) count++;
    if (filters.ciudadDestino) count++;
    if (filters.ciudadOrigen) count++;
    if (filters.tieneNovedad !== undefined) count++;
    if (filters.numeroGuia) count++;
    if (filters.diasSinMovimiento) count++;
    if (filters.scoreRiesgo) count++;
    if (filters.intentosEntrega?.length) count++;
    if (filters.rangoRecaudo) count++;
    if (filters.soloUrgentes) count++;
    if (filters.soloPuntoDropo) count++;
    if (filters.soloRiesgoDevolucion) count++;
    return count;
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof GuideFilters>(
    key: K,
    value: GuideFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const toggleArrayFilter = useCallback(<T extends string>(
    key: keyof GuideFilters,
    value: T,
    currentArray: T[] = []
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  }, [updateFilter]);

  const handleSaveView = useCallback(() => {
    if (!newViewName.trim()) return;

    const view = saveCustomView({
      name: newViewName.trim(),
      icon: newViewIcon,
      filters: { ...filters },
    });

    setSavedViews(loadSavedViews());
    setShowSaveModal(false);
    setNewViewName('');
  }, [newViewName, newViewIcon, filters]);

  const handleDeleteView = useCallback((viewId: string) => {
    if (deleteCustomView(viewId)) {
      setSavedViews(loadSavedViews());
    }
  }, []);

  const handleApplyView = useCallback((view: SavedView) => {
    onFiltersChange(view.filters);
  }, [onFiltersChange]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm text-gray-700">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
              {activeFilterCount} activos
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {resultCount.toLocaleString()} resultados
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Quick Views */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase">Vistas Rápidas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedViews.map(view => (
                <button
                  key={view.id}
                  onClick={() => handleApplyView(view)}
                  className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  <span>{view.icon}</span>
                  <span className="text-gray-700">{view.name}</span>
                  {!view.isSystem && (
                    <X
                      className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteView(view.id);
                      }}
                    />
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Guardar Vista
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número de guía..."
                value={filters.numeroGuia || ''}
                onChange={(e) => updateFilter('numeroGuia', e.target.value || undefined)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Basic Filters */}
          <div className="p-3 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                <Tag className="w-3.5 h-3.5" />
                Estado
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(status => (
                  <button
                    key={status.value}
                    onClick={() => toggleArrayFilter('estados', status.value, filters.estados)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      filters.estados?.includes(status.value)
                        ? status.color + ' ring-2 ring-offset-1 ring-gray-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Carrier Filter */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                <Truck className="w-3.5 h-3.5" />
                Transportadora
              </label>
              <div className="flex flex-wrap gap-2">
                {CARRIERS.map(carrier => (
                  <button
                    key={carrier.value}
                    onClick={() => toggleArrayFilter('transportadoras', carrier.value, filters.transportadoras)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      filters.transportadoras?.includes(carrier.value)
                        ? 'bg-orange-100 text-orange-700 ring-2 ring-offset-1 ring-orange-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {carrier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Desde</label>
                <input
                  type="date"
                  value={filters.fechaInicio || ''}
                  onChange={(e) => updateFilter('fechaInicio', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Hasta</label>
                <input
                  type="date"
                  value={filters.fechaFin || ''}
                  onChange={(e) => updateFilter('fechaFin', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Location Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1">
                  <MapPin className="w-3 h-3" />
                  Ciudad Origen
                </label>
                <input
                  type="text"
                  placeholder="Ej: Bogotá"
                  value={filters.ciudadOrigen || ''}
                  onChange={(e) => updateFilter('ciudadOrigen', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1">
                  <MapPin className="w-3 h-3" />
                  Ciudad Destino
                </label>
                <input
                  type="text"
                  placeholder="Ej: Medellín"
                  value={filters.ciudadDestino || ''}
                  onChange={(e) => updateFilter('ciudadDestino', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('soloUrgentes', !filters.soloUrgentes)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.soloUrgentes
                    ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Solo Urgentes
              </button>
              <button
                onClick={() => updateFilter('soloPuntoDropo', !filters.soloPuntoDropo)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.soloPuntoDropo
                    ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Punto Droop
              </button>
              <button
                onClick={() => updateFilter('soloRiesgoDevolucion', !filters.soloRiesgoDevolucion)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.soloRiesgoDevolucion
                    ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Riesgo Devolución
              </button>
              <button
                onClick={() => updateFilter('tieneNovedad', filters.tieneNovedad === undefined ? true : filters.tieneNovedad ? false : undefined)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.tieneNovedad === true
                    ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200'
                    : filters.tieneNovedad === false
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {filters.tieneNovedad === true ? 'Con Novedad' : filters.tieneNovedad === false ? 'Sin Novedad' : 'Novedades'}
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Ocultar filtros avanzados
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Mostrar filtros avanzados
                </>
              )}
            </button>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="pt-3 border-t border-gray-100 space-y-4">
                {/* Days without movement */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    Días sin movimiento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      placeholder="Mín"
                      value={filters.diasSinMovimiento?.min || ''}
                      onChange={(e) => updateFilter('diasSinMovimiento', {
                        min: parseInt(e.target.value) || 0,
                        max: filters.diasSinMovimiento?.max || 30,
                      })}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      placeholder="Máx"
                      value={filters.diasSinMovimiento?.max || ''}
                      onChange={(e) => updateFilter('diasSinMovimiento', {
                        min: filters.diasSinMovimiento?.min || 0,
                        max: parseInt(e.target.value) || 30,
                      })}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <span className="text-xs text-gray-500">días</span>
                  </div>
                </div>

                {/* Risk Score */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Score de Riesgo (0-100)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={filters.scoreRiesgo?.min || 0}
                      onChange={(e) => updateFilter('scoreRiesgo', {
                        min: parseInt(e.target.value),
                        max: filters.scoreRiesgo?.max || 100,
                      })}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {filters.scoreRiesgo?.min || 0}+
                    </span>
                  </div>
                </div>

                {/* Delivery Attempts */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                    <Truck className="w-3.5 h-3.5" />
                    Intentos de Entrega
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(n => (
                      <button
                        key={n}
                        onClick={() => toggleArrayFilter('intentosEntrega', n, filters.intentosEntrega?.map(String).map(Number))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filters.intentosEntrega?.includes(n)
                            ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {n === 3 ? '3+' : n} {n === 1 ? 'intento' : 'intentos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collection Value Range */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                    <DollarSign className="w-3.5 h-3.5" />
                    Valor Recaudo (COP)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={filters.rangoRecaudo?.min || ''}
                      onChange={(e) => updateFilter('rangoRecaudo', {
                        min: parseInt(e.target.value) || 0,
                        max: filters.rangoRecaudo?.max || 10000000,
                      })}
                      className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={filters.rangoRecaudo?.max || ''}
                      onChange={(e) => updateFilter('rangoRecaudo', {
                        min: filters.rangoRecaudo?.min || 0,
                        max: parseInt(e.target.value) || 10000000,
                      })}
                      className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Vertical */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Vertical</label>
                  <div className="flex flex-wrap gap-2">
                    {VERTICALS.map(v => (
                      <button
                        key={v.value}
                        onClick={() => toggleArrayFilter('vertical', v.value, filters.vertical)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          filters.vertical?.includes(v.value)
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar Filtros
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar Vista
            </button>
          </div>
        </div>
      )}

      {/* Save View Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Guardar Vista</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="Ej: Mis guías críticas"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Icono</label>
                <div className="flex gap-2">
                  {['📌', '⭐', '🔥', '💎', '🎯', '📍', '🚨', '💰'].map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewViewIcon(icon)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        newViewIcon === icon
                          ? 'bg-orange-100 ring-2 ring-orange-300'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveView}
                disabled={!newViewName.trim()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideFilterPanel;
