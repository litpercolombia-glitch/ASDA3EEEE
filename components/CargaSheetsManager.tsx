// components/CargaSheetsManager.tsx
// Gestor de hojas de carga con tabs, archivado y eliminación automática

import React, { useState, useMemo, useEffect } from 'react';
import { cargaService } from '../services/cargaService';
import { ReviewedBadge } from './ReviewedBadge';

interface CargaSheetsManagerProps {
  cargaActualId: string | null;
  onCargaChange: (cargaId: string) => void;
  onVerTodas: () => void;
  viendoTodas?: boolean;
}

interface HojaMetadata {
  id: string;
  nombre: string;
  usuario: string;
  transportadoras: string[];
  totalGuias: number;
  guiasRevisadas: number;
  guiasPendientes: number;
  estado: 'activa' | 'cerrada' | 'archivada';
  creadaEn: Date;
  tiempoRestanteArchivada?: number;
}

export const CargaSheetsManager: React.FC<CargaSheetsManagerProps> = ({
  cargaActualId,
  onCargaChange,
  onVerTodas,
  viendoTodas = false,
}) => {
  const [hojas, setHojas] = useState<HojaMetadata[]>([]);
  const [showArchivadas, setShowArchivadas] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Cargar hojas
  useEffect(() => {
    const cargarHojas = () => {
      const hojasData = cargaService.getHojasConMetadata();
      setHojas(hojasData);
    };

    cargarHojas();

    // Refrescar cada minuto para actualizar tiempos
    const interval = setInterval(cargarHojas, 60000);
    return () => clearInterval(interval);
  }, [cargaActualId]);

  const hojasActivas = useMemo(() =>
    hojas.filter(h => h.estado !== 'archivada'),
    [hojas]
  );

  const hojasArchivadas = useMemo(() =>
    hojas.filter(h => h.estado === 'archivada'),
    [hojas]
  );

  const handleArchivar = (hojaId: string) => {
    cargaService.archivarCarga(hojaId);
    setHojas(cargaService.getHojasConMetadata());

    // Si era la hoja actual, cambiar a otra
    if (hojaId === cargaActualId) {
      const otraHoja = hojasActivas.find(h => h.id !== hojaId);
      if (otraHoja) {
        onCargaChange(otraHoja.id);
      }
    }
  };

  const handleRestaurar = (hojaId: string) => {
    cargaService.restaurarCarga(hojaId);
    setHojas(cargaService.getHojasConMetadata());
  };

  const handleEliminarPermanente = (hojaId: string) => {
    cargaService.eliminarCarga(hojaId);
    setHojas(cargaService.getHojasConMetadata());
    setConfirmDelete(null);

    if (hojaId === cargaActualId) {
      const otraHoja = hojasActivas.find(h => h.id !== hojaId);
      if (otraHoja) {
        onCargaChange(otraHoja.id);
      }
    }
  };

  const formatTiempoRestante = (minutos?: number) => {
    if (!minutos) return '';
    if (minutos < 60) return `${minutos}min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  const getCarrierIcon = (carrier: string) => {
    const lower = carrier.toLowerCase();
    if (lower.includes('inter') || lower.includes('rapid')) return 'orange';
    if (lower.includes('coordinadora')) return 'blue';
    if (lower.includes('envi')) return 'red';
    if (lower.includes('tcc')) return 'yellow';
    if (lower.includes('servientrega')) return 'green';
    return 'gray';
  };

  return (
    <div className="carga-sheets-manager">
      {/* Tabs de hojas */}
      <div className="sheets-tabs">
        {/* Botón Ver Todas */}
        <button
          className={`sheet-tab todas ${viendoTodas ? 'active' : ''}`}
          onClick={onVerTodas}
        >
          <span className="tab-icon">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </span>
          <span className="tab-label">Todas</span>
          <span className="tab-count">{hojas.reduce((sum, h) => sum + h.totalGuias, 0)}</span>
        </button>

        {/* Tabs de hojas activas */}
        {hojasActivas.map((hoja, index) => (
          <div
            key={hoja.id}
            className={`sheet-tab ${cargaActualId === hoja.id && !viendoTodas ? 'active' : ''}`}
          >
            <button
              className="tab-main"
              onClick={() => onCargaChange(hoja.id)}
            >
              <span className="tab-number">#{index + 1}</span>
              <span className="tab-label">{hoja.usuario}</span>

              {/* Indicadores de transportadoras */}
              <div className="tab-carriers">
                {hoja.transportadoras.slice(0, 3).map((t, i) => (
                  <span
                    key={i}
                    className={`carrier-dot ${getCarrierIcon(t)}`}
                    title={t}
                  />
                ))}
                {hoja.transportadoras.length > 3 && (
                  <span className="carrier-more">+{hoja.transportadoras.length - 3}</span>
                )}
              </div>

              {/* Badge de revisión */}
              <div className="tab-review">
                <ReviewedBadge
                  revisada={hoja.guiasRevisadas === hoja.totalGuias && hoja.totalGuias > 0}
                  size="sm"
                  showTooltip={false}
                  animated={false}
                />
                <span className="review-count">
                  {hoja.guiasRevisadas}/{hoja.totalGuias}
                </span>
              </div>
            </button>

            {/* Botón de archivar */}
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleArchivar(hoja.id);
              }}
              title="Archivar hoja (se eliminará en 24h)"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Hojas archivadas */}
      {hojasArchivadas.length > 0 && (
        <div className="archived-section">
          <button
            className="archived-toggle"
            onClick={() => setShowArchivadas(!showArchivadas)}
          >
            <svg
              className={`w-4 h-4 transition-transform ${showArchivadas ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span>Archivadas ({hojasArchivadas.length})</span>
          </button>

          {showArchivadas && (
            <div className="archived-list">
              {hojasArchivadas.map((hoja) => (
                <div key={hoja.id} className="archived-item">
                  <div className="archived-info">
                    <span className="archived-name">{hoja.nombre}</span>
                    <span className="archived-user">por {hoja.usuario}</span>
                    <span className="archived-timer">
                      Se elimina en {formatTiempoRestante(hoja.tiempoRestanteArchivada)}
                    </span>
                  </div>
                  <div className="archived-actions">
                    <button
                      className="btn-restore"
                      onClick={() => handleRestaurar(hoja.id)}
                    >
                      Restaurar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => setConfirmDelete(hoja.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="delete-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Eliminar Hoja</h4>
            <p>Esta acción no se puede deshacer. Se perderán todas las guías de esta hoja.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm-delete"
                onClick={() => handleEliminarPermanente(confirmDelete)}
              >
                Eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .carga-sheets-manager {
          margin-bottom: 1rem;
        }

        .sheets-tabs {
          display: flex;
          gap: 0.375rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          -webkit-overflow-scrolling: touch;
        }

        .sheets-tabs::-webkit-scrollbar {
          height: 4px;
        }

        .sheets-tabs::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }

        .sheets-tabs::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }

        .sheet-tab {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          gap: 0.5rem;
        }

        .sheet-tab:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .sheet-tab.active {
          background: white;
          border-color: #3b82f6;
          color: #1e293b;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
        }

        .sheet-tab.todas {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .sheet-tab.todas.active {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-color: #3b82f6;
        }

        .tab-main {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: inherit;
        }

        .tab-icon {
          display: flex;
          color: #64748b;
        }

        .tab-number {
          font-weight: 600;
          color: #3b82f6;
        }

        .tab-label {
          font-weight: 500;
        }

        .tab-count {
          padding: 0.125rem 0.375rem;
          background: #e2e8f0;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .sheet-tab.active .tab-count {
          background: #dbeafe;
          color: #3b82f6;
        }

        .tab-carriers {
          display: flex;
          gap: 2px;
          margin-left: 0.25rem;
        }

        .carrier-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .carrier-dot.orange { background: #f97316; }
        .carrier-dot.blue { background: #3b82f6; }
        .carrier-dot.red { background: #ef4444; }
        .carrier-dot.yellow { background: #eab308; }
        .carrier-dot.green { background: #22c55e; }
        .carrier-dot.gray { background: #94a3b8; }

        .carrier-more {
          font-size: 0.625rem;
          color: #94a3b8;
          margin-left: 2px;
        }

        .tab-review {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: 0.25rem;
        }

        .review-count {
          font-size: 0.6875rem;
          color: #64748b;
        }

        .tab-close {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .tab-close:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .archived-section {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed #e2e8f0;
        }

        .archived-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #92400e;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .archived-toggle:hover {
          background: #fde68a;
        }

        .archived-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .archived-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 0.75rem;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 6px;
        }

        .archived-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .archived-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1e293b;
        }

        .archived-user {
          font-size: 0.6875rem;
          color: #64748b;
        }

        .archived-timer {
          font-size: 0.6875rem;
          color: #d97706;
          font-weight: 500;
        }

        .archived-actions {
          display: flex;
          gap: 0.375rem;
        }

        .btn-restore,
        .btn-delete {
          padding: 0.375rem 0.625rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-restore {
          background: #d1fae5;
          border: 1px solid #10b981;
          color: #059669;
        }

        .btn-restore:hover {
          background: #a7f3d0;
        }

        .btn-delete {
          background: #fee2e2;
          border: 1px solid #ef4444;
          color: #dc2626;
        }

        .btn-delete:hover {
          background: #fecaca;
        }

        .delete-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .delete-modal {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .delete-modal h4 {
          margin: 0 0 0.75rem;
          font-size: 1.125rem;
          color: #1e293b;
        }

        .delete-modal p {
          margin: 0 0 1.25rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .btn-cancel {
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #64748b;
          cursor: pointer;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
        }

        .btn-confirm-delete {
          padding: 0.5rem 1rem;
          background: #ef4444;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          color: white;
          cursor: pointer;
        }

        .btn-confirm-delete:hover {
          background: #dc2626;
        }

        @media (max-width: 640px) {
          .sheets-tabs {
            flex-wrap: nowrap;
          }

          .sheet-tab {
            min-width: auto;
          }

          .tab-label {
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .tab-carriers {
            display: none;
          }

          .archived-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .archived-actions {
            width: 100%;
          }

          .btn-restore,
          .btn-delete {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CargaSheetsManager;
