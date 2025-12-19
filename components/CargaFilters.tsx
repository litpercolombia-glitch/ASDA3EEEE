// components/CargaFilters.tsx
// Componente de filtros para cargas y guías

import React, { useState, useEffect, useMemo } from 'react';
import { FiltrosCarga, Carga, CargaResumen } from '../types/carga.types';
import { cargaService } from '../services/cargaService';

interface CargaFiltersProps {
  filtros: FiltrosCarga;
  onFiltrosChange: (filtros: FiltrosCarga) => void;
  cargas?: CargaResumen[];
  usuarios?: Array<{ id: string; nombre: string }>;
  transportadoras?: string[];
  ciudades?: string[];
  onBuscarGuia?: (numeroGuia: string) => void;
  compact?: boolean;
}

export const CargaFilters: React.FC<CargaFiltersProps> = ({
  filtros,
  onFiltrosChange,
  cargas = [],
  usuarios = [],
  transportadoras = [],
  ciudades = [],
  onBuscarGuia,
  compact = false,
}) => {
  const [busquedaGuia, setBusquedaGuia] = useState('');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  // Generar opciones de fecha rápidas
  const opcionesFecha = useMemo(() => {
    const hoy = new Date();
    const opciones = [
      { label: 'Hoy', valor: formatearFecha(hoy) },
      { label: 'Ayer', valor: formatearFecha(new Date(hoy.getTime() - 86400000)) },
      { label: 'Últimos 7 días', valor: formatearFecha(new Date(hoy.getTime() - 7 * 86400000)) },
      { label: 'Últimos 30 días', valor: formatearFecha(new Date(hoy.getTime() - 30 * 86400000)) },
      { label: 'Todo', valor: '' },
    ];
    return opciones;
  }, []);

  const handleFiltroChange = (campo: keyof FiltrosCarga, valor: unknown) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor || undefined,
    });
  };

  const handleBuscar = () => {
    if (busquedaGuia.trim() && onBuscarGuia) {
      onBuscarGuia(busquedaGuia.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const limpiarTodo = () => {
    onFiltrosChange({});
    setBusquedaGuia('');
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v !== undefined && v !== '');

  if (compact) {
    return (
      <div className="filtros-compact">
        <div className="filtros-row">
          {/* Búsqueda rápida */}
          <div className="busqueda-rapida">
            <input
              type="text"
              placeholder="🔍 Buscar guía..."
              value={busquedaGuia}
              onChange={(e) => setBusquedaGuia(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={handleBuscar}>Buscar</button>
          </div>

          {/* Selector de fecha */}
          <select
            value={filtros.fechaDesde || ''}
            onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
          >
            <option value="">📅 Fecha</option>
            {opcionesFecha.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.label}
              </option>
            ))}
          </select>

          {/* Selector de estado */}
          <select
            value={filtros.estado || ''}
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
          >
            <option value="">📊 Estado</option>
            <option value="activa">Activas</option>
            <option value="cerrada">Cerradas</option>
            <option value="todas">Todas</option>
          </select>

          {/* Checkbox novedad */}
          <label className="checkbox-novedad">
            <input
              type="checkbox"
              checked={filtros.soloConNovedad || false}
              onChange={(e) => handleFiltroChange('soloConNovedad', e.target.checked)}
            />
            ⚠️ Solo novedades
          </label>

          {hayFiltrosActivos && (
            <button className="btn-limpiar" onClick={limpiarTodo}>
              ✕ Limpiar
            </button>
          )}
        </div>

        <style>{`
          .filtros-compact {
            margin-bottom: 1rem;
          }

          .filtros-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .busqueda-rapida {
            display: flex;
            flex: 1;
            min-width: 200px;
            max-width: 300px;
          }

          .busqueda-rapida input {
            flex: 1;
            padding: 0.5rem 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px 0 0 6px;
            font-size: 0.875rem;
          }

          .busqueda-rapida button {
            padding: 0.5rem 0.75rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0 6px 6px 0;
            cursor: pointer;
            font-size: 0.875rem;
          }

          .filtros-row select {
            padding: 0.5rem 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.875rem;
            background: white;
            cursor: pointer;
          }

          .checkbox-novedad {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.875rem;
            color: #475569;
            cursor: pointer;
          }

          .btn-limpiar {
            padding: 0.375rem 0.75rem;
            background: #fee2e2;
            color: #dc2626;
            border: none;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="filtros-panel">
      <div className="filtros-header">
        <h3>🔍 Filtros</h3>
        <button
          className="btn-toggle"
          onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
        >
          {mostrarFiltrosAvanzados ? '▼ Ocultar avanzados' : '▶ Mostrar avanzados'}
        </button>
      </div>

      {/* Búsqueda de guía */}
      <div className="filtro-grupo">
        <label>Buscar Guía</label>
        <div className="busqueda-input">
          <input
            type="text"
            placeholder="Número de guía..."
            value={busquedaGuia}
            onChange={(e) => setBusquedaGuia(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={handleBuscar}>🔍</button>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="filtros-rapidos">
        <div className="filtro-grupo">
          <label>📅 Fecha</label>
          <div className="fecha-buttons">
            {opcionesFecha.map((op) => (
              <button
                key={op.valor}
                className={`fecha-btn ${filtros.fechaDesde === op.valor ? 'activo' : ''}`}
                onClick={() => handleFiltroChange('fechaDesde', op.valor)}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filtro-grupo">
          <label>📊 Estado de Carga</label>
          <select
            value={filtros.estado || 'todas'}
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="activa">Solo activas</option>
            <option value="cerrada">Solo cerradas</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filtros.soloConNovedad || false}
              onChange={(e) => handleFiltroChange('soloConNovedad', e.target.checked)}
            />
            ⚠️ Solo guías con novedad
          </label>
        </div>
      </div>

      {/* Filtros avanzados */}
      {mostrarFiltrosAvanzados && (
        <div className="filtros-avanzados">
          <div className="filtros-grid">
            {/* Usuario */}
            {usuarios.length > 0 && (
              <div className="filtro-grupo">
                <label>👤 Usuario</label>
                <select
                  value={filtros.usuarioId || ''}
                  onChange={(e) => handleFiltroChange('usuarioId', e.target.value)}
                >
                  <option value="">Todos los usuarios</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Transportadora */}
            {transportadoras.length > 0 && (
              <div className="filtro-grupo">
                <label>🚚 Transportadora</label>
                <select
                  value={filtros.transportadora || ''}
                  onChange={(e) => handleFiltroChange('transportadora', e.target.value)}
                >
                  <option value="">Todas</option>
                  {transportadoras.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ciudad */}
            {ciudades.length > 0 && (
              <div className="filtro-grupo">
                <label>📍 Ciudad destino</label>
                <select
                  value={filtros.ciudadDestino || ''}
                  onChange={(e) => handleFiltroChange('ciudadDestino', e.target.value)}
                >
                  <option value="">Todas</option>
                  {ciudades.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rango de fecha personalizado */}
            <div className="filtro-grupo">
              <label>📆 Desde</label>
              <input
                type="date"
                value={filtros.fechaDesde || ''}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              />
            </div>

            <div className="filtro-grupo">
              <label>📆 Hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta || ''}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Botón limpiar */}
      {hayFiltrosActivos && (
        <div className="filtros-footer">
          <button className="btn-limpiar-todo" onClick={limpiarTodo}>
            🗑️ Limpiar todos los filtros
          </button>
          <span className="filtros-activos">
            {Object.values(filtros).filter(v => v !== undefined && v !== '').length} filtros activos
          </span>
        </div>
      )}

      <style>{`
        .filtros-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .filtros-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .filtros-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #1e293b;
        }

        .btn-toggle {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .filtro-grupo {
          margin-bottom: 1rem;
        }

        .filtro-grupo label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.375rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .busqueda-input {
          display: flex;
        }

        .busqueda-input input {
          flex: 1;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px 0 0 8px;
          font-size: 0.9375rem;
        }

        .busqueda-input button {
          padding: 0.625rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0 8px 8px 0;
          cursor: pointer;
          font-size: 1rem;
        }

        .fecha-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .fecha-btn {
          padding: 0.375rem 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .fecha-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .fecha-btn.activo {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .filtros-rapidos select,
        .filtros-avanzados select,
        .filtros-avanzados input[type="date"] {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem !important;
          font-weight: normal !important;
          text-transform: none !important;
        }

        .filtros-avanzados {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .filtros-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        .filtros-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-limpiar-todo {
          padding: 0.5rem 1rem;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .filtros-activos {
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

function formatearFecha(fecha: Date): string {
  return fecha.toISOString().split('T')[0];
}

export default CargaFilters;
