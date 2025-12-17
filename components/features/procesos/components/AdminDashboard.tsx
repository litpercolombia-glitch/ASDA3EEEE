/**
 * ADMIN DASHBOARD COMPONENT
 * Panel de administración con reportes y alertas IA
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Calendar,
  Clock,
  Target,
  Award,
  X,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';
import { AlertaIA, ReporteUsuario, COLORES_DISPONIBLES } from '../types';
import TrackerPopup from './TrackerPopup';

interface AdminDashboardProps {
  className?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ className = '' }) => {
  const {
    usuarios,
    rondas,
    alertas,
    perfiles,
    marcarAlertaLeida,
    limpiarAlertas,
    getPerfilGamificacion,
  } = useProcesosStore();

  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [trackerUsuario, setTrackerUsuario] = useState<{
    id: string;
    nombre: string;
    avatar: string;
    color: string;
  } | null>(null);

  // Calculate reports
  const reportes: ReporteUsuario[] = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    const inicioMes = new Date();
    inicioMes.setDate(1);

    return usuarios.map((usuario) => {
      const rondasUsuario = rondas.filter((r) => r.usuarioId === usuario.id);
      const rondasHoy = rondasUsuario.filter((r) => r.fecha === hoy);
      const rondasSemana = rondasUsuario.filter((r) => new Date(r.fecha) >= inicioSemana);
      const rondasMes = rondasUsuario.filter((r) => new Date(r.fecha) >= inicioMes);

      const guiasHoy = rondasHoy.reduce((acc, r) => acc + r.realizado, 0);
      const guiasSemana = rondasSemana.reduce((acc, r) => acc + r.realizado, 0);
      const guiasMes = rondasMes.reduce((acc, r) => acc + r.realizado, 0);

      // Calculate time average
      const tiempoPromedio =
        rondasUsuario.length > 0
          ? rondasUsuario.reduce((acc, r) => acc + r.tiempoTotal, 0) / rondasUsuario.length
          : 0;

      // Success rate
      const totalGuias = rondasUsuario.reduce((acc, r) => acc + r.realizado + r.cancelado, 0);
      const guiasRealizadas = rondasUsuario.reduce((acc, r) => acc + r.realizado, 0);
      const tasaExito = totalGuias > 0 ? (guiasRealizadas / totalGuias) * 100 : 0;

      // Trend calculation (compare last 7 days vs previous 7 days)
      const hace14Dias = new Date();
      hace14Dias.setDate(hace14Dias.getDate() - 14);
      const rondasUltimos7 = rondasUsuario.filter((r) => new Date(r.fecha) >= inicioSemana);
      const rondasAnterior7 = rondasUsuario.filter(
        (r) => new Date(r.fecha) >= hace14Dias && new Date(r.fecha) < inicioSemana
      );

      const guiasUltimos7 = rondasUltimos7.reduce((acc, r) => acc + r.realizado, 0);
      const guiasAnterior7 = rondasAnterior7.reduce((acc, r) => acc + r.realizado, 0);
      const cambio = guiasAnterior7 > 0 ? ((guiasUltimos7 - guiasAnterior7) / guiasAnterior7) * 100 : 0;

      return {
        usuarioId: usuario.id,
        nombre: usuario.nombre,
        color: usuario.color,
        guiasHoy,
        guiasSemana,
        guiasMes,
        tiempoPromedio: Math.round(tiempoPromedio),
        tasaExito: Math.round(tasaExito),
        tendencia: cambio > 5 ? 'up' : cambio < -5 ? 'down' : 'stable',
        cambio: Math.round(cambio),
      };
    });
  }, [usuarios, rondas]);

  // General stats
  const statsGenerales = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    const rondasHoy = rondas.filter((r) => r.fecha === hoy);

    return {
      totalUsuarios: usuarios.length,
      guiasHoy: rondasHoy.reduce((acc, r) => acc + r.realizado, 0),
      promedioGuias: usuarios.length > 0
        ? Math.round(rondasHoy.reduce((acc, r) => acc + r.realizado, 0) / usuarios.length)
        : 0,
      mejorUsuario: reportes.reduce(
        (max, r) => (r.guiasHoy > max.guiasHoy ? r : max),
        { nombre: '-', guiasHoy: 0 }
      ).nombre,
    };
  }, [usuarios, rondas, reportes]);

  // Generate AI recommendations
  const recomendacionesIA = useMemo(() => {
    const recs: Array<{ tipo: 'warning' | 'tip' | 'success'; mensaje: string }> = [];

    // Check for low performers
    reportes.forEach((r) => {
      if (r.guiasHoy < 20 && usuarios.find((u) => u.id === r.usuarioId)?.metaDiaria > 20) {
        recs.push({
          tipo: 'warning',
          mensaje: `${r.nombre} esta por debajo de su meta diaria`,
        });
      }
      if (r.tendencia === 'down' && r.cambio < -20) {
        recs.push({
          tipo: 'warning',
          mensaje: `${r.nombre} ha bajado ${Math.abs(r.cambio)}% esta semana`,
        });
      }
      if (r.tendencia === 'up' && r.cambio > 20) {
        recs.push({
          tipo: 'success',
          mensaje: `${r.nombre} ha mejorado ${r.cambio}% esta semana`,
        });
      }
    });

    // General tips
    const hora = new Date().getHours();
    if (hora >= 10 && hora <= 12) {
      recs.push({ tipo: 'tip', mensaje: 'Las horas pico son de 10am a 12pm, aprovecha!' });
    }

    return recs;
  }, [reportes, usuarios]);

  const getColorHex = (colorId: string) =>
    COLORES_DISPONIBLES.find((c) => c.id === colorId)?.hex || '#8B5CF6';

  const getAlertIcon = (tipo: AlertaIA['tipo']) => {
    switch (tipo) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'tip':
        return <Lightbulb className="w-4 h-4 text-purple-400" />;
    }
  };

  const alertasNoLeidas = alertas.filter((a) => !a.leida);
  const alertasMostradas = showAllAlerts ? alertas : alertas.slice(0, 5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
          <Users className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{statsGenerales.totalUsuarios}</p>
          <p className="text-sm text-slate-400">Usuarios activos</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/30">
          <Target className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">{statsGenerales.guiasHoy}</p>
          <p className="text-sm text-slate-400">Guias hoy</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
          <BarChart3 className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{statsGenerales.promedioGuias}</p>
          <p className="text-sm text-slate-400">Promedio/usuario</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
          <Award className="w-6 h-6 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white truncate">{statsGenerales.mejorUsuario}</p>
          <p className="text-sm text-slate-400">Mejor del dia</p>
        </div>
      </div>

      {/* AI Recommendations */}
      {recomendacionesIA.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            Recomendaciones IA
          </h3>
          <div className="space-y-2">
            {recomendacionesIA.map((rec, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  rec.tipo === 'warning'
                    ? 'bg-amber-500/10 text-amber-300'
                    : rec.tipo === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-purple-500/10 text-purple-300'
                }`}
              >
                {getAlertIcon(rec.tipo)}
                <span className="text-sm">{rec.mensaje}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Panel */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Alertas
            {alertasNoLeidas.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {alertasNoLeidas.length}
              </span>
            )}
          </h3>
          {alertas.length > 0 && (
            <button
              onClick={limpiarAlertas}
              className="text-slate-400 text-sm hover:text-slate-300"
            >
              Limpiar todas
            </button>
          )}
        </div>

        {alertas.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No hay alertas</p>
        ) : (
          <div className="space-y-2">
            {alertasMostradas.map((alerta) => (
              <div
                key={alerta.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  alerta.leida ? 'bg-slate-700/30' : 'bg-slate-700'
                }`}
              >
                {getAlertIcon(alerta.tipo)}
                <div className="flex-1">
                  <p className={`text-sm ${alerta.leida ? 'text-slate-400' : 'text-white'}`}>
                    {alerta.mensaje}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(alerta.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {!alerta.leida && (
                  <button
                    onClick={() => marcarAlertaLeida(alerta.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {alertas.length > 5 && (
              <button
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1"
              >
                {showAllAlerts ? (
                  <>
                    Mostrar menos <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Ver todas ({alertas.length}) <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Reports Table */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Reporte por Usuario
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Usuario
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  Hoy
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  Semana
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  Mes
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  Exito
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  Tendencia
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {reportes.map((reporte) => {
                const perfil = getPerfilGamificacion(reporte.usuarioId);
                return (
                  <tr
                    key={reporte.usuarioId}
                    className="hover:bg-slate-700/30 cursor-pointer"
                    onClick={() =>
                      setExpandedUser(expandedUser === reporte.usuarioId ? null : reporte.usuarioId)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getColorHex(reporte.color) }}
                        />
                        <span className="text-white font-medium">{reporte.nombre}</span>
                        {perfil && (
                          <span className="text-xs text-slate-500">Nv.{perfil.nivel}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-white">{reporte.guiasHoy}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{reporte.guiasSemana}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{reporte.guiasMes}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`${
                          reporte.tasaExito >= 90
                            ? 'text-emerald-400'
                            : reporte.tasaExito >= 70
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {reporte.tasaExito}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {reporte.tendencia === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : reporte.tendencia === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        {reporte.cambio !== 0 && (
                          <span
                            className={`text-xs ${
                              reporte.cambio > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {reporte.cambio > 0 ? '+' : ''}
                            {reporte.cambio}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const usuario = usuarios.find(u => u.id === reporte.usuarioId);
                          if (usuario) {
                            setTrackerUsuario({
                              id: usuario.id,
                              nombre: usuario.nombre,
                              avatar: usuario.avatar,
                              color: getColorHex(usuario.color),
                            });
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 mx-auto transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Iniciar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reportes.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos de usuarios</p>
          </div>
        )}
      </div>

      {/* Tracker Popup */}
      {trackerUsuario && (
        <TrackerPopup
          usuarioId={trackerUsuario.id}
          usuarioNombre={trackerUsuario.nombre}
          usuarioAvatar={trackerUsuario.avatar}
          usuarioColor={trackerUsuario.color}
          onClose={() => setTrackerUsuario(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
