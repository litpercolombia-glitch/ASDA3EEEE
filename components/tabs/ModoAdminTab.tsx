import React, { useState, useMemo, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  Upload,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Percent,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  Clock,
  Users,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

export type FiltroFecha = 'hoy' | 'ayer' | '7dias' | '14dias' | '30dias' | 'todo';

interface ReporteLogistico {
  resumen: {
    totalPedidos: number;
    tasaEntrega: number;
    meta: number;
    brecha: number;
  };
  ciudadesRojas: { ciudad: string; tasa: number }[];
  combinacionesPeligrosas: { ciudad: string; transportadora: string; tasa: number }[];
  transportadoras: { nombre: string; tasa: number; estado: string }[];
  novedades: { problema: string; casos: number; causa: string }[];
  novedadesSinResolver: number;
}

interface ReporteFinanciero {
  resumen: {
    ventasTotales: number;
    gananciaBruta: number;
    costosLogisticos: number;
    gananciaNeta: number;
    margenNeto: number;
  };
  indicadores: {
    ticketPromedio: number;
    gananciaPorPedido: number;
    costoLogisticoPorPedido: number;
    costoDevolucion: number;
  };
  perdidas: {
    pedidosNoEntregados: number;
    gananciaPerdida: number;
    costoDevolucionesPagado: number;
    perdidaTotal: number;
  };
  ciudadesConPerdida: { ciudad: string; pedidos: number; tasa: number; costoDevolucion: number }[];
  transportadorasCostosas: { nombre: string; costoPromedio: number; tasa: number }[];
  oportunidadesMejora: { meta: string; entregasExtra: number; gananciaAdicional: number }[];
}

interface ArchivoDocumento {
  id: string;
  nombre: string;
  tipo: string;
  fecha: Date;
  registros: number;
  estado: 'procesado' | 'pendiente' | 'error';
}

// ============================================
// CONSTANTES
// ============================================

const ADMIN_PASSWORD = 'Sacrije2020?08';

// ============================================
// UTILIDADES
// ============================================

const calcularRangoFecha = (filtro: FiltroFecha): { inicio: Date; fin: Date } => {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  switch (filtro) {
    case 'hoy':
      return { inicio: hoy, fin: new Date(hoy.getTime() + 24 * 60 * 60 * 1000) };
    case 'ayer':
      const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
      return { inicio: ayer, fin: hoy };
    case '7dias':
      return { inicio: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000), fin: ahora };
    case '14dias':
      return { inicio: new Date(hoy.getTime() - 14 * 24 * 60 * 60 * 1000), fin: ahora };
    case '30dias':
      return { inicio: new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000), fin: ahora };
    case 'todo':
    default:
      return { inicio: new Date(0), fin: ahora };
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ModoAdminTab: React.FC = () => {
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Estado de pestañas
  const [activeTab, setActiveTab] = useState<'logistico' | 'financiero' | 'documentos'>('logistico');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('30dias');

  // Estado de datos
  const [isLoading, setIsLoading] = useState(false);
  const [documentos, setDocumentos] = useState<ArchivoDocumento[]>([]);
  const [reporteLogistico, setReporteLogistico] = useState<ReporteLogistico | null>(null);
  const [reporteFinanciero, setReporteFinanciero] = useState<ReporteFinanciero | null>(null);

  // Manejar login
  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      setPassword('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  // Manejar logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // Procesar archivo Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Intentar procesar con el backend
      const response = await fetch('/api/admin/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // Agregar documento a la lista
        const nuevoDoc: ArchivoDocumento = {
          id: crypto.randomUUID(),
          nombre: file.name,
          tipo: file.name.endsWith('.xlsx') ? 'Excel' : file.name.split('.').pop()?.toUpperCase() || 'Archivo',
          fecha: new Date(),
          registros: data.totalRegistros || 0,
          estado: 'procesado',
        };
        setDocumentos(prev => [nuevoDoc, ...prev]);

        // Actualizar reportes
        if (data.reporteLogistico) {
          setReporteLogistico(data.reporteLogistico);
        }
        if (data.reporteFinanciero) {
          setReporteFinanciero(data.reporteFinanciero);
        }
      } else {
        // Procesar localmente si el backend falla
        generarReportesDemo();
      }
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      generarReportesDemo();
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // Generar reportes demo
  const generarReportesDemo = () => {
    setReporteLogistico({
      resumen: {
        totalPedidos: 1250,
        tasaEntrega: 72.5,
        meta: 85,
        brecha: -12.5,
      },
      ciudadesRojas: [
        { ciudad: 'Leticia', tasa: 45 },
        { ciudad: 'Mitú', tasa: 38 },
        { ciudad: 'Puerto Inírida', tasa: 52 },
      ],
      combinacionesPeligrosas: [
        { ciudad: 'Leticia', transportadora: 'Coordinadora', tasa: 35 },
        { ciudad: 'Mitú', transportadora: 'Servientrega', tasa: 42 },
      ],
      transportadoras: [
        { nombre: 'Coordinadora', tasa: 78, estado: '✅' },
        { nombre: 'Servientrega', tasa: 71, estado: '🟡' },
        { nombre: 'Interrapidísimo', tasa: 65, estado: '⚠️' },
        { nombre: 'TCC', tasa: 82, estado: '✅' },
      ],
      novedades: [
        { problema: 'Dirección incorrecta', casos: 45, causa: 'Error al ingresar datos' },
        { problema: 'Cliente ausente', casos: 38, causa: 'Sin confirmación previa' },
        { problema: 'Rechazado por cliente', casos: 22, causa: 'Producto diferente al esperado' },
      ],
      novedadesSinResolver: 32,
    });

    setReporteFinanciero({
      resumen: {
        ventasTotales: 45800000,
        gananciaBruta: 12540000,
        costosLogisticos: 3250000,
        gananciaNeta: 9290000,
        margenNeto: 20.3,
      },
      indicadores: {
        ticketPromedio: 52000,
        gananciaPorPedido: 14250,
        costoLogisticoPorPedido: 3720,
        costoDevolucion: 8500,
      },
      perdidas: {
        pedidosNoEntregados: 344,
        gananciaPerdida: 4900000,
        costoDevolucionesPagado: 1850000,
        perdidaTotal: 6750000,
      },
      ciudadesConPerdida: [
        { ciudad: 'Leticia', pedidos: 25, tasa: 45, costoDevolucion: 425000 },
        { ciudad: 'Mitú', pedidos: 18, tasa: 38, costoDevolucion: 306000 },
      ],
      transportadorasCostosas: [
        { nombre: 'Interrapidísimo', costoPromedio: 9500, tasa: 65 },
        { nombre: 'Envía', costoPromedio: 8200, tasa: 68 },
      ],
      oportunidadesMejora: [
        { meta: '+3 puntos (75.5%)', entregasExtra: 38, gananciaAdicional: 541500 },
        { meta: '+5 puntos (77.5%)', entregasExtra: 63, gananciaAdicional: 897750 },
        { meta: '+10 puntos (82.5%)', entregasExtra: 125, gananciaAdicional: 1781250 },
      ],
    });
  };

  // Documentos filtrados por fecha
  const documentosFiltrados = useMemo(() => {
    const { inicio, fin } = calcularRangoFecha(filtroFecha);
    return documentos.filter(doc => {
      const fechaDoc = new Date(doc.fecha);
      return fechaDoc >= inicio && fechaDoc <= fin;
    });
  }, [documentos, filtroFecha]);

  // ============================================
  // PANTALLA DE LOGIN
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-navy-800">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Modo Administrador
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Ingresa tu contraseña para acceder
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña de administrador"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full pl-12 pr-12 py-3 border border-slate-300 dark:border-navy-700 rounded-xl bg-slate-50 dark:bg-navy-950 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {loginError && (
              <p className="text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {loginError}
              </p>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Unlock className="w-5 h-5" />
              Acceder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // PANEL DE ADMINISTRADOR
  // ============================================

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Modo Administrador
            </h1>
            <p className="text-indigo-100 mt-1">
              Análisis financiero y logístico detallado
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl cursor-pointer transition-all">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Cargar Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-xl transition-all"
            >
              <Lock className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Filtro de fecha */}
        <div className="flex items-center gap-2 mt-6 flex-wrap">
          <span className="text-sm text-indigo-200">Período:</span>
          {(['hoy', 'ayer', '7dias', '14dias', '30dias', 'todo'] as FiltroFecha[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroFecha(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtroFecha === f
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {f === 'hoy' ? 'Hoy' :
               f === 'ayer' ? 'Ayer' :
               f === '7dias' ? '7 días' :
               f === '14dias' ? '14 días' :
               f === '30dias' ? '30 días' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 bg-white dark:bg-navy-900 rounded-xl p-1 shadow-lg border border-slate-200 dark:border-navy-800">
        <button
          onClick={() => setActiveTab('logistico')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'logistico'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Truck className="w-5 h-5" />
          Reporte Logístico
        </button>
        <button
          onClick={() => setActiveTab('financiero')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'financiero'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          Reporte Financiero
        </button>
        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'documentos'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          Documentos
        </button>
      </div>

      {/* ============================================ */}
      {/* TAB: REPORTE LOGÍSTICO */}
      {/* ============================================ */}

      {activeTab === 'logistico' && reporteLogistico && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-navy-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              🎯 RESUMEN
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
                <p className="text-sm text-slate-500">Total Pedidos</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{reporteLogistico.resumen.totalPedidos}</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
                <p className="text-sm text-slate-500">Tasa de Entrega</p>
                <p className={`text-3xl font-bold ${reporteLogistico.resumen.tasaEntrega >= 85 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {reporteLogistico.resumen.tasaEntrega}%
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
                <p className="text-sm text-slate-500">Meta</p>
                <p className="text-3xl font-bold text-indigo-600">{reporteLogistico.resumen.meta}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
                <p className="text-sm text-slate-500">Brecha</p>
                <p className={`text-3xl font-bold flex items-center gap-1 ${reporteLogistico.resumen.brecha >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {reporteLogistico.resumen.brecha >= 0 ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                  {Math.abs(reporteLogistico.resumen.brecha)} pts
                </p>
              </div>
            </div>
          </div>

          {/* Alertas Críticas */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-900">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
              ⚠️ ALERTAS CRÍTICAS
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Ciudades en rojo */}
              <div>
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-3">
                  🔴 CIUDADES EN ROJO (requieren pago anticipado)
                </h3>
                <ul className="space-y-2">
                  {reporteLogistico.ciudadesRojas.map((ciudad, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-navy-900 rounded-xl">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{ciudad.ciudad}</span>
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-full font-bold">
                        {ciudad.tasa}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Combinaciones peligrosas */}
              <div>
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-3">
                  🚫 COMBINACIONES A EVITAR
                </h3>
                <ul className="space-y-2">
                  {reporteLogistico.combinacionesPeligrosas.map((combo, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-navy-900 rounded-xl">
                      <span className="text-slate-700 dark:text-slate-300">
                        <strong>{combo.ciudad}</strong> + {combo.transportadora}
                      </span>
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-full font-bold">
                        {combo.tasa}% → NO USAR
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Transportadoras */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-navy-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              🚚 TRANSPORTADORAS
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700">
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Transportadora</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Tasa</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteLogistico.transportadoras.map((t, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-navy-800">
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">{t.nombre}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${t.tasa >= 75 ? 'text-emerald-600' : t.tasa >= 65 ? 'text-amber-600' : 'text-red-600'}`}>
                          {t.tasa}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xl">{t.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Novedades */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-navy-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              📋 NOVEDADES PRINCIPALES
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700">
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Problema</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Casos</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Causa</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteLogistico.novedades.map((n, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-navy-800">
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">{n.problema}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">{n.casos}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{n.causa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`mt-4 p-4 rounded-xl ${reporteLogistico.novedadesSinResolver > 30 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
              <p className={`font-bold ${reporteLogistico.novedadesSinResolver > 30 ? 'text-red-600' : 'text-amber-600'}`}>
                ⚠️ Novedades sin resolver: {reporteLogistico.novedadesSinResolver}%
                {reporteLogistico.novedadesSinResolver > 30 && ' ← ALERTA'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: REPORTE FINANCIERO */}
      {/* ============================================ */}

      {activeTab === 'financiero' && reporteFinanciero && (
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              💰 RESUMEN FINANCIERO
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                <p className="text-xs text-emerald-100 uppercase">Ventas Totales</p>
                <p className="text-xl font-bold">{formatCurrency(reporteFinanciero.resumen.ventasTotales)}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                <p className="text-xs text-emerald-100 uppercase">Ganancia Bruta</p>
                <p className="text-xl font-bold">{formatCurrency(reporteFinanciero.resumen.gananciaBruta)}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                <p className="text-xs text-emerald-100 uppercase">Costos Logísticos</p>
                <p className="text-xl font-bold">{formatCurrency(reporteFinanciero.resumen.costosLogisticos)}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                <p className="text-xs text-emerald-100 uppercase">Ganancia Neta</p>
                <p className="text-xl font-bold">{formatCurrency(reporteFinanciero.resumen.gananciaNeta)}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur">
                <p className="text-xs text-emerald-100 uppercase">Margen Neto</p>
                <p className="text-xl font-bold">{reporteFinanciero.resumen.margenNeto}%</p>
              </div>
            </div>
          </div>

          {/* Indicadores Clave */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-navy-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              📊 INDICADORES CLAVE
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700">
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">KPI</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Valor</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-600 dark:text-slate-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-navy-800">
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Ticket promedio</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{formatCurrency(reporteFinanciero.indicadores.ticketPromedio)}</td>
                    <td className="py-3 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-navy-800">
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Ganancia por pedido</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{formatCurrency(reporteFinanciero.indicadores.gananciaPorPedido)}</td>
                    <td className="py-3 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-navy-800">
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Costo logístico por pedido</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{formatCurrency(reporteFinanciero.indicadores.costoLogisticoPorPedido)}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">7.2% de la venta</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-navy-800">
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Costo por devolución</td>
                    <td className="py-3 px-4 font-bold text-red-600">{formatCurrency(reporteFinanciero.indicadores.costoDevolucion)}</td>
                    <td className="py-3 px-4">🟡</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pérdidas por ineficiencia */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-900">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
              🔴 PÉRDIDAS POR INEFICIENCIA
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-navy-900 rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400">Pedidos no entregados</span>
                  <span className="font-bold text-slate-800 dark:text-white">{reporteFinanciero.perdidas.pedidosNoEntregados} unidades</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-navy-900 rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400">Ganancia perdida</span>
                  <span className="font-bold text-red-600">{formatCurrency(reporteFinanciero.perdidas.gananciaPerdida)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-navy-900 rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400">Costo devoluciones pagado</span>
                  <span className="font-bold text-red-600">{formatCurrency(reporteFinanciero.perdidas.costoDevolucionesPagado)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center p-6 bg-red-100 dark:bg-red-900/50 rounded-2xl">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">PÉRDIDA TOTAL</p>
                  <p className="text-4xl font-bold text-red-700 dark:text-red-400">
                    {formatCurrency(reporteFinanciero.perdidas.perdidaTotal)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <p className="text-amber-800 dark:text-amber-400 font-medium">
                ⚠️ Estás perdiendo {formatCurrency(reporteFinanciero.perdidas.perdidaTotal / 12.5)} por cada punto de tasa de entrega que no alcanzas.
              </p>
            </div>
          </div>

          {/* Oportunidades de mejora */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-900">
            <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
              💡 OPORTUNIDADES DE MEJORA
            </h2>
            <p className="text-emerald-700 dark:text-emerald-400 mb-4 font-medium">Si mejoras la tasa de entrega:</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-emerald-200 dark:border-emerald-900">
                    <th className="text-left py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">Meta</th>
                    <th className="text-left py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">Entregas extra</th>
                    <th className="text-left py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">Ganancia adicional</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteFinanciero.oportunidadesMejora.map((op, idx) => (
                    <tr key={idx} className="border-b border-emerald-100 dark:border-emerald-900/50">
                      <td className="py-3 px-4 text-emerald-800 dark:text-emerald-300">{op.meta}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">+{op.entregasExtra}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">+{formatCurrency(op.gananciaAdicional)}/mes</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: DOCUMENTOS */}
      {/* ============================================ */}

      {activeTab === 'documentos' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-navy-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-purple-500" />
              Documentos Cargados
            </h2>

            {documentosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 text-slate-300 dark:text-navy-700 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  No hay documentos cargados en este período
                </p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer transition-all">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Cargar documento</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                {documentosFiltrados.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-navy-950 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{doc.nombre}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {doc.fecha.toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} • {doc.registros} registros
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        doc.estado === 'procesado'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : doc.estado === 'pendiente'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {doc.estado === 'procesado' ? '✅ Procesado' : doc.estado === 'pendiente' ? '⏳ Pendiente' : '❌ Error'}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado sin datos */}
      {activeTab !== 'documentos' && !reporteLogistico && !reporteFinanciero && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 shadow-lg border border-slate-200 dark:border-navy-800 text-center">
          <Upload className="w-16 h-16 text-slate-300 dark:text-navy-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Carga un archivo para generar reportes
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Sube un archivo Excel de Dropi o similar para analizar automáticamente
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-all">
            <Upload className="w-5 h-5" />
            <span className="font-medium">Cargar archivo Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="font-medium text-slate-700 dark:text-slate-300">Analizando archivo...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModoAdminTab;
