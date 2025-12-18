// components/brain/JourneyMap.tsx
// Mapa visual del recorrido del envío

import React from 'react';
import { LocationHistory, LocationPoint } from '../../services/brain';

interface JourneyMapProps {
  locations: LocationHistory;
  showRoute?: boolean;
  interactive?: boolean;
  onLocationClick?: (point: LocationPoint) => void;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  locations,
  showRoute = true,
  interactive = true,
  onLocationClick,
}) => {
  // Mapa simplificado de Colombia (SVG básico)
  return (
    <div className="journey-map">
      {/* Header con progreso */}
      <div className="map-header">
        <div className="progress-indicator">
          <div
            className="progress-fill"
            style={{ width: `${locations.estimatedProgress}%` }}
          />
        </div>
        <span className="progress-label">
          Progreso: {locations.estimatedProgress}%
        </span>
      </div>

      {/* Ruta de ciudades */}
      <div className="route-cities">
        {locations.route.map((city, index) => (
          <React.Fragment key={city}>
            <div
              className={`city-badge ${
                index === locations.route.length - 1 ? 'current' : 'visited'
              }`}
            >
              {index === 0 && <span className="city-icon">📦</span>}
              {index === locations.route.length - 1 && (
                <span className="city-icon">📍</span>
              )}
              {index > 0 && index < locations.route.length - 1 && (
                <span className="city-icon">🚚</span>
              )}
              <span className="city-name">{city}</span>
            </div>
            {index < locations.route.length - 1 && (
              <div className="route-arrow">→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Puntos de ubicación */}
      <div className="location-points">
        {locations.points.map((point, index) => (
          <div
            key={`${point.name}-${index}`}
            className={`location-point ${point.type}`}
            onClick={() => interactive && onLocationClick?.(point)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            <div className="point-marker">
              {point.type === 'origin' && '📦'}
              {point.type === 'destination' && '🏠'}
              {point.type === 'current' && '📍'}
              {point.type === 'transit' && '🔵'}
              {point.type === 'distribution' && '🏭'}
            </div>
            <div className="point-info">
              <span className="point-name">{point.name}</span>
              <span className="point-time">
                {point.timestamp.toLocaleString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="point-source">{point.source}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de ubicación */}
      <div className="location-summary">
        <div className="summary-card origin">
          <span className="summary-icon">📦</span>
          <div className="summary-content">
            <span className="summary-label">Origen</span>
            <span className="summary-value">
              {locations.origin?.name || 'No disponible'}
            </span>
          </div>
        </div>

        <div className="summary-connector">
          <span className="stops-count">
            {locations.totalStops > 2
              ? `${locations.totalStops - 2} paradas`
              : 'Directo'}
          </span>
        </div>

        <div className="summary-card destination">
          <span className="summary-icon">🏠</span>
          <div className="summary-content">
            <span className="summary-label">Destino</span>
            <span className="summary-value">
              {locations.destination?.name ||
                locations.currentLocation?.name ||
                'En tránsito'}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .journey-map {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .map-header {
          margin-bottom: 1.5rem;
        }

        .progress-indicator {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #22c55e);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .route-cities {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .city-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          background: white;
          border-radius: 9999px;
          font-size: 0.875rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .city-badge.current {
          background: #3b82f6;
          color: white;
        }

        .city-icon {
          font-size: 0.875rem;
        }

        .route-arrow {
          color: #94a3b8;
          font-size: 1.25rem;
        }

        .location-points {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .location-point {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .location-point:hover {
          background: #f8fafc;
        }

        .location-point.current {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .location-point.origin {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .location-point.destination {
          background: #fef3c7;
          border: 1px solid #fcd34d;
        }

        .point-marker {
          font-size: 1.25rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .point-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .point-name {
          font-weight: 500;
          color: #1e293b;
        }

        .point-time {
          font-size: 0.75rem;
          color: #64748b;
        }

        .point-source {
          font-size: 0.625rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .location-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 12px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .summary-card.origin {
          justify-content: flex-start;
        }

        .summary-card.destination {
          justify-content: flex-end;
          text-align: right;
        }

        .summary-icon {
          font-size: 1.5rem;
        }

        .summary-content {
          display: flex;
          flex-direction: column;
        }

        .summary-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .summary-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .summary-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .summary-connector::before,
        .summary-connector::after {
          content: '';
          width: 30px;
          height: 2px;
          background: #cbd5e1;
        }

        .stops-count {
          font-size: 0.625rem;
          color: #64748b;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default JourneyMap;
