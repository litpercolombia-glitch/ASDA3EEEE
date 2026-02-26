/**
 * 👤 OPERADOR DASHBOARD - ANÁLISIS DE RONDAS LITPER
 * Vista personal del operador con sus propias métricas
 */

import React, { useRef, useState } from 'react';
import {
  User,
  LogOut,
  Upload,
  FileSpreadsheet,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Zap,
  Activity,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Package,
  XCircle,
  Calendar,
} from 'lucide-react';
import { MetricasGlobales, MetricasUsuario, AlertaPersonal } from '../../types/analisis-rondas';
import { COLORES_ESTADO, COLORES_ALERTA, UMBRALES, ICONOS, COLORES_SEMAFORO, METRICAS_AVANZADAS, USUARIOS_OPERADORES } from '../../constants/analisis-rondas';

interface OperadorDashboardProps {
  usuario: string;
  datos: MetricasGlobales | null;
  onCargarCSV: (file: File) => Promise<void>;
  onLogout: () => void;
  cargando: boolean;
}

export const OperadorDashboard: React.FC<OperadorDashboardProps> = ({
  usuario,
  datos,
  onCargarCSV,
  onLogout,
  cargando,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Obtener métricas del usuario actual
  const misMetricas: MetricasUsuario | undefined = datos?.ranking.find(
    (u) => u.usuario.toUpperCase() === usuario.toUpperCase()
  );

  // Calcular posición en ranking
  const miPosicion = datos?.ranking.findIndex(
    (u) => u.usuario.toUpperCase() === usuario.toUpperCase()
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onCargarCSV(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      await onCargarCSV(file);
    }
  };

  const getEstadoColor = (estado: string) => {
    return COLORES_ESTADO[estado as keyof typeof COLORES_ESTADO] || COLORES_ESTADO.regular;
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'subiendo':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'bajando':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const estadoColors = misMetricas ? getEstadoColor(misMetricas.estado) : getEstadoColor('regular');

  // Get operator color from USUARIOS_OPERADORES
  const operadorInfo = USUARIOS_OPERADORES.find(u => u.nombre.toUpperCase() === usuario.toUpperCase());
  const operadorColor = operadorInfo?.color || '#8b5cf6';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f172a 50%, #1e1b4b 100%)' }}>
      {/* Subtle grid overlay */}
      <svg className="fixed inset-0 w-full h-full opacity-[0.02] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="op-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#op-grid)" />
      </svg>

      <div className="relative z-10 space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
        style={{
          background: `linear-gradient(135deg, ${operadorColor}10 0%, rgba(15, 23, 42, 0.95) 100%)`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${operadorColor}, ${operadorColor}80, transparent)` }}
        />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${operadorColor}, ${operadorColor}80)`, boxShadow: `0 0 20px ${operadorColor}30` }}
                >
                  <span className="text-xl">{operadorInfo?.icono || '👤'}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 flex items-center justify-center" style={{ borderColor: 'rgba(15, 23, 42, 0.95)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  {usuario}
                  {miPosicion !== undefined && miPosicion >= 0 && (
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium rounded-full border"
                      style={{ background: `${operadorColor}20`, borderColor: `${operadorColor}30`, color: operadorColor }}
                    >
                      #{miPosicion + 1} Ranking
                    </span>
                  )}
                </h1>
                <p className="text-sm text-white/40">Mi Panel de Rondas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={cargando}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all flex items-center gap-2 disabled:opacity-50 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${operadorColor}, ${operadorColor}cc)`, boxShadow: `0 2px 10px ${operadorColor}30` }}
              >
                {cargando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Subir Reporte
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 transition-all flex items-center gap-2 border border-white/[0.06] hover:border-red-500/20 bg-white/[0.02] hover:bg-red-500/[0.06]"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Zona de carga si no hay datos */}
      {!datos && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/[0.08] hover:border-emerald-500/30'
          }`}
          style={{ background: dragActive ? undefined : 'rgba(255,255,255,0.01)' }}
        >
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-lg font-semibold text-white/60 mb-2">Sube un archivo CSV o Excel</h3>
          <p className="text-sm text-white/30 mb-4">Arrastra y suelta o haz clic en "Subir Reporte"</p>
          <p className="text-xs text-white/20">Formatos soportados: .csv, .xlsx, .xls</p>
        </div>
      )}

      {/* Metricas personales */}
      {misMetricas && (
        <>
          {/* RESUMEN DEL DIA - 3 Numeros Principales */}
          {misMetricas.avanzadas && (
            <div className="rounded-2xl border p-6" style={{ background: 'rgba(99, 102, 241, 0.06)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
              <h3 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                RESUMEN DEL DIA
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl mb-1">{misMetricas.avanzadas.resumenDia.numero1.icono}</div>
                  <div className="text-2xl font-bold text-indigo-300">{misMetricas.avanzadas.resumenDia.numero1.valor}%</div>
                  <div className="text-xs text-indigo-400/60">{misMetricas.avanzadas.resumenDia.numero1.label}</div>
                </div>
                <div className="text-center border-x" style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                  <div className="text-3xl mb-1">{misMetricas.avanzadas.resumenDia.numero2.icono}</div>
                  <div className="text-2xl font-bold text-purple-300">{misMetricas.avanzadas.resumenDia.numero2.valor}</div>
                  <div className="text-xs text-purple-400/60">{misMetricas.avanzadas.resumenDia.numero2.label}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">{misMetricas.avanzadas.resumenDia.numero3.icono}</div>
                  <div className="text-2xl font-bold text-violet-300">{misMetricas.avanzadas.resumenDia.numero3.valor}</div>
                  <div className="text-xs text-violet-400/60">{misMetricas.avanzadas.resumenDia.numero3.label}</div>
                </div>
              </div>
            </div>
          )}

          {/* SEMAFORO + RACHA + EFICIENCIA */}
          {misMetricas.avanzadas && (
            <div className="grid grid-cols-3 gap-4">
              {/* Semaforo */}
              <div className="rounded-xl border p-4 text-center"
                style={{
                  background: misMetricas.avanzadas.semaforo === 'verde' ? 'rgba(16,185,129,0.08)' :
                    misMetricas.avanzadas.semaforo === 'amarillo' ? 'rgba(245,158,11,0.08)' :
                    misMetricas.avanzadas.semaforo === 'rojo' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                  borderColor: misMetricas.avanzadas.semaforo === 'verde' ? 'rgba(16,185,129,0.2)' :
                    misMetricas.avanzadas.semaforo === 'amarillo' ? 'rgba(245,158,11,0.2)' :
                    misMetricas.avanzadas.semaforo === 'rojo' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-4xl mb-2">
                  {misMetricas.avanzadas.semaforo === 'verde' && '🟢'}
                  {misMetricas.avanzadas.semaforo === 'amarillo' && '🟡'}
                  {misMetricas.avanzadas.semaforo === 'rojo' && '🔴'}
                  {misMetricas.avanzadas.semaforo === 'gris' && '⚪'}
                </div>
                <div className={`text-sm font-semibold ${
                  misMetricas.avanzadas.semaforo === 'verde' ? 'text-emerald-400' :
                  misMetricas.avanzadas.semaforo === 'amarillo' ? 'text-amber-400' :
                  misMetricas.avanzadas.semaforo === 'rojo' ? 'text-red-400' : 'text-white/40'
                }`}>
                  {misMetricas.avanzadas.semaforo === 'verde' && 'Excelente'}
                  {misMetricas.avanzadas.semaforo === 'amarillo' && 'Atencion'}
                  {misMetricas.avanzadas.semaforo === 'rojo' && 'Critico'}
                  {misMetricas.avanzadas.semaforo === 'gris' && 'Sin datos'}
                </div>
                <div className="text-xs text-white/30 mt-1">Semaforo</div>
              </div>

              {/* Racha */}
              <div className="rounded-xl border p-4 text-center" style={{ background: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                <div className="text-3xl mb-1">{misMetricas.avanzadas.racha.icono}</div>
                <div className="text-2xl font-bold text-orange-400">{misMetricas.avanzadas.racha.dias}</div>
                <div className="text-xs text-orange-400/60">{misMetricas.avanzadas.racha.dias === 1 ? 'dia' : 'dias'} en racha</div>
              </div>

              {/* Eficiencia */}
              <div className="rounded-xl border p-4 text-center"
                style={{
                  background: misMetricas.avanzadas.eficiencia >= 100 ? 'rgba(16,185,129,0.08)' :
                    misMetricas.avanzadas.eficiencia >= 80 ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)',
                  borderColor: misMetricas.avanzadas.eficiencia >= 100 ? 'rgba(16,185,129,0.2)' :
                    misMetricas.avanzadas.eficiencia >= 80 ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)',
                }}
              >
                <Zap className={`w-6 h-6 mx-auto mb-1 ${
                  misMetricas.avanzadas.eficiencia >= 100 ? 'text-emerald-400' :
                  misMetricas.avanzadas.eficiencia >= 80 ? 'text-blue-400' : 'text-red-400'
                }`} />
                <div className={`text-2xl font-bold ${
                  misMetricas.avanzadas.eficiencia >= 100 ? 'text-emerald-400' :
                  misMetricas.avanzadas.eficiencia >= 80 ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {misMetricas.avanzadas.eficiencia.toFixed(0)}%
                </div>
                <div className="text-xs text-white/30">Eficiencia (base: 3min/guia)</div>
              </div>
            </div>
          )}

          {/* META DIARIA */}
          {misMetricas.avanzadas && (
            <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Meta Diaria
                </h3>
                <span className="text-sm text-white/40">
                  {misMetricas.avanzadas.metaDiaria.guiasHoy} / {misMetricas.avanzadas.metaDiaria.metaGuias} guias
                </span>
              </div>
              <div className="relative h-6 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(misMetricas.avanzadas.metaDiaria.progreso, 100)}%`,
                    background: misMetricas.avanzadas.metaDiaria.progreso >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' :
                      misMetricas.avanzadas.metaDiaria.progreso >= 75 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' :
                      misMetricas.avanzadas.metaDiaria.progreso >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                  {misMetricas.avanzadas.metaDiaria.progreso.toFixed(0)}%
                </div>
              </div>
              {misMetricas.avanzadas.metaDiaria.progreso < 100 && misMetricas.avanzadas.metaDiaria.horasRestantes > 0 && (
                <p className="text-xs text-white/30 text-center">
                  A tu ritmo actual, te faltan ~{misMetricas.avanzadas.metaDiaria.horasRestantes.toFixed(1)}h para completar la meta
                </p>
              )}
              {misMetricas.avanzadas.metaDiaria.progreso >= 100 && (
                <p className="text-xs text-emerald-400 text-center font-medium">Meta cumplida! Excelente trabajo</p>
              )}
            </div>
          )}

          {/* Cards de metricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                {getTendenciaIcon(misMetricas.tendencia)}
              </div>
              <div className="text-2xl font-bold text-white">{misMetricas.totalRondas}</div>
              <div className="text-sm text-white/40">Rondas</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-white/30">/{misMetricas.totalGuiasIniciales}</span>
              </div>
              <div className="text-2xl font-bold text-white">{misMetricas.guiasRealizadas}</div>
              <div className="text-sm text-white/40">Guias Realizadas</div>
            </div>
            <div className="rounded-xl border p-4"
              style={{
                background: misMetricas.tasaExito >= 85 ? 'rgba(16,185,129,0.08)' :
                  misMetricas.tasaExito >= 70 ? 'rgba(59,130,246,0.08)' :
                  misMetricas.tasaExito >= 50 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                borderColor: misMetricas.tasaExito >= 85 ? 'rgba(16,185,129,0.2)' :
                  misMetricas.tasaExito >= 70 ? 'rgba(59,130,246,0.2)' :
                  misMetricas.tasaExito >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Target className={`w-5 h-5 ${misMetricas.tasaExito >= 85 ? 'text-emerald-400' : misMetricas.tasaExito >= 70 ? 'text-blue-400' : misMetricas.tasaExito >= 50 ? 'text-amber-400' : 'text-red-400'}`} />
                <span className="text-lg">{estadoColors.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${misMetricas.tasaExito >= 85 ? 'text-emerald-400' : misMetricas.tasaExito >= 70 ? 'text-blue-400' : misMetricas.tasaExito >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {misMetricas.tasaExito.toFixed(1)}%
              </div>
              <div className="text-sm text-white/40">Tasa de Exito</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-white/30">meta: {METRICAS_AVANZADAS.GUIAS_POR_HORA_ESPERADAS}</span>
              </div>
              <div className="text-2xl font-bold text-white">{misMetricas.guiasPorHora.toFixed(1)}</div>
              <div className="text-sm text-white/40">Guias/Hora</div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Mi Progreso
              </h3>
              <span className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background: misMetricas.estado === 'excelente' ? 'rgba(16,185,129,0.15)' :
                    misMetricas.estado === 'bueno' ? 'rgba(59,130,246,0.15)' :
                    misMetricas.estado === 'regular' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: misMetricas.estado === 'excelente' ? '#34d399' :
                    misMetricas.estado === 'bueno' ? '#60a5fa' :
                    misMetricas.estado === 'regular' ? '#fbbf24' : '#f87171',
                }}
              >
                {misMetricas.estado.charAt(0).toUpperCase() + misMetricas.estado.slice(1)}
              </span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(misMetricas.tasaExito, 100)}%`,
                  background: misMetricas.tasaExito >= 85 ? 'linear-gradient(90deg, #10b981, #059669)' :
                    misMetricas.tasaExito >= 70 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' :
                    misMetricas.tasaExito >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                }}
              />
              <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: `${UMBRALES.META_EXITO_EQUIPO}%` }}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">Meta: {UMBRALES.META_EXITO_EQUIPO}%</div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-white/30">
              <span>0%</span>
              <span className="font-medium text-emerald-400">Tu tasa: {misMetricas.tasaExito.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Desglose de Guias
              </h3>
              <div className="space-y-3">
                {[
                  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, label: 'Realizadas', value: misMetricas.guiasRealizadas, color: 'text-emerald-400' },
                  { icon: <XCircle className="w-4 h-4 text-red-400" />, label: 'Canceladas', value: misMetricas.canceladas, color: 'text-red-400' },
                  { icon: <Calendar className="w-4 h-4 text-blue-400" />, label: 'Agendadas', value: misMetricas.agendadas, color: 'text-blue-400' },
                  { icon: <Clock className="w-4 h-4 text-amber-400" />, label: 'Pendientes', value: misMetricas.pendientes, color: 'text-amber-400' },
                  { icon: <AlertTriangle className="w-4 h-4 text-orange-400" />, label: 'Novedades', value: misMetricas.novedades, color: 'text-orange-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-white/50">{item.icon}{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Tiempos
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/40">Tiempo Total</span>
                    <span className="font-semibold text-white">{Math.floor(misMetricas.tiempoTotal / 60)}h {Math.round(misMetricas.tiempoTotal % 60)}m</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((misMetricas.tiempoTotal / 480) * 100, 100)}%`, background: 'linear-gradient(90deg, #a855f7, #7c3aed)' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-sm text-white/40">Promedio por ronda</span>
                  <span className="font-semibold text-white">{misMetricas.tiempoPromedio.toFixed(1)} min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas personales */}
          {misMetricas.alertas.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Mis Alertas
              </h3>
              <div className="space-y-3">
                {misMetricas.alertas.map((alerta) => {
                  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                    critico: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)', text: 'text-red-400' },
                    urgente: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.15)', text: 'text-orange-400' },
                    atencion: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', text: 'text-amber-400' },
                    info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', text: 'text-blue-400' },
                  };
                  const c = colorMap[alerta.tipo] || colorMap.info;
                  return (
                    <div key={alerta.id} className="p-4 rounded-xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{alerta.icono}</span>
                        <div className="flex-1">
                          <p className={`font-medium ${c.text}`}>{alerta.mensaje}</p>
                          {alerta.accion && <p className={`text-sm mt-1 ${c.text} opacity-70`}>{alerta.accion}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recomendaciones Categorizadas */}
          <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-400" />
              Recomendaciones del Dia
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔴</span>
                  <h4 className="font-bold text-red-400">OBLIGATORIO</h4>
                </div>
                <ul className="space-y-2 text-sm text-red-300/80">
                  {misMetricas.tasaExito < UMBRALES.BUENO && (
                    <li className="flex items-start gap-2"><span className="text-red-400 font-bold">•</span><span>Mejorar tasa de exito - Actualmente {misMetricas.tasaExito.toFixed(1)}%, meta minima {UMBRALES.BUENO}%</span></li>
                  )}
                  {misMetricas.pendientes > 5 && (
                    <li className="flex items-start gap-2"><span className="text-red-400 font-bold">•</span><span>Resolver {misMetricas.pendientes} guias pendientes antes del cierre</span></li>
                  )}
                  {misMetricas.avanzadas && misMetricas.avanzadas.metaDiaria.progreso < 50 && (
                    <li className="flex items-start gap-2"><span className="text-red-400 font-bold">•</span><span>Alcanzar al menos 50% de la meta diaria ({METRICAS_AVANZADAS.META_DIARIA_GUIAS} guias)</span></li>
                  )}
                  {misMetricas.tasaExito >= UMBRALES.BUENO && misMetricas.pendientes <= 5 && (!misMetricas.avanzadas || misMetricas.avanzadas.metaDiaria.progreso >= 50) && (
                    <li className="flex items-start gap-2 text-emerald-400"><span className="font-bold">✓</span><span>Sin tareas obligatorias pendientes</span></li>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🟡</span>
                  <h4 className="font-bold text-amber-400">RECOMENDABLE</h4>
                </div>
                <ul className="space-y-2 text-sm text-amber-300/80">
                  {misMetricas.avanzadas && misMetricas.avanzadas.eficiencia < 100 && (
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span><span>Mejorar eficiencia - Actualmente {misMetricas.avanzadas.eficiencia.toFixed(0)}%, ideal 100%+</span></li>
                  )}
                  {misMetricas.novedades > 0 && (
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span><span>Revisar y resolver las {misMetricas.novedades} novedades reportadas</span></li>
                  )}
                  {misMetricas.avanzadas && misMetricas.avanzadas.metaDiaria.progreso < 100 && misMetricas.avanzadas.metaDiaria.progreso >= 50 && (
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span><span>Completar meta diaria - Faltan {METRICAS_AVANZADAS.META_DIARIA_GUIAS - misMetricas.avanzadas.metaDiaria.guiasHoy} guias</span></li>
                  )}
                  {misMetricas.avanzadas && misMetricas.avanzadas.racha.dias < 3 && (
                    <li className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span><span>Mantener rendimiento para construir racha (actualmente {misMetricas.avanzadas.racha.dias} dias)</span></li>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🟢</span>
                  <h4 className="font-bold text-emerald-400">MENOR RELEVANCIA</h4>
                </div>
                <ul className="space-y-2 text-sm text-emerald-300/80">
                  {misMetricas.avanzadas && misMetricas.avanzadas.analisisPorHorario && (
                    <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">•</span><span>Tu mejor hora es a las {misMetricas.avanzadas.analisisPorHorario.mejorHora} - aprovechala</span></li>
                  )}
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">•</span><span>Revisar estadisticas de dias anteriores para identificar patrones</span></li>
                  {misMetricas.canceladas > 0 && (
                    <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">•</span><span>Analizar razones de las {misMetricas.canceladas} guias canceladas</span></li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Sugerencia motivacional */}
          <div className="rounded-xl border p-6" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.12)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Lightbulb className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-400 mb-1">Sugerencia del dia</h4>
                <p className="text-emerald-300/70">
                  {misMetricas.tasaExito >= UMBRALES.EXCELENTE
                    ? 'Excelente trabajo! Manten este ritmo y seras un ejemplo para el equipo.'
                    : misMetricas.tasaExito >= UMBRALES.BUENO
                    ? 'Vas muy bien, un pequeno esfuerzo mas y alcanzaras la excelencia.'
                    : misMetricas.tasaExito >= UMBRALES.REGULAR
                    ? 'Enfocate en las rutas prioritarias para mejorar tu tasa de exito.'
                    : 'Revisa las rutas asignadas y consulta con tu supervisor para optimizar tu desempeno.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Si hay datos pero el usuario no aparece */}
      {datos && !misMetricas && (
        <div className="rounded-xl border p-6 text-center" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-semibold text-amber-300 mb-2">No se encontraron tus datos</h3>
          <p className="text-amber-400/70">
            El reporte cargado no contiene informacion para el usuario "{usuario}".
            Verifica que tu nombre aparezca correctamente en el archivo CSV.
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default OperadorDashboard;
