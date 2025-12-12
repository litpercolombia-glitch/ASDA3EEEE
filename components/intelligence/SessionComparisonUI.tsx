// components/intelligence/SessionComparisonUI.tsx
// Comparador de sesiones para detectar guías estancadas, resueltas y nuevas

import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Package,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  Zap,
  X,
  ExternalLink,
  Copy,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';

interface GuiaLogistica {
  numeroGuia: string;
  telefono?: string;
  nombreCliente?: string;
  transportadora: string;
  ciudadDestino: string;
  estadoActual: string;
  diasTranscurridos: number;
  tieneNovedad: boolean;
  descripcionNovedad?: string;
}

interface SesionGuardada {
  id: string;
  fecha: string;
  hora: string;
  nombre: string;
  totalGuias: number;
  guias: GuiaLogistica[];
}

interface SessionComparisonUIProps {
  sesiones: SesionGuardada[];
  guiasActuales: GuiaLogistica[];
  onSendToRescue?: (guias: string[]) => void;
}

interface ComparisonResult {
  nuevas: GuiaLogistica[];           // En sesión actual, no en anterior
  resueltas: GuiaLogistica[];        // Tenían novedad antes, ahora no
  estancadas: GuiaLogistica[];       // Misma novedad en ambas sesiones
  cambioEstado: {                    // Cambió de estado pero no entregada
    guia: GuiaLogistica;
    estadoAnterior: string;
    estadoActual: string;
  }[];
  desaparecidas: GuiaLogistica[];    // Estaban antes, ahora no
  entregadas: GuiaLogistica[];       // Ahora están entregadas
}

