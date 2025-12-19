// components/TeamActivity.tsx
// Muestra actividad del equipo en tiempo real

import React, { useState, useEffect } from 'react';
import { cargaService } from '../services/cargaService';
import { CargaResumen } from '../types/carga.types';

interface ActivityItem {
  id: string;
  tipo: 'carga_creada' | 'carga_cerrada' | 'guias_agregadas' | 'login' | 'logout';
  usuario: string;
  descripcion: string;
  timestamp: Date;
  datos?: {
    cargaId?: string;
    totalGuias?: number;
  };
}

interface TeamActivityProps {
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
  onActivityClick?: (activity: ActivityItem) => void;
}

export const TeamActivity: React.FC<TeamActivityProps> = ({
  maxItems = 10,
  showHeader = true,
  compact = false,
  onActivityClick,
}) => {
  const [actividades, setActividades] = useState<ActivityItem[]>([]);
  const [cargasRecientes, setCargasRecientes] = useState<CargaResumen[]>([]);
  const [usuariosOnline, setUsuariosOnline] = useState<string[]>([]);

  // Cargar actividad inicial
  useEffect(() => {
    cargarActividad();
    cargarCargasRecientes();
    cargarUsuariosOnline();

    // Refrescar cada 30 segundos
    const interval = setInterval(() => {
      cargarActividad();
      cargarCargasRecientes();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const cargarActividad = () => {
    try {
      // Cargar logs de actividad
      const logsData = localStorage.getItem('litper_activity_logs');
      if (logsData) {
        const logs = JSON.parse(logsData) as Array<{
          type: string;
          userEmail: string;
          userName?: string;
          timestamp: string;
          metadata?: Record<string, unknown>;
        }>;

        const items: ActivityItem[] = logs
          .slice(-maxItems * 2)
          .map((log, index) => ({
            id: `activity_${index}_${log.timestamp}`,
            tipo: mapTipoActividad(log.type),
            usuario: log.userName || log.userEmail,
            descripcion: getDescripcion(log.type, log.metadata),
            timestamp: new Date(log.timestamp),
            datos: log.metadata as ActivityItem['datos'],
          }))
          .filter(a => a.tipo !== 'login' || !compact)
          .slice(-maxItems)
          .reverse();

        setActividades(items);
      }
    } catch (error) {
      console.error('Error cargando actividad:', error);
    }
  };

  const cargarCargasRecientes = () => {
    const historial = cargaService.getHistorial();
    const todasLasCargas: CargaResumen[] = [];

    historial.fechas.forEach(dia => {
      todasLasCargas.push(...dia.cargas);
    });

    // Ordenar por fecha de creación y tomar las más recientes
    const recientes = todasLasCargas
      .sort((a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime())
      .slice(0, 5);

    setCargasRecientes(recientes);
  };

  const cargarUsuariosOnline = () => {
    // Simular usuarios online basado en actividad reciente
    const logsData = localStorage.getItem('litper_activity_logs');
    if (logsData) {
      const logs = JSON.parse(logsData) as Array<{
        type: string;
        userName?: string;
        timestamp: string;
      }>;

      const ahora = new Date();
      const hace15Min = new Date(ahora.getTime() - 15 * 60 * 1000);

      const usuariosRecientes = new Set<string>();
      logs.forEach(log => {
        if (new Date(log.timestamp) > hace15Min && log.userName) {
          usuariosRecientes.add(log.userName);
        }
      });

      setUsuariosOnline(Array.from(usuariosRecientes));
    }
  };

  const mapTipoActividad = (type: string): ActivityItem['tipo'] => {
    if (type.includes('carga') && type.includes('create')) return 'carga_creada';
    if (type.includes('carga') && type.includes('close')) return 'carga_cerrada';
    if (type.includes('guia') || type.includes('shipment')) return 'guias_agregadas';
    if (type.includes('login')) return 'login';
    if (type.includes('logout')) return 'logout';
    return 'login';
  };

  const getDescripcion = (type: string, metadata?: Record<string, unknown>): string => {
    if (type.includes('carga')) {
      const totalGuias = metadata?.totalGuias || metadata?.count || 0;
      if (type.includes('create')) return `Creó una nueva carga con ${totalGuias} guías`;
      if (type.includes('close')) return 'Cerró una carga';
      if (type.includes('update')) return `Actualizó una carga (${totalGuias} guías)`;
    }
    if (type.includes('guia') || type.includes('shipment')) {
      const count = metadata?.count || metadata?.totalGuias || 0;
      return `Agregó ${count} guías`;
    }
    if (type.includes('login')) return 'Inició sesión';
    if (type.includes('logout')) return 'Cerró sesión';
    return type;
  };

  const getIconoActividad = (tipo: ActivityItem['tipo']): string => {
    switch (tipo) {
      case 'carga_creada': return '📦';
      case 'carga_cerrada': return '🔒';
      case 'guias_agregadas': return '📋';
      case 'login': return '🟢';
      case 'logout': return '🔴';
      default: return '📌';
    }
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  if (compact) {
    return (
      <div className="team-activity-compact">
        {/* Usuarios online */}
        {usuariosOnline.length > 0 && (
          <div className="online-users-mini">
            <span className="online-dot">●</span>
            {usuariosOnline.slice(0, 3).join(', ')}
            {usuariosOnline.length > 3 && ` +${usuariosOnline.length - 3}`}
          </div>
        )}

        {/* Última actividad */}
        {actividades.length > 0 && (
          <div className="last-activity">
            {getIconoActividad(actividades[0].tipo)} {actividades[0].usuario}: {actividades[0].descripcion}
            <span className="time">{getRelativeTime(actividades[0].timestamp)}</span>
          </div>
        )}

        <style>{`
          .team-activity-compact {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.75rem;
            color: #64748b;
          }

          .online-users-mini {
            display: flex;
            align-items: center;
            gap: 0.375rem;
          }

          .online-dot {
            color: #22c55e;
            animation: pulse 2s infinite;
          }

          .last-activity {
            display: flex;
            align-items: center;
            gap: 0.375rem;
          }

          .last-activity .time {
            color: #94a3b8;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="team-activity">
      {showHeader && (
        <div className="activity-header">
          <h3>👥 Actividad del Equipo</h3>
          {usuariosOnline.length > 0 && (
            <span className="online-count">
              🟢 {usuariosOnline.length} online
            </span>
          )}
        </div>
      )}

      {/* Usuarios online */}
      {usuariosOnline.length > 0 && (
        <div className="online-users">
          <span className="online-label">En línea ahora:</span>
          <div className="online-avatars">
            {usuariosOnline.map((usuario) => (
              <div key={usuario} className="online-avatar" title={usuario}>
                {usuario.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cargas recientes */}
      {cargasRecientes.length > 0 && (
        <div className="cargas-recientes">
          <h4>📦 Cargas Recientes</h4>
          <div className="cargas-list">
            {cargasRecientes.map((carga) => (
              <div key={carga.id} className="carga-mini">
                <span className="carga-nombre">
                  {carga.estado === 'activa' ? '📦' : '📁'} #{carga.numeroCarga}
                </span>
                <span className="carga-user">{carga.usuarioNombre}</span>
                <span className="carga-guias">{carga.totalGuias} guías</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de actividades */}
      <div className="activity-list">
        <h4>📋 Actividad Reciente</h4>
        {actividades.length > 0 ? (
          actividades.map((actividad) => (
            <div
              key={actividad.id}
              className="activity-item"
              onClick={() => onActivityClick?.(actividad)}
            >
              <span className="activity-icon">
                {getIconoActividad(actividad.tipo)}
              </span>
              <div className="activity-content">
                <span className="activity-user">{actividad.usuario}</span>
                <span className="activity-desc">{actividad.descripcion}</span>
              </div>
              <span className="activity-time">
                {getRelativeTime(actividad.timestamp)}
              </span>
            </div>
          ))
        ) : (
          <div className="no-activity">
            <span>📭</span>
            <p>No hay actividad reciente</p>
          </div>
        )}
      </div>

      <style>{`
        .team-activity {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .activity-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #1e293b;
        }

        .online-count {
          font-size: 0.75rem;
          color: #22c55e;
        }

        .online-users {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f0fdf4;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .online-label {
          font-size: 0.75rem;
          color: #166534;
        }

        .online-avatars {
          display: flex;
          gap: -0.5rem;
        }

        .online-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          border: 2px solid white;
          margin-left: -8px;
        }

        .online-avatar:first-child {
          margin-left: 0;
        }

        .cargas-recientes {
          margin-bottom: 1rem;
        }

        .cargas-recientes h4,
        .activity-list h4 {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cargas-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .carga-mini {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 6px;
          font-size: 0.8125rem;
        }

        .carga-nombre {
          font-weight: 500;
          color: #1e293b;
        }

        .carga-user {
          color: #64748b;
        }

        .carga-guias {
          margin-left: auto;
          font-size: 0.75rem;
          background: #e2e8f0;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          color: #475569;
        }

        .activity-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.625rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .activity-item:hover {
          background: #f8fafc;
        }

        .activity-icon {
          font-size: 1rem;
          width: 1.5rem;
          text-align: center;
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-user {
          font-weight: 500;
          color: #1e293b;
          font-size: 0.8125rem;
        }

        .activity-desc {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-time {
          font-size: 0.6875rem;
          color: #94a3b8;
          white-space: nowrap;
        }

        .no-activity {
          text-align: center;
          padding: 1.5rem;
          color: #64748b;
        }

        .no-activity span {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .no-activity p {
          margin: 0;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default TeamActivity;
