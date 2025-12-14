/**
 * 🏢 LITPER PROCESOS - Sistema de Control de Procesos Logísticos
 *
 * Módulo completo para registro de guías y novedades con:
 * - Cronómetro inteligente con alertas
 * - Formularios de generación de guías por rondas
 * - Registro de novedades
 * - Dashboard administrativo
 * - Gamificación y mensajes motivacionales
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Crown,
  Package,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Save,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Award,
  Target,
  Zap,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  User,
  Truck,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// =====================================
// TIPOS E INTERFACES
// =====================================
interface ProcesosLitperTabProps {
  selectedCountry?: string;
}

interface Usuario {
  id: string;
  nombre: string;
  avatar?: string;
}

interface RondaGuias {
  id: string;
  numero: number;
  usuarioId: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  tiempoTotal: number; // en segundos
  pedidosIniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;
  tiempoPromedio: number; // minutos por pedido
}

interface RegistroNovedades {
  id: string;
  usuarioId: string;
  fecha: string;
  hora: string;
  solucionadas: number;
  revisadas: number;
  devolucion: number;
  cliente: number;
  transportadora: number;
  litper: number;
}

interface ConfiguracionCronometro {
  tiempoPorRonda: number; // minutos
  tiempoPromedioGuia: number; // minutos
  alertaTemprana: number; // segundos
  alertaCritica: number; // segundos
  sonidoActivo: boolean;
  notificacionesActivas: boolean;
  mensajesMotivacionales: boolean;
}

// =====================================
// CONSTANTES
// =====================================
const STORAGE_KEY_RONDAS = 'litper_procesos_rondas';
const STORAGE_KEY_NOVEDADES = 'litper_procesos_novedades';
const STORAGE_KEY_CONFIG = 'litper_procesos_config';
const STORAGE_KEY_USUARIOS = 'litper_procesos_usuarios';

const USUARIOS_DEFAULT: Usuario[] = [
  { id: '1', nombre: 'EVAN' },
  { id: '2', nombre: 'MARIA' },
  { id: '3', nombre: 'CARLOS' },
  { id: '4', nombre: 'ANA' },
  { id: '5', nombre: 'PEDRO' },
];

const CONFIG_DEFAULT: ConfiguracionCronometro = {
  tiempoPorRonda: 25,
  tiempoPromedioGuia: 3,
  alertaTemprana: 150, // 2:30 min
  alertaCritica: 240, // 4:00 min
  sonidoActivo: true,
  notificacionesActivas: true,
  mensajesMotivacionales: true,
};

const MENSAJES_MOTIVACIONALES = [
  "💪 ¡Tú puedes! Solo un poco más rápido y rompes tu récord.",
  "🚀 ¡Vamos equipo Litper! Cada guía nos acerca al objetivo.",
  "⭐ ¡Eres crack! Recuerda: eficiencia + calidad = éxito.",
  "🎯 ¡Enfócate! Estás a punto de terminar esta guía.",
  "🏆 ¡Campeón/a! El equipo Litper cuenta contigo.",
  "💡 Tip: Si es muy compleja, márcala como 'Difícil' y continúa.",
  "🌟 ¡Excelente trabajo! Mantén ese ritmo ganador.",
  "⚡ ¡Velocidad Litper activada! Tú lo logras.",
];

// =====================================
// HELPERS
// =====================================
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
};

// =====================================
// COMPONENTE: CONTADOR
// =====================================
const Counter: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
  color: string;
  min?: number;
}> = ({ label, value, onChange, icon, color, min = 0 }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl ${color} transition-all`}>
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-10 text-center font-bold text-lg">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// =====================================
// COMPONENTE: CRONÓMETRO CIRCULAR
// =====================================
const CircularTimer: React.FC<{
  seconds: number;
  maxSeconds: number;
  alertaTemprana: number;
  alertaCritica: number;
  isRunning: boolean;
}> = ({ seconds, maxSeconds, alertaTemprana, alertaCritica, isRunning }) => {
  const progress = Math.min((seconds / maxSeconds) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let color = 'text-emerald-500';
  let bgColor = 'stroke-emerald-500';
  if (seconds >= alertaCritica) {
    color = 'text-red-500';
    bgColor = 'stroke-red-500';
  } else if (seconds >= alertaTemprana) {
    color = 'text-amber-500';
    bgColor = 'stroke-amber-500';
  }

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200 dark:text-navy-700"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${bgColor} transition-all duration-300`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{formatTime(seconds)}</span>
        {isRunning && (
          <span className="text-xs text-slate-500 animate-pulse">En curso</span>
        )}
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE PRINCIPAL: PROCESOS LITPER TAB
// =====================================
export const ProcesosLitperTab: React.FC<ProcesosLitperTabProps> = ({ selectedCountry }) => {
  // Estados principales
  const [modo, setModo] = useState<'selector' | 'usuario' | 'admin'>('selector');
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<'guias' | 'novedades' | null>(null);

  // Estados de datos
  const [rondas, setRondas] = useState<RondaGuias[]>([]);
  const [novedades, setNovedades] = useState<RegistroNovedades[]>([]);
  const [config, setConfig] = useState<ConfiguracionCronometro>(CONFIG_DEFAULT);
  const [usuarios] = useState<Usuario[]>(USUARIOS_DEFAULT);

  // Estados del cronómetro
  const [tiempoActual, setTiempoActual] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [rondaActual, setRondaActual] = useState(1);

  // Estados del formulario de guías
  const [pedidosIniciales, setPedidosIniciales] = useState(0);
  const [realizado, setRealizado] = useState(0);
  const [cancelado, setCancelado] = useState(0);
  const [agendado, setAgendado] = useState(0);
  const [dificiles, setDificiles] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [revisado, setRevisado] = useState(0);

  // Estados del formulario de novedades
  const [solucionadas, setSolucionadas] = useState(0);
  const [revisadas, setRevisadas] = useState(0);
  const [devolucion, setDevolucion] = useState(0);
  const [clienteNov, setClienteNov] = useState(0);
  const [transportadoraNov, setTransportadoraNov] = useState(0);
  const [litperNov, setLitperNov] = useState(0);

  // Estados de UI
  const [showMensaje, setShowMensaje] = useState(false);
  const [mensajeActual, setMensajeActual] = useState('');
  const [vistaAdmin, setVistaAdmin] = useState<'hoy' | 'semana' | 'mes' | 'equipo' | 'config'>('hoy');

  // Cargar datos al montar
  useEffect(() => {
    setRondas(loadFromStorage(STORAGE_KEY_RONDAS, []));
    setNovedades(loadFromStorage(STORAGE_KEY_NOVEDADES, []));
    setConfig(loadFromStorage(STORAGE_KEY_CONFIG, CONFIG_DEFAULT));
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    saveToStorage(STORAGE_KEY_RONDAS, rondas);
  }, [rondas]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_NOVEDADES, novedades);
  }, [novedades]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_CONFIG, config);
  }, [config]);

  // Cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cronometroActivo) {
      interval = setInterval(() => {
        setTiempoActual((prev) => {
          const newTime = prev + 1;
          // Mostrar mensaje motivacional si excede tiempo
          if (config.mensajesMotivacionales && newTime === config.alertaCritica) {
            const mensaje = MENSAJES_MOTIVACIONALES[Math.floor(Math.random() * MENSAJES_MOTIVACIONALES.length)];
            setMensajeActual(mensaje);
            setShowMensaje(true);
            setTimeout(() => setShowMensaje(false), 5000);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cronometroActivo, config.mensajesMotivacionales, config.alertaCritica]);

  // Calcular tiempo promedio
  const tiempoPromedio = useMemo(() => {
    const totalProcesados = realizado + cancelado + agendado;
    if (totalProcesados === 0 || tiempoActual === 0) return 0;
    return (tiempoActual / 60 / totalProcesados).toFixed(2);
  }, [realizado, cancelado, agendado, tiempoActual]);

  // Finalizar ronda
  const finalizarRonda = () => {
    if (!usuarioActual) return;

    const nuevaRonda: RondaGuias = {
      id: `ronda-${Date.now()}`,
      numero: rondaActual,
      usuarioId: usuarioActual.id,
      fecha: new Date().toLocaleDateString('es-CO'),
      horaInicio: new Date(Date.now() - tiempoActual * 1000).toLocaleTimeString('es-CO'),
      horaFin: new Date().toLocaleTimeString('es-CO'),
      tiempoTotal: tiempoActual,
      pedidosIniciales,
      realizado,
      cancelado,
      agendado,
      dificiles,
      pendientes,
      revisado,
      tiempoPromedio: parseFloat(tiempoPromedio as string) || 0,
    };

    setRondas((prev) => [...prev, nuevaRonda]);

    // Resetear para nueva ronda
    setRondaActual((prev) => prev + 1);
    setTiempoActual(0);
    setCronometroActivo(false);
    setPedidosIniciales(0);
    setRealizado(0);
    setCancelado(0);
    setAgendado(0);
    setDificiles(0);
    setPendientes(0);
    setRevisado(0);
  };

  // Guardar novedades
  const guardarNovedades = () => {
    if (!usuarioActual) return;

    const nuevoRegistro: RegistroNovedades = {
      id: `nov-${Date.now()}`,
      usuarioId: usuarioActual.id,
      fecha: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO'),
      solucionadas,
      revisadas,
      devolucion,
      cliente: clienteNov,
      transportadora: transportadoraNov,
      litper: litperNov,
    };

    setNovedades((prev) => [...prev, nuevoRegistro]);

    // Resetear
    setSolucionadas(0);
    setRevisadas(0);
    setDevolucion(0);
    setClienteNov(0);
    setTransportadoraNov(0);
    setLitperNov(0);
  };

  // Estadísticas del día
  const estadisticasHoy = useMemo(() => {
    const hoy = new Date().toLocaleDateString('es-CO');
    const rondasHoy = rondas.filter((r) => r.fecha === hoy);
    const novedadesHoy = novedades.filter((n) => n.fecha === hoy);

    return {
      totalRondas: rondasHoy.length,
      totalPedidos: rondasHoy.reduce((acc, r) => acc + r.pedidosIniciales, 0),
      totalRealizado: rondasHoy.reduce((acc, r) => acc + r.realizado, 0),
      totalCancelado: rondasHoy.reduce((acc, r) => acc + r.cancelado, 0),
      totalAgendado: rondasHoy.reduce((acc, r) => acc + r.agendado, 0),
      totalDificiles: rondasHoy.reduce((acc, r) => acc + r.dificiles, 0),
      promedioGeneral: rondasHoy.length > 0
        ? (rondasHoy.reduce((acc, r) => acc + r.tiempoPromedio, 0) / rondasHoy.length).toFixed(2)
        : '0',
      novedadesSolucionadas: novedadesHoy.reduce((acc, n) => acc + n.solucionadas, 0),
      novedadesTotal: novedadesHoy.reduce((acc, n) => acc + n.solucionadas + n.revisadas + n.devolucion, 0),
    };
  }, [rondas, novedades]);

  // Exportar a Excel
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja de rondas
    const rondasData = [
      ['REGISTRO DE RONDAS - LITPER PROCESOS'],
      [''],
      ['Fecha', 'Usuario', 'Ronda', 'Hora Inicio', 'Hora Fin', 'Tiempo Total', 'Pedidos', 'Realizado', 'Cancelado', 'Agendado', 'Difíciles', 'T. Promedio'],
      ...rondas.map((r) => [
        r.fecha,
        usuarios.find((u) => u.id === r.usuarioId)?.nombre || 'N/A',
        r.numero,
        r.horaInicio,
        r.horaFin || 'En curso',
        formatTime(r.tiempoTotal),
        r.pedidosIniciales,
        r.realizado,
        r.cancelado,
        r.agendado,
        r.dificiles,
        r.tiempoPromedio.toFixed(2) + ' min',
      ]),
    ];
    const wsRondas = XLSX.utils.aoa_to_sheet(rondasData);
    XLSX.utils.book_append_sheet(wb, wsRondas, 'Rondas');

    // Hoja de novedades
    const novedadesData = [
      ['REGISTRO DE NOVEDADES - LITPER PROCESOS'],
      [''],
      ['Fecha', 'Hora', 'Usuario', 'Solucionadas', 'Revisadas', 'Devolución', 'Cliente', 'Transportadora', 'Litper'],
      ...novedades.map((n) => [
        n.fecha,
        n.hora,
        usuarios.find((u) => u.id === n.usuarioId)?.nombre || 'N/A',
        n.solucionadas,
        n.revisadas,
        n.devolucion,
        n.cliente,
        n.transportadora,
        n.litper,
      ]),
    ];
    const wsNovedades = XLSX.utils.aoa_to_sheet(novedadesData);
    XLSX.utils.book_append_sheet(wb, wsNovedades, 'Novedades');

    XLSX.writeFile(wb, `Procesos_Litper_${new Date().toLocaleDateString('es-CO')}.xlsx`);
  };

  // =====================================
  // RENDER: SELECTOR DE MODO
  // =====================================
  if (modo === 'selector') {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-navy-950 dark:to-navy-900">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            LITPER PROCESOS
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Sistema de control de procesos logísticos
          </p>

          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6">
            SELECCIONA TU MODO
          </h2>

          <div className="flex gap-6 justify-center">
            {/* Modo Usuario */}
            <button
              onClick={() => setModo('usuario')}
              className="group bg-white dark:bg-navy-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-cyan-500 w-48"
            >
              <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">USUARIO</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">LOGÍSTICO</p>
            </button>

            {/* Modo Admin */}
            <button
              onClick={() => setModo('admin')}
              className="group bg-white dark:bg-navy-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-amber-500 w-48"
            >
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">ADMIN</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">GERENCIA</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // RENDER: MODO USUARIO - SELECCIÓN DE USUARIO
  // =====================================
  if (modo === 'usuario' && !usuarioActual) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-navy-950 dark:to-navy-900">
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
          <button
            onClick={() => setModo('selector')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              ¡Hola! ¿Quién eres?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Selecciona tu nombre para continuar
            </p>
          </div>

          <div className="space-y-2">
            {usuarios.map((usuario) => (
              <button
                key={usuario.id}
                onClick={() => setUsuarioActual(usuario)}
                className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-navy-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 transition-colors">
                  <User className="w-5 h-5 text-slate-500 group-hover:text-cyan-600" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                  {usuario.nombre}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // RENDER: MODO USUARIO - SELECCIÓN DE TIPO DE REGISTRO
  // =====================================
  if (modo === 'usuario' && usuarioActual && !tipoRegistro) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-navy-950 dark:to-navy-900">
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
          <button
            onClick={() => setUsuarioActual(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Cambiar usuario
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              ¡Hola, {usuarioActual.nombre}!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ¿Qué vas a registrar?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTipoRegistro('guias')}
              className="group bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Package className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold">Generación</h3>
              <p className="text-sm opacity-80">Guías</p>
            </button>

            <button
              onClick={() => setTipoRegistro('novedades')}
              className="group bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold">Novedades</h3>
              <p className="text-sm opacity-80">Gestión</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // RENDER: FORMULARIO GENERACIÓN DE GUÍAS
  // =====================================
  if (modo === 'usuario' && tipoRegistro === 'guias') {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-navy-950 dark:to-navy-900 p-4">
        {/* Mensaje motivacional */}
        {showMensaje && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
            {mensajeActual}
          </div>
        )}

        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setTipoRegistro(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver
            </button>
            <div className="text-right">
              <p className="text-sm text-slate-500">{usuarioActual?.nombre}</p>
              <p className="text-xs text-slate-400">{new Date().toLocaleDateString('es-CO')}</p>
            </div>
          </div>

          {/* Card principal */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl overflow-hidden">
            {/* Header con ronda y cronómetro */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">🎯 RONDA {rondaActual}</h2>
                  <p className="text-sm opacity-80">Generación de Guías</p>
                </div>
                <CircularTimer
                  seconds={tiempoActual}
                  maxSeconds={config.tiempoPorRonda * 60}
                  alertaTemprana={config.alertaTemprana}
                  alertaCritica={config.alertaCritica}
                  isRunning={cronometroActivo}
                />
              </div>

              {/* Controles del cronómetro */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setCronometroActivo(!cronometroActivo)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    cronometroActivo
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {cronometroActivo ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Iniciar
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setTiempoActual(0);
                    setCronometroActivo(false);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Pedidos iniciales */}
              <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Pedidos Iniciales
                </label>
                <input
                  type="number"
                  value={pedidosIniciales || ''}
                  onChange={(e) => setPedidosIniciales(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="0"
                />
              </div>

              {/* Contadores */}
              <div className="space-y-3">
                <Counter
                  label="Realizado"
                  value={realizado}
                  onChange={setRealizado}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                />
                <Counter
                  label="Cancelado"
                  value={cancelado}
                  onChange={setCancelado}
                  icon={<XCircle className="w-5 h-5" />}
                  color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                />
                <Counter
                  label="Agendado"
                  value={agendado}
                  onChange={setAgendado}
                  icon={<Calendar className="w-5 h-5" />}
                  color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                />
                <Counter
                  label="Difíciles"
                  value={dificiles}
                  onChange={setDificiles}
                  icon={<MessageSquare className="w-5 h-5" />}
                  color="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                />
                <Counter
                  label="Pendientes"
                  value={pendientes}
                  onChange={setPendientes}
                  icon={<Clock className="w-5 h-5" />}
                  color="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                />
                <Counter
                  label="Revisado"
                  value={revisado}
                  onChange={setRevisado}
                  icon={<Eye className="w-5 h-5" />}
                  color="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                />
              </div>

              {/* Tiempo promedio */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Tiempo Promedio por Pedido</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {tiempoPromedio} min
                </p>
              </div>

              {/* Botón finalizar */}
              <button
                onClick={finalizarRonda}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                FINALIZAR RONDA
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // RENDER: FORMULARIO NOVEDADES
  // =====================================
  if (modo === 'usuario' && tipoRegistro === 'novedades') {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-navy-950 dark:to-navy-900 p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setTipoRegistro(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver
            </button>
            <div className="text-right">
              <p className="text-sm text-slate-500">{usuarioActual?.nombre}</p>
              <p className="text-xs text-slate-400">{new Date().toLocaleDateString('es-CO')}</p>
            </div>
          </div>

          {/* Card principal */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">REGISTRO DE NOVEDADES</h2>
                  <p className="text-sm opacity-80">
                    Usuario: {usuarioActual?.nombre} | Fecha: {new Date().toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Gestión */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                  Estado de Gestión
                </h3>
                <Counter
                  label="Solucionadas"
                  value={solucionadas}
                  onChange={setSolucionadas}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                />
                <Counter
                  label="Revisadas"
                  value={revisadas}
                  onChange={setRevisadas}
                  icon={<Eye className="w-5 h-5" />}
                  color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                />
                <Counter
                  label="Devolución"
                  value={devolucion}
                  onChange={setDevolucion}
                  icon={<RefreshCw className="w-5 h-5" />}
                  color="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                />
              </div>

              <hr className="border-slate-200 dark:border-navy-700" />

              {/* Origen del problema */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide flex items-center gap-2">
                  📍 Origen del Problema
                </h3>
                <Counter
                  label="Cliente"
                  value={clienteNov}
                  onChange={setClienteNov}
                  icon={<User className="w-5 h-5" />}
                  color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
                />
                <Counter
                  label="Transportadora"
                  value={transportadoraNov}
                  onChange={setTransportadoraNov}
                  icon={<Truck className="w-5 h-5" />}
                  color="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                />
                <Counter
                  label="Litper"
                  value={litperNov}
                  onChange={setLitperNov}
                  icon={<Building2 className="w-5 h-5" />}
                  color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                />
              </div>

              {/* Botón guardar */}
              <button
                onClick={guardarNovedades}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                GUARDAR REGISTRO
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // RENDER: MODO ADMIN
  // =====================================
  if (modo === 'admin') {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-navy-950 dark:to-navy-900">
        {/* Header Admin */}
        <div className="bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setModo('selector')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-amber-500" />
                  PANEL DE CONTROL
                </h1>
                <p className="text-sm text-slate-500">LITPER Procesos</p>
              </div>
            </div>

            <button
              onClick={exportarExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'hoy', label: '📅 HOY', icon: Calendar },
              { id: 'semana', label: '📆 SEMANA', icon: Calendar },
              { id: 'equipo', label: '👥 EQUIPO', icon: Users },
              { id: 'config', label: '⚙️ CONFIG', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setVistaAdmin(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  vistaAdmin === tab.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido según vista */}
        <div className="p-4">
          {vistaAdmin === 'hoy' && (
            <div className="space-y-6">
              {/* Métricas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Total Rondas</span>
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">
                    {estadisticasHoy.totalRondas}
                  </p>
                </div>

                <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Pedidos</span>
                    <Package className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">
                    {estadisticasHoy.totalRealizado}
                    <span className="text-sm text-slate-400 ml-1">/ {estadisticasHoy.totalPedidos}</span>
                  </p>
                </div>

                <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Cancelados</span>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">
                    {estadisticasHoy.totalCancelado}
                  </p>
                </div>

                <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">T. Promedio</span>
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">
                    {estadisticasHoy.promedioGeneral}
                    <span className="text-sm text-slate-400 ml-1">min</span>
                  </p>
                </div>
              </div>

              {/* Tabla de rondas del día */}
              <div className="bg-white dark:bg-navy-900 rounded-xl shadow overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-navy-700">
                  <h3 className="font-bold text-slate-800 dark:text-white">Rondas de Hoy</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-navy-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400">Usuario</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400">Ronda</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400">Tiempo</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400">Pedidos</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400">Realizado</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400">Cancel.</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400">T.Prom</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                      {rondas
                        .filter((r) => r.fecha === new Date().toLocaleDateString('es-CO'))
                        .map((ronda) => (
                          <tr key={ronda.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50">
                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                              {usuarios.find((u) => u.id === ronda.usuarioId)?.nombre}
                            </td>
                            <td className="px-4 py-3 text-center">{ronda.numero}</td>
                            <td className="px-4 py-3 text-center">{formatTime(ronda.tiempoTotal)}</td>
                            <td className="px-4 py-3 text-center">{ronda.pedidosIniciales}</td>
                            <td className="px-4 py-3 text-center text-emerald-600 font-bold">{ronda.realizado}</td>
                            <td className="px-4 py-3 text-center text-red-600">{ronda.cancelado}</td>
                            <td className="px-4 py-3 text-center">{ronda.tiempoPromedio.toFixed(2)} min</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {vistaAdmin === 'config' && (
            <div className="max-w-lg mx-auto">
              <div className="bg-white dark:bg-navy-900 rounded-xl shadow p-6 space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-500" />
                  Configuración del Cronómetro
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tiempo por ronda (minutos)
                    </label>
                    <input
                      type="number"
                      value={config.tiempoPorRonda}
                      onChange={(e) => setConfig({ ...config, tiempoPorRonda: parseInt(e.target.value) || 25 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tiempo promedio por guía (minutos)
                    </label>
                    <input
                      type="number"
                      value={config.tiempoPromedioGuia}
                      onChange={(e) => setConfig({ ...config, tiempoPromedioGuia: parseInt(e.target.value) || 3 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Alerta temprana (segundos)
                    </label>
                    <input
                      type="number"
                      value={config.alertaTemprana}
                      onChange={(e) => setConfig({ ...config, alertaTemprana: parseInt(e.target.value) || 150 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Alerta crítica (segundos)
                    </label>
                    <input
                      type="number"
                      value={config.alertaCritica}
                      onChange={(e) => setConfig({ ...config, alertaCritica: parseInt(e.target.value) || 240 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-navy-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.sonidoActivo}
                        onChange={(e) => setConfig({ ...config, sonidoActivo: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {config.sonidoActivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        Activar sonido de alerta
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.notificacionesActivas}
                        onChange={(e) => setConfig({ ...config, notificacionesActivas: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Enviar notificación push
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.mensajesMotivacionales}
                        onChange={(e) => setConfig({ ...config, mensajesMotivacionales: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Mostrar mensaje motivacional
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => saveToStorage(STORAGE_KEY_CONFIG, config)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
                >
                  APLICAR CONFIGURACIÓN
                </button>
              </div>
            </div>
          )}

          {vistaAdmin === 'equipo' && (
            <div className="grid gap-4">
              {usuarios.map((usuario) => {
                const rondasUsuario = rondas.filter((r) => r.usuarioId === usuario.id);
                const totalRealizado = rondasUsuario.reduce((acc, r) => acc + r.realizado, 0);
                const promedioUsuario = rondasUsuario.length > 0
                  ? (rondasUsuario.reduce((acc, r) => acc + r.tiempoPromedio, 0) / rondasUsuario.length).toFixed(2)
                  : '0';

                return (
                  <div key={usuario.id} className="bg-white dark:bg-navy-900 rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {usuario.nombre.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{usuario.nombre}</h4>
                          <p className="text-sm text-slate-500">{rondasUsuario.length} rondas totales</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">{totalRealizado}</p>
                        <p className="text-xs text-slate-500">guías procesadas</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-800 flex justify-between text-sm">
                      <span className="text-slate-500">Promedio: <span className="font-bold text-slate-800 dark:text-white">{promedioUsuario} min</span></span>
                      <span className="text-slate-500">Cancelados: <span className="font-bold text-red-500">{rondasUsuario.reduce((acc, r) => acc + r.cancelado, 0)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {vistaAdmin === 'semana' && (
            <div className="bg-white dark:bg-navy-900 rounded-xl shadow p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Resumen Semanal</h3>
              <p className="text-slate-500">Próximamente: Gráficos y estadísticas semanales</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ProcesosLitperTab;