export const SessionComparisonUI: React.FC<SessionComparisonUIProps> = ({
  sesiones,
  guiasActuales,
  onSendToRescue,
}) => {
  const [sesion1Id, setSesion1Id] = useState<string>('current');
  const [sesion2Id, setSesion2Id] = useState<string>(sesiones[0]?.id || '');
  const [expandedSection, setExpandedSection] = useState<string | null>('estancadas');
  const [selectedGuias, setSelectedGuias] = useState<Set<string>>(new Set());

  // Obtener guías de cada sesión
  const getSesionGuias = (id: string): GuiaLogistica[] => {
    if (id === 'current') return guiasActuales;
    const sesion = sesiones.find(s => s.id === id);
    return sesion?.guias || [];
  };

  // Comparar sesiones
  const comparison = useMemo((): ComparisonResult | null => {
    if (!sesion2Id) return null;

    const guias1 = getSesionGuias(sesion1Id); // Actual/Nueva
    const guias2 = getSesionGuias(sesion2Id); // Anterior

    const guias1Map = new Map(guias1.map(g => [g.numeroGuia, g]));
    const guias2Map = new Map(guias2.map(g => [g.numeroGuia, g]));

    const nuevas: GuiaLogistica[] = [];
    const resueltas: GuiaLogistica[] = [];
    const estancadas: GuiaLogistica[] = [];
    const cambioEstado: ComparisonResult['cambioEstado'] = [];
    const desaparecidas: GuiaLogistica[] = [];
    const entregadas: GuiaLogistica[] = [];

    // Analizar guías actuales
    guias1.forEach(guia => {
      const guiaAnterior = guias2Map.get(guia.numeroGuia);

      if (!guiaAnterior) {
        // Nueva guía
        nuevas.push(guia);
      } else {
        // Existía antes
        const esEntregada = guia.estadoActual.toLowerCase().includes('entregad');
        const eraEntregada = guiaAnterior.estadoActual.toLowerCase().includes('entregad');

        if (esEntregada && !eraEntregada) {
          entregadas.push(guia);
        } else if (guiaAnterior.tieneNovedad && !guia.tieneNovedad) {
          // Tenía novedad y ya no
          resueltas.push(guia);
        } else if (guiaAnterior.tieneNovedad && guia.tieneNovedad) {
          // Sigue con novedad
          estancadas.push(guia);
        } else if (guiaAnterior.estadoActual !== guia.estadoActual) {
          // Cambió de estado
          cambioEstado.push({
            guia,
            estadoAnterior: guiaAnterior.estadoActual,
            estadoActual: guia.estadoActual,
          });
        }
      }
    });

    // Analizar guías que desaparecieron
    guias2.forEach(guia => {
      if (!guias1Map.has(guia.numeroGuia)) {
        desaparecidas.push(guia);
      }
    });

    return { nuevas, resueltas, estancadas, cambioEstado, desaparecidas, entregadas };
  }, [sesion1Id, sesion2Id, guiasActuales, sesiones]);

  const toggleGuiaSelection = (numeroGuia: string) => {
    const newSet = new Set(selectedGuias);
    if (newSet.has(numeroGuia)) {
      newSet.delete(numeroGuia);
    } else {
      newSet.add(numeroGuia);
    }
    setSelectedGuias(newSet);
  };

  const selectAllStuck = () => {
    if (comparison) {
      const allStuck = new Set(comparison.estancadas.map(g => g.numeroGuia));
      setSelectedGuias(allStuck);
    }
  };

  const sendSelectedToRescue = () => {
    if (onSendToRescue && selectedGuias.size > 0) {
      onSendToRescue(Array.from(selectedGuias));
      setSelectedGuias(new Set());
    }
  };

  if (sesiones.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          Sin sesiones para comparar
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Guarda al menos una sesión para poder compararla con los datos actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de sesiones */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Comparador de Sesiones</h3>
            <p className="text-sm opacity-90">Detecta guías estancadas, resueltas y cambios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs mb-1 opacity-80">Sesión actual</label>
            <select
              value={sesion1Id}
              onChange={(e) => setSesion1Id(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-sm focus:outline-none focus:border-white"
            >
              <option value="current" className="text-slate-800">📍 Datos actuales ({guiasActuales.length} guías)</option>
              {sesiones.map(s => (
                <option key={s.id} value={s.id} className="text-slate-800">
                  {s.nombre} ({s.totalGuias} guías)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <div className="p-2 bg-white/20 rounded-full">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-80">Comparar con</label>
            <select
              value={sesion2Id}
              onChange={(e) => setSesion2Id(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 text-white text-sm focus:outline-none focus:border-white"
            >
              <option value="" className="text-slate-800">Seleccionar sesión...</option>
              {sesiones.map(s => (
                <option key={s.id} value={s.id} className="text-slate-800">
                  {s.nombre} ({s.totalGuias} guías)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {comparison && (
        <>
          {/* Stats rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: 'Estancadas', value: comparison.estancadas.length, icon: AlertTriangle, color: 'red', desc: 'Misma novedad' },
              { label: 'Resueltas', value: comparison.resueltas.length, icon: CheckCircle, color: 'emerald', desc: 'Ya no tienen novedad' },
              { label: 'Entregadas', value: comparison.entregadas.length, icon: Package, color: 'green', desc: 'Completadas' },
              { label: 'Nuevas', value: comparison.nuevas.length, icon: TrendingUp, color: 'blue', desc: 'No existían antes' },
              { label: 'Cambio estado', value: comparison.cambioEstado.length, icon: RefreshCw, color: 'amber', desc: 'Movimiento parcial' },
              { label: 'Desaparecidas', value: comparison.desaparecidas.length, icon: TrendingDown, color: 'slate', desc: 'Ya no están' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-3 cursor-pointer transition-all hover:shadow-md ${
                  expandedSection === stat.label.toLowerCase() ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setExpandedSection(expandedSection === stat.label.toLowerCase() ? null : stat.label.toLowerCase())}
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                </div>
                <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-slate-400">{stat.desc}</p>
              </div>
            ))}
          </div>

          {/* Sección expandida - Estancadas */}
          {expandedSection === 'estancadas' && comparison.estancadas.length > 0 && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border-2 border-red-200 dark:border-red-800 overflow-hidden">
              <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-bold text-red-800 dark:text-red-400">
                    Guías Estancadas ({comparison.estancadas.length})
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllStuck}
                    className="text-xs px-3 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-300 dark:hover:bg-red-700"
                  >
                    Seleccionar todas
                  </button>
                  {selectedGuias.size > 0 && onSendToRescue && (
                    <button
                      onClick={sendSelectedToRescue}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Enviar {selectedGuias.size} a Rescate
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-navy-800 max-h-80 overflow-y-auto">
                {comparison.estancadas.map(guia => (
                  <div
                    key={guia.numeroGuia}
                    className={`px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-navy-800 cursor-pointer ${
                      selectedGuias.has(guia.numeroGuia) ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}
                    onClick={() => toggleGuiaSelection(guia.numeroGuia)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGuias.has(guia.numeroGuia)}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                        <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                          {guia.diasTranscurridos} días
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {guia.nombreCliente || 'Sin nombre'} • {guia.ciudadDestino} • {guia.transportadora}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 max-w-[150px] truncate">
                      {guia.estadoActual}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección expandida - Resueltas */}
          {expandedSection === 'resueltas' && comparison.resueltas.length > 0 && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400">
                  Guías Resueltas ({comparison.resueltas.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-navy-800 max-h-60 overflow-y-auto">
                {comparison.resueltas.map(guia => (
                  <div key={guia.numeroGuia} className="px-4 py-3 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {guia.nombreCliente || 'Sin nombre'} • {guia.ciudadDestino}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">{guia.estadoActual}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección expandida - Cambio de estado */}
          {expandedSection === 'cambio estado' && comparison.cambioEstado.length > 0 && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-amber-800 dark:text-amber-400">
                  Cambios de Estado ({comparison.cambioEstado.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-navy-800 max-h-60 overflow-y-auto">
                {comparison.cambioEstado.map(({ guia, estadoAnterior, estadoActual }) => (
                  <div key={guia.numeroGuia} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                      <span className="text-xs text-slate-500">
                        {guia.nombreCliente || 'Sin nombre'} • {guia.ciudadDestino}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 line-through">
                        {estadoAnterior}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-amber-800 dark:text-amber-200 font-medium">
                        {estadoActual}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección expandida - Nuevas */}
          {expandedSection === 'nuevas' && comparison.nuevas.length > 0 && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-blue-800 dark:text-blue-400">
                  Guías Nuevas ({comparison.nuevas.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-navy-800 max-h-60 overflow-y-auto">
                {comparison.nuevas.map(guia => (
                  <div key={guia.numeroGuia} className="px-4 py-3 flex items-center gap-3">
                    <Package className="w-4 h-4 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {guia.nombreCliente || 'Sin nombre'} • {guia.ciudadDestino} • {guia.transportadora}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{guia.estadoActual}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje si no hay datos en la sección seleccionada */}
          {expandedSection && (() => {
            const data = {
              estancadas: comparison.estancadas,
              resueltas: comparison.resueltas,
              entregadas: comparison.entregadas,
              nuevas: comparison.nuevas,
              'cambio estado': comparison.cambioEstado,
              desaparecidas: comparison.desaparecidas,
            }[expandedSection];

            if (data && data.length === 0) {
              return (
                <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-6 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    No hay guías en esta categoría
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </>
      )}

      {!sesion2Id && (
        <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-6 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Selecciona una sesión anterior para comparar
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionComparisonUI;
