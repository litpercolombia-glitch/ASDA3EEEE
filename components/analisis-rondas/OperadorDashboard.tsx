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
import { COLORES_ESTADO, COLORES_ALERTA, UMBRALES, ICONOS, COLORES_SEMAFORO, METRICAS_AVANZADAS } from '../../constants/analisis-rondas';

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

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${estadoColors.bg} flex items-center justify-center`}>
              <User className={`w-7 h-7 ${estadoColors.text}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {ICONOS.USUARIO} {usuario}
                {miPosicion !== undefined && miPosicion >= 0 && (
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    (#{miPosicion + 1} en ranking)
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mi Panel de Rondas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={cargando}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {cargando ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Subir Reporte
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-navy-600 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Zona de carga si no hay datos */}
      {!datos && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-300 dark:border-navy-600 hover:border-emerald-400'
          }`}
        >
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Sube un archivo CSV o Excel
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Arrastra y suelta o haz clic en "Subir Reporte"
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Formatos soportados: .csv, .xlsx, .xls
          </p>
        </div>
      )}

      {/* Métricas personales */}
      {misMetricas && (
        <>
          {/* RESUMEN DEL DÍA - 3 Números Principales */}
          {misMetricas.avanzadas && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                RESUMEN DEL DÍA
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl mb-1">{misMetricas.avanzadas.resumenDia.numero1.icono}</div>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {misMetricas.avanzadas.resumenDia.numero1.valor}%
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">
                    {misMetricas.avanzadas.resumenDia.numero1.label}
                  </div>
                </div>
                <div className="text-center border-x border-indigo-200 dark:border-indigo-700">
                  <div className="text-3xl mb-1">{misMetricas.avanzadas.resumenDia.numero2.icono}</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {misMetricas.avanzadas.resumenDia.numero2.valor}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    {misMetricas.avanzadas.resumenDia.numero2.label}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">{misMetricas.avanzadas.resumenDia.numero3.icono}</div>
                  <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {misMetricas.avanzadas.resumenDia.numero3.valor}
                  </div>
                  <div className="text-xs text-violet-600 dark:text-violet-400">
                    {misMetricas.avanzadas.resumenDia.numero3.label}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEMÁFORO + RACHA + EFICIENCIA */}
          {misMetricas.avanzadas && (
            <div className="grid grid-cols-3 gap-4">
              {/* Semáforo */}
              <div className={`rounded-xl border p-4 text-center ${COLORES_SEMAFORO[misMetricas.avanzadas.semaforo].bg} ${COLORES_SEMAFORO[misMetricas.avanzadas.semaforo].border}`}>
                <div className="text-4xl mb-2">
                  {misMetricas.avanzadas.semaforo === 'verde' && '🟢'}
                  {misMetricas.avanzadas.semaforo === 'amarillo' && '🟡'}
                  {misMetricas.avanzadas.semaforo === 'rojo' && '🔴'}
                  {misMetricas.avanzadas.semaforo === 'gris' && '⚪'}
                </div>
                <div className={`text-sm font-semibold ${COLORES_SEMAFORO[misMetricas.avanzadas.semaforo].text}`}>
                  {misMetricas.avanzadas.semaforo === 'verde' && 'Excelente'}
                  {misMetricas.avanzadas.semaforo === 'amarillo' && 'Atención'}
                  {misMetricas.avanzadas.semaforo === 'rojo' && 'Crítico'}
                  {misMetricas.avanzadas.semaforo === 'gris' && 'Sin datos'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Semáforo</div>
              </div>

              {/* Racha */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4 text-center">
                <div className="text-3xl mb-1">{misMetricas.avanzadas.racha.icono}</div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {misMetricas.avanzadas.racha.dias}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  {misMetricas.avanzadas.racha.dias === 1 ? 'día' : 'días'} en racha
                </div>
              </div>

              {/* Eficiencia */}
              <div className={`rounded-xl border p-4 text-center ${
                misMetricas.avanzadas.eficiencia >= 100
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : misMetricas.avanzadas.eficiencia >= 80
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <Zap className={`w-6 h-6 mx-auto mb-1 ${
                  misMetricas.avanzadas.eficiencia >= 100 ? 'text-emerald-500' :
                  misMetricas.avanzadas.eficiencia >= 80 ? 'text-blue-500' : 'text-red-500'
                }`} />
                <div className={`text-2xl font-bold ${
                  misMetricas.avanzadas.eficiencia >= 100 ? 'text-emerald-700 dark:text-emerald-300' :
                  misMetricas.avanzadas.eficiencia >= 80 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {misMetricas.avanzadas.eficiencia.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Eficiencia (base: 3min/guía)
                </div>
              </div>
            </div>
          )}

          {/* META DIARIA */}
          {misMetricas.avanzadas && (
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Meta Diaria
                </h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {misMetricas.avanzadas.metaDiaria.guiasHoy} / {misMetricas.avanzadas.metaDiaria.metaGuias} guías
                </span>
              </div>
              <div className="relative h-6 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                    misMetricas.avanzadas.metaDiaria.progreso >= 100
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      : misMetricas.avanzadas.metaDiaria.progreso >= 75
                      ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                      : misMetricas.avanzadas.metaDiaria.progreso >= 50
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                      : 'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${Math.min(misMetricas.avanzadas.metaDiaria.progreso, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-700 dark:text-white">
                  {misMetricas.avanzadas.metaDiaria.progreso.toFixed(0)}%
                </div>
              </div>
              {misMetricas.avanzadas.metaDiaria.progreso < 100 && misMetricas.avanzadas.metaDiaria.horasRestantes > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  A tu ritmo actual, te faltan ~{misMetricas.avanzadas.metaDiaria.horasRestantes.toFixed(1)}h para completar la meta
                </p>
              )}
              {misMetricas.avanzadas.metaDiaria.progreso >= 100 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium">
                  ¡Meta cumplida! Excelente trabajo 🎉
                </p>
              )}
            </div>
          )}

          {/* Cards de métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Rondas */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-blue-500" />
                {getTendenciaIcon(misMetricas.tendencia)}
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {misMetricas.totalRondas}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Rondas</div>
            </div>

            {/* Guías Realizadas */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-emerald-500" />
                <span className="text-xs text-slate-500">
                  /{misMetricas.totalGuiasIniciales}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {misMetricas.guiasRealizadas}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Guías Realizadas</div>
            </div>

            {/* Tasa de Éxito */}
            <div className={`rounded-xl border p-4 ${estadoColors.bg} ${estadoColors.border}`}>
              <div className="flex items-center justify-between mb-2">
                <Target className={`w-5 h-5 ${estadoColors.text}`} />
                <span className="text-lg">{estadoColors.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${estadoColors.text}`}>
                {misMetricas.tasaExito.toFixed(1)}%
              </div>
              <div className={`text-sm ${estadoColors.text} opacity-80`}>Tasa de Éxito</div>
            </div>

            {/* Guías por Hora */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-xs text-slate-500">
                  meta: {METRICAS_AVANZADAS.GUIAS_POR_HORA_ESPERADAS}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {misMetricas.guiasPorHora.toFixed(1)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Guías/Hora</div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Mi Progreso
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColors.bg} ${estadoColors.text}`}>
                {misMetricas.estado.charAt(0).toUpperCase() + misMetricas.estado.slice(1)}
              </span>
            </div>

            <div className="relative h-4 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  misMetricas.tasaExito >= UMBRALES.EXCELENTE
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : misMetricas.tasaExito >= UMBRALES.BUENO
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                    : misMetricas.tasaExito >= UMBRALES.REGULAR
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${Math.min(misMetricas.tasaExito, 100)}%` }}
              />
              {/* Marcador de meta */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-white"
                style={{ left: `${UMBRALES.META_EXITO_EQUIPO}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap">
                  Meta: {UMBRALES.META_EXITO_EQUIPO}%
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span>0%</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Tu tasa: {misMetricas.tasaExito.toFixed(1)}%
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desglose de guías */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                Desglose de Guías
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Realizadas
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {misMetricas.guiasRealizadas}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Canceladas
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {misMetricas.canceladas}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Agendadas
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {misMetricas.agendadas}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Pendientes
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {misMetricas.pendientes}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Novedades
                  </span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {misMetricas.novedades}
                  </span>
                </div>
              </div>
            </div>

            {/* Tiempos */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                Tiempos
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tiempo Total</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {Math.floor(misMetricas.tiempoTotal / 60)}h {Math.round(misMetricas.tiempoTotal % 60)}m
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-navy-700 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                      style={{ width: `${Math.min((misMetricas.tiempoTotal / 480) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-navy-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Promedio por ronda</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {misMetricas.tiempoPromedio.toFixed(1)} min
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas personales */}
          {misMetricas.alertas.length > 0 && (
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Mis Alertas
              </h3>
              <div className="space-y-3">
                {misMetricas.alertas.map((alerta) => {
                  const alertaColors = COLORES_ALERTA[alerta.tipo];
                  return (
                    <div
                      key={alerta.id}
                      className={`p-4 rounded-xl border ${alertaColors.bg} ${alertaColors.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{alerta.icono}</span>
                        <div className="flex-1">
                          <p className={`font-medium ${alertaColors.text}`}>
                            {alerta.mensaje}
                          </p>
                          {alerta.accion && (
                            <p className={`text-sm mt-1 ${alertaColors.text} opacity-80`}>
                              💡 {alerta.accion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recomendaciones Categorizadas - Mi Día */}
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              Recomendaciones del Día
            </h3>
            <div className="space-y-4">
              {/* Obligatorio */}
              <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔴</span>
                  <h4 className="font-bold text-red-700 dark:text-red-400">OBLIGATORIO</h4>
                </div>
                <ul className="space-y-2 text-sm text-red-600 dark:text-red-300">
                  {misMetricas.tasaExito < UMBRALES.BUENO && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>Mejorar tasa de éxito - Actualmente {misMetricas.tasaExito.toFixed(1)}%, meta mínima {UMBRALES.BUENO}%</span>
                    </li>
                  )}
                  {misMetricas.pendientes > 5 && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>Resolver {misMetricas.pendientes} guías pendientes antes del cierre</span>
                    </li>
                  )}
                  {misMetricas.avanzadas && misMetricas.avanzadas.metaDiaria.progreso < 50 && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>Alcanzar al menos 50% de la meta diaria ({METRICAS_AVANZADAS.META_DIARIA_GUIAS} guías)</span>
                    </li>
                  )}
                  {misMetricas.tasaExito >= UMBRALES.BUENO && misMetricas.pendientes <= 5 && (!misMetricas.avanzadas || misMetricas.avanzadas.metaDiaria.progreso >= 50) && (
                    <li className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                      <span className="font-bold">✓</span>
                      <span>¡Sin tareas obligatorias pendientes!</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Recomendable */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🟡</span>
                  <h4 className="font-bold text-amber-700 dark:text-amber-400">RECOMENDABLE</h4>
                </div>
                <ul className="space-y-2 text-sm text-amber-600 dark:text-amber-300">
                  {misMetricas.avanzadas && misMetricas.avanzadas.eficiencia < 100 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>Mejorar eficiencia - Actualmente {misMetricas.avanzadas.eficiencia.toFixed(0)}%, ideal 100%+</span>
                    </li>
                  )}
                  {misMetricas.novedades > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>Revisar y resolver las {misMetricas.novedades} novedades reportadas</span>
                    </li>
                  )}
                  {misMetricas.avanzadas && misMetricas.avanzadas.metaDiaria.progreso < 100 && misMetricas.avanzadas.metaDiaria.progreso >= 50 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>Completar meta diaria - Faltan {METRICAS_AVANZADAS.META_DIARIA_GUIAS - misMetricas.avanzadas.metaDiaria.guiasHoy} guías</span>
                    </li>
                  )}
                  {misMetricas.avanzadas && misMetricas.avanzadas.racha.dias < 3 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>Mantener rendimiento para construir racha (actualmente {misMetricas.avanzadas.racha.dias} días)</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Menor Relevancia */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🟢</span>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">MENOR RELEVANCIA</h4>
                </div>
                <ul className="space-y-2 text-sm text-emerald-600 dark:text-emerald-300">
                  {misMetricas.avanzadas && misMetricas.avanzadas.analisisPorHorario && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Tu mejor hora es a las {misMetricas.avanzadas.analisisPorHorario.mejorHora} - aprovéchala</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Revisar estadísticas de días anteriores para identificar patrones</span>
                  </li>
                  {misMetricas.canceladas > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Analizar razones de las {misMetricas.canceladas} guías canceladas</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Sugerencia motivacional */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  Sugerencia del día
                </h4>
                <p className="text-emerald-700 dark:text-emerald-400">
                  {misMetricas.tasaExito >= UMBRALES.EXCELENTE
                    ? '¡Excelente trabajo! Mantén este ritmo y serás un ejemplo para el equipo.'
                    : misMetricas.tasaExito >= UMBRALES.BUENO
                    ? 'Vas muy bien, un pequeño esfuerzo más y alcanzarás la excelencia.'
                    : misMetricas.tasaExito >= UMBRALES.REGULAR
                    ? 'Enfócate en las rutas prioritarias para mejorar tu tasa de éxito.'
                    : 'Revisa las rutas asignadas y consulta con tu supervisor para optimizar tu desempeño.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Si hay datos pero el usuario no aparece */}
      {datos && !misMetricas && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">
            No se encontraron tus datos
          </h3>
          <p className="text-amber-700 dark:text-amber-400">
            El reporte cargado no contiene información para el usuario "{usuario}".
            Verifica que tu nombre aparezca correctamente en el archivo CSV.
          </p>
        </div>
      )}
    </div>
  );
};

export default OperadorDashboard;
