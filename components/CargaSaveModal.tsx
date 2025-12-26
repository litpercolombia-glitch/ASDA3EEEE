// components/CargaSaveModal.tsx
// Modal que muestra metadata al guardar una carga

import React from 'react';
import { Carga } from '../types/carga.types';
import { ReviewedBadge } from './ReviewedBadge';

interface CargaSaveModalProps {
  carga: Carga;
  onClose: () => void;
  isVisible: boolean;
}

export const CargaSaveModal: React.FC<CargaSaveModalProps> = ({
  carga,
  onClose,
  isVisible,
}) => {
  if (!isVisible) return null;

  // Calcular transportadoras únicas
  const transportadoras = [...new Set(carga.guias.map(g => g.transportadora))].filter(Boolean);

  // Contar guías por transportadora
  const guiasPorTransportadora: Record<string, number> = {};
  carga.guias.forEach(g => {
    if (g.transportadora) {
      guiasPorTransportadora[g.transportadora] = (guiasPorTransportadora[g.transportadora] || 0) + 1;
    }
  });

  // Contar revisadas
  const guiasRevisadas = carga.guias.filter(g => g.revisada).length;

  const getCarrierColor = (carrier: string) => {
    const lower = carrier.toLowerCase();
    if (lower.includes('inter') || lower.includes('rapid')) return '#f97316';
    if (lower.includes('coordinadora')) return '#3b82f6';
    if (lower.includes('envi')) return '#ef4444';
    if (lower.includes('tcc')) return '#eab308';
    if (lower.includes('servientrega')) return '#22c55e';
    return '#64748b';
  };

  return (
    <div className="save-modal-overlay" onClick={onClose}>
      <div className="save-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-icon">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3>Carga Guardada</h3>
        </div>

        {/* Contenido */}
        <div className="modal-content">
          {/* Info básica */}
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">Nombre</span>
              <span className="info-value">{carga.nombre}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Guardada por</span>
              <span className="info-value highlight">{carga.usuarioNombre}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Fecha</span>
              <span className="info-value">
                {new Date().toLocaleString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Transportadoras */}
          <div className="transportadoras-section">
            <h4>Transportadoras</h4>
            <div className="transportadoras-list">
              {transportadoras.map((t) => (
                <div key={t} className="transportadora-item">
                  <div
                    className="transportadora-badge"
                    style={{ backgroundColor: getCarrierColor(t) }}
                  >
                    {t.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="transportadora-name">{t}</span>
                  <span className="transportadora-count">
                    {guiasPorTransportadora[t]} guías
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-icon">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div className="stat-content">
                <span className="stat-value">{carga.totalGuias}</span>
                <span className="stat-label">Total guías</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon reviewed">
                <ReviewedBadge revisada={true} size="sm" showTooltip={false} animated={false} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{guiasRevisadas}</span>
                <span className="stat-label">Revisadas</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="stat-content">
                <span className="stat-value">{carga.totalGuias - guiasRevisadas}</span>
                <span className="stat-label">Pendientes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <style>{`
          .save-modal-overlay {
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
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .save-modal {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 420px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            animation: slideUp 0.3s ease;
            overflow: hidden;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modal-header {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            padding: 1.5rem;
            text-align: center;
          }

          .header-icon {
            width: 56px;
            height: 56px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.75rem;
          }

          .modal-header h3 {
            margin: 0;
            color: white;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .modal-content {
            padding: 1.25rem;
          }

          .info-section {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
            margin-bottom: 1.25rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e2e8f0;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .info-label {
            font-size: 0.8125rem;
            color: #64748b;
          }

          .info-value {
            font-size: 0.875rem;
            font-weight: 500;
            color: #1e293b;
          }

          .info-value.highlight {
            color: #3b82f6;
            font-weight: 600;
          }

          .transportadoras-section {
            margin-bottom: 1.25rem;
          }

          .transportadoras-section h4 {
            margin: 0 0 0.75rem;
            font-size: 0.8125rem;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .transportadoras-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .transportadora-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.625rem;
            background: #f8fafc;
            border-radius: 8px;
          }

          .transportadora-badge {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .transportadora-name {
            flex: 1;
            font-size: 0.875rem;
            font-weight: 500;
            color: #1e293b;
          }

          .transportadora-count {
            font-size: 0.75rem;
            color: #64748b;
            background: #e2e8f0;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
          }

          .stats-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.375rem;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 8px;
          }

          .stat-icon {
            color: #64748b;
          }

          .stat-icon.reviewed {
            display: flex;
          }

          .stat-content {
            text-align: center;
          }

          .stat-value {
            display: block;
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
          }

          .stat-label {
            font-size: 0.6875rem;
            color: #64748b;
            text-transform: uppercase;
          }

          .modal-footer {
            padding: 1rem 1.25rem;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: center;
          }

          .btn-close {
            padding: 0.625rem 2rem;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            color: #475569;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .btn-close:hover {
            background: #e2e8f0;
          }
        `}</style>
      </div>
    </div>
  );
};

export default CargaSaveModal;
