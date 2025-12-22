/**
 * 🏢 LITPER PROCESOS - ENTERPRISE EDITION v3.0
 * Sistema completo de gestión de guías con gamificación
 * 9 usuarios LITPER, 10 niveles, logros, desafíos y conexión API
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Crown, Package, AlertTriangle, Clock, Play, Pause, RotateCcw, Plus, Minus, Save,
  CheckCircle2, XCircle, Star, Trophy, ChevronLeft, ChevronRight, Download, Settings,
  User, Flame, Medal, Gamepad2, X, Lightbulb, Sparkles, Timer, Target, Zap,
  BarChart3, UserPlus, Trash2, Edit3, Volume2, VolumeX, Users, Award, TrendingUp,
  Calendar, RefreshCw, Wifi, WifiOff, Shield, Gift, Rocket, Coffee, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import UserAnalysisPanel from '../features/procesos/components/UserAnalysisPanel';

// ==================== TIPOS ====================
interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  departamento: string;
  xp: number;
  nivel: number;
  racha: number;
  medallas: string[];
  guiasTotales: number;
  mejorTiempo: number;
  combosMaximos: number;
  ultimaActividad?: string;
}

interface Ronda {
  id: string;
  numero: number;
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  hora: string;
  tiempoTotal: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  xpGanado: number;
  comboMaximo: number;
  tipo: 'guias' | 'novedades';
}

interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  requisito: string;
  desbloqueado: boolean;
  fechaDesbloqueo?: string;
}

interface Desafio {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: number;
  progreso: number;
  recompensa: number;
  completado: boolean;
}

interface Config {
  tiempoRonda: number;
  alertaTemprana: number;
  alertaCritica: number;
  metaDiaria: number;
  sonido: boolean;
  countdown: boolean;
  modoTurbo: boolean;
  notificaciones: boolean;
  apiUrl: string;
}

type ViewMode = 'selector' | 'usuario' | 'admin' | 'analisis';
type AdminTab = 'dashboard' | 'ranking' | 'equipo' | 'logros' | 'config';

// ==================== CONSTANTES ====================
const STORAGE = {
  RONDAS: 'lp_rondas',
  CONFIG: 'lp_config',
  USUARIOS: 'lp_users',
  WIDGET: 'lp_widget',
  LOGROS: 'lp_logros',
  API_URL: 'lp_api_url',
};

const API_BASE_URL = 'https://litper-tracker-api.onrender.com/api/tracker';

// 10 Niveles del sistema
const NIVELES = [
  { nivel: 1, nombre: 'Novato', min: 0, max: 100, badge: '🌱', color: 'from-gray-400 to-gray-500' },
  { nivel: 2, nombre: 'Aprendiz', min: 100, max: 300, badge: '📚', color: 'from-green-400 to-green-500' },
  { nivel: 3, nombre: 'Competente', min: 300, max: 800, badge: '⚡', color: 'from-teal-400 to-teal-500' },
  { nivel: 4, nombre: 'Profesional', min: 800, max: 1500, badge: '💼', color: 'from-blue-400 to-blue-500' },
  { nivel: 5, nombre: 'Experto', min: 1500, max: 3000, badge: '🎯', color: 'from-indigo-400 to-indigo-500' },
  { nivel: 6, nombre: 'Maestro', min: 3000, max: 5000, badge: '🏅', color: 'from-purple-400 to-purple-500' },
  { nivel: 7, nombre: 'Gran Maestro', min: 5000, max: 8000, badge: '👑', color: 'from-pink-400 to-pink-500' },
  { nivel: 8, nombre: 'Campeón', min: 8000, max: 12000, badge: '🏆', color: 'from-amber-400 to-amber-500' },
  { nivel: 9, nombre: 'Leyenda', min: 12000, max: 20000, badge: '🔥', color: 'from-orange-400 to-red-500' },
  { nivel: 10, nombre: 'ÉLITE MUNDIAL', min: 20000, max: 999999, badge: '💎', color: 'from-yellow-400 to-yellow-500' },
];

// 9 Empleados LITPER
const DEFAULT_USERS: Usuario[] = [
  { id: '1', nombre: 'CATALINA', rol: 'Líder', departamento: 'Operaciones', xp: 3500, nivel: 6, racha: 12, medallas: ['primera_guia', 'centurion'], guiasTotales: 1250, mejorTiempo: 0.8, combosMaximos: 15 },
  { id: '2', nombre: 'ANGIE', rol: 'Senior', departamento: 'Logística', xp: 2800, nivel: 5, racha: 8, medallas: ['primera_guia', 'centurion'], guiasTotales: 980, mejorTiempo: 1.0, combosMaximos: 12 },
  { id: '3', nombre: 'CAROLINA', rol: 'Senior', departamento: 'Logística', xp: 2600, nivel: 5, racha: 6, medallas: ['primera_guia', 'centurion'], guiasTotales: 890, mejorTiempo: 1.1, combosMaximos: 10 },
  { id: '4', nombre: 'ALEJANDRA', rol: 'Analista', departamento: 'Operaciones', xp: 1800, nivel: 5, racha: 4, medallas: ['primera_guia'], guiasTotales: 620, mejorTiempo: 1.3, combosMaximos: 8 },
  { id: '5', nombre: 'EVAN', rol: 'Especialista', departamento: 'Logística', xp: 1500, nivel: 5, racha: 5, medallas: ['primera_guia'], guiasTotales: 520, mejorTiempo: 1.2, combosMaximos: 7 },
  { id: '6', nombre: 'JIMMY', rol: 'Coordinador', departamento: 'Operaciones', xp: 2200, nivel: 5, racha: 7, medallas: ['primera_guia', 'centurion'], guiasTotales: 780, mejorTiempo: 1.0, combosMaximos: 11 },
  { id: '7', nombre: 'FELIPE', rol: 'Analista', departamento: 'Logística', xp: 1200, nivel: 4, racha: 3, medallas: ['primera_guia'], guiasTotales: 420, mejorTiempo: 1.4, combosMaximos: 6 },
  { id: '8', nombre: 'NORMA', rol: 'Senior', departamento: 'Operaciones', xp: 2400, nivel: 5, racha: 9, medallas: ['primera_guia', 'centurion'], guiasTotales: 850, mejorTiempo: 0.9, combosMaximos: 13 },
  { id: '9', nombre: 'KAREN', rol: 'Especialista', departamento: 'Logística', xp: 1600, nivel: 5, racha: 5, medallas: ['primera_guia'], guiasTotales: 550, mejorTiempo: 1.2, combosMaximos: 8 },
];

// 8 Logros
const LOGROS_DEFAULT: Logro[] = [
  { id: 'primera_guia', nombre: 'Primera Guía', descripcion: 'Completa tu primera guía', icono: '🎉', requisito: '1 guía', desbloqueado: false },
  { id: 'racha_fuego', nombre: 'Racha de Fuego', descripcion: '5 días consecutivos trabajando', icono: '🔥', requisito: '5 días', desbloqueado: false },
  { id: 'centurion', nombre: 'Centurión', descripcion: 'Completa 100 guías', icono: '💯', requisito: '100 guías', desbloqueado: false },
  { id: 'veterano', nombre: 'Veterano', descripcion: 'Completa 500 guías', icono: '🎖️', requisito: '500 guías', desbloqueado: false },
  { id: 'leyenda', nombre: 'Leyenda', descripcion: 'Completa 1000 guías', icono: '🏆', requisito: '1000 guías', desbloqueado: false },
  { id: 'xp_master', nombre: 'XP Master', descripcion: 'Alcanza 5000 XP', icono: '⭐', requisito: '5000 XP', desbloqueado: false },
  { id: 'combo_king', nombre: 'Combo King', descripcion: 'Logra un combo x10', icono: '👑', requisito: 'Combo x10', desbloqueado: false },
  { id: 'nivel_5', nombre: 'Nivel 5', descripcion: 'Alcanza el nivel Experto', icono: '🎯', requisito: 'Nivel 5', desbloqueado: false },
];

// 4 Desafíos diarios
const DESAFIOS_DEFAULT: Desafio[] = [
  { id: 'madrugador', nombre: 'Madrugador', descripcion: '10 guías antes del mediodía', objetivo: 10, progreso: 0, recompensa: 50, completado: false },
  { id: 'sin_errores', nombre: 'Sin Errores', descripcion: '1 ronda sin cancelaciones', objetivo: 1, progreso: 0, recompensa: 30, completado: false },
  { id: 'velocista', nombre: 'Velocista', descripcion: 'Tiempo promedio < 2 min', objetivo: 1, progreso: 0, recompensa: 40, completado: false },
  { id: 'meta_diaria', nombre: 'Meta Diaria', descripcion: 'Cumplir la meta del día', objetivo: 60, progreso: 0, recompensa: 100, completado: false },
];

const DEFAULT_CONFIG: Config = {
  tiempoRonda: 300,
  alertaTemprana: 60,
  alertaCritica: 30,
  metaDiaria: 60,
  sonido: true,
  countdown: true,
  modoTurbo: false,
  notificaciones: true,
  apiUrl: API_BASE_URL,
};

// ==================== HELPERS ====================
const load = <T,>(key: string, def: T): T => {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : def;
  } catch {
    return def;
  }
};

const save = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const fmt = (s: number) => {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getNivelInfo = (xp: number) => {
  const nivel = NIVELES.find((l) => xp >= l.min && xp < l.max) || NIVELES[0];
  const progreso = ((xp - nivel.min) / (nivel.max - nivel.min)) * 100;
  return { ...nivel, progreso: Math.min(progreso, 100) };
};

const calcXP = (realizado: number, cancelado: number, comboMax: number, modoTurbo: boolean) => {
  let xp = (realizado * 10) + (comboMax * 5) - (cancelado * 2);
  if (modoTurbo) xp = Math.floor(xp * 1.5);
  return Math.max(0, xp);
};

const playBeep = (freq: number, dur: number) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {}
};

const getHoy = () => new Date().toISOString().split('T')[0];

// ==================== COMPONENTES AUXILIARES ====================

// Contador Mini
const MiniCounter: React.FC<{
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}> = ({ icon, label, value, onChange, color }) => (
  <div className={`${color} rounded-xl p-3 text-center shadow-lg`}>
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-xs text-white/80 mb-2">{label}</div>
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/40 text-white font-bold transition-all"
      >
        -
      </button>
      <span className="w-10 text-white font-bold text-xl">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/40 text-white font-bold transition-all"
      >
        +
      </button>
    </div>
  </div>
);

// Tarjeta de Usuario
const UserCard: React.FC<{
  usuario: Usuario;
  onClick: () => void;
  onAnalyze?: () => void;
  selected?: boolean;
}> = ({ usuario, onClick, onAnalyze, selected }) => {
  const nivelInfo = getNivelInfo(usuario.xp);
  return (
    <div
      className={`w-full p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
        selected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
          : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-purple-300'
      }`}
    >
      <div className="flex items-center gap-4">
        <button onClick={onClick} className="flex items-center gap-4 flex-1 text-left">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-2xl shadow-lg`}>
            {nivelInfo.badge}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white">{usuario.nombre}</h3>
            <p className="text-xs text-slate-500">{usuario.rol} - {usuario.departamento}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-purple-600 font-medium">{nivelInfo.nombre}</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-amber-600">{usuario.xp} XP</span>
              {usuario.racha > 0 && (
                <>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs text-orange-500">🔥 {usuario.racha}</span>
                </>
              )}
            </div>
          </div>
        </button>
        <div className="flex flex-col gap-2">
          {onAnalyze && (
            <button
              onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
              className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all"
              title="Importar y Analizar Datos"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClick} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const ProcesosLitperTab: React.FC = () => {
  // Estados principales
  const [viewMode, setViewMode] = useState<ViewMode>('selector');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => load(STORAGE.USUARIOS, DEFAULT_USERS));
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [rondas, setRondas] = useState<Ronda[]>(() => load(STORAGE.RONDAS, []));
  const [config, setConfig] = useState<Config>(() => load(STORAGE.CONFIG, DEFAULT_CONFIG));
  const [logros, setLogros] = useState<Logro[]>(() => load(STORAGE.LOGROS, LOGROS_DEFAULT));
  const [desafios, setDesafios] = useState<Desafio[]>(DESAFIOS_DEFAULT);

  // Estados de la ronda actual
  const [rondaActual, setRondaActual] = useState(1);
  const [tiempo, setTiempo] = useState(config.tiempoRonda);
  const [corriendo, setCorriendo] = useState(false);
  const [realizado, setRealizado] = useState(0);
  const [cancelado, setCancelado] = useState(0);
  const [agendado, setAgendado] = useState(0);
  const [dificiles, setDificiles] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [comboActual, setComboActual] = useState(0);
  const [comboMaximo, setComboMaximo] = useState(0);

  // Estados de conexión
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Estado para análisis de usuario
  const [usuarioAnalisis, setUsuarioAnalisis] = useState<Usuario | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handler para abrir panel de análisis
  const abrirAnalisis = (usuario: Usuario) => {
    setUsuarioAnalisis(usuario);
    setViewMode('analisis');
  };

  // ==================== EFECTOS ====================
  useEffect(() => {
    save(STORAGE.USUARIOS, usuarios);
  }, [usuarios]);

  useEffect(() => {
    save(STORAGE.RONDAS, rondas);
  }, [rondas]);

  useEffect(() => {
    save(STORAGE.CONFIG, config);
  }, [config]);

  useEffect(() => {
    save(STORAGE.LOGROS, logros);
  }, [logros]);

  // Timer
  useEffect(() => {
    if (corriendo && tiempo > 0) {
      timerRef.current = setTimeout(() => {
        setTiempo((t) => t - 1);
        if (tiempo <= config.alertaCritica && config.sonido) {
          playBeep(800, 0.1);
        } else if (tiempo <= config.alertaTemprana && tiempo % 10 === 0 && config.sonido) {
          playBeep(600, 0.05);
        }
      }, 1000);
    } else if (tiempo === 0 && corriendo) {
      setCorriendo(false);
      if (config.sonido) playBeep(400, 0.5);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [corriendo, tiempo, config]);

  // ==================== FUNCIONES ====================
  const seleccionarUsuario = (usuario: Usuario) => {
    setUsuarioActual(usuario);
    setViewMode('usuario');
    resetRonda();
  };

  const resetRonda = () => {
    setTiempo(config.tiempoRonda);
    setCorriendo(false);
    setRealizado(0);
    setCancelado(0);
    setAgendado(0);
    setDificiles(0);
    setPendientes(0);
    setComboActual(0);
    setComboMaximo(0);
  };

  const handleRealizado = (v: number) => {
    if (v > realizado) {
      setComboActual((c) => c + 1);
      setComboMaximo((max) => Math.max(max, comboActual + 1));
    }
    setRealizado(v);
  };

  const handleCancelado = (v: number) => {
    if (v > cancelado) setComboActual(0);
    setCancelado(v);
  };

  const guardarRonda = async () => {
    if (!usuarioActual) return;

    const xpGanado = calcXP(realizado, cancelado, comboMaximo, config.modoTurbo);
    const tiempoUsado = config.tiempoRonda - tiempo;

    const nuevaRonda: Ronda = {
      id: Date.now().toString(),
      numero: rondaActual,
      usuarioId: usuarioActual.id,
      usuarioNombre: usuarioActual.nombre,
      fecha: getHoy(),
      hora: new Date().toLocaleTimeString(),
      tiempoTotal: tiempoUsado,
      realizado,
      cancelado,
      agendado,
      dificiles,
      pendientes,
      xpGanado,
      comboMaximo,
      tipo: 'guias',
    };

    // Actualizar rondas
    setRondas((prev) => [...prev, nuevaRonda]);

    // Actualizar usuario
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === usuarioActual.id
          ? {
              ...u,
              xp: u.xp + xpGanado,
              guiasTotales: u.guiasTotales + realizado,
              combosMaximos: Math.max(u.combosMaximos, comboMaximo),
              ultimaActividad: getHoy(),
            }
          : u
      )
    );

    // Actualizar usuario actual
    setUsuarioActual((prev) =>
      prev
        ? {
            ...prev,
            xp: prev.xp + xpGanado,
            guiasTotales: prev.guiasTotales + realizado,
          }
        : null
    );

    // Verificar logros
    verificarLogros(usuarioActual.guiasTotales + realizado, usuarioActual.xp + xpGanado, comboMaximo);

    // Enviar a API
    if (config.apiUrl) {
      try {
        setSyncing(true);
        await fetch(`${config.apiUrl}/rondas/guias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaRonda),
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      } finally {
        setSyncing(false);
      }
    }

    if (config.sonido) playBeep(1000, 0.2);
    setRondaActual((r) => r + 1);
    resetRonda();
  };

  const verificarLogros = (guias: number, xp: number, combo: number) => {
    setLogros((prev) =>
      prev.map((l) => {
        if (l.desbloqueado) return l;
        let desbloquear = false;
        if (l.id === 'primera_guia' && guias >= 1) desbloquear = true;
        if (l.id === 'centurion' && guias >= 100) desbloquear = true;
        if (l.id === 'veterano' && guias >= 500) desbloquear = true;
        if (l.id === 'leyenda' && guias >= 1000) desbloquear = true;
        if (l.id === 'xp_master' && xp >= 5000) desbloquear = true;
        if (l.id === 'combo_king' && combo >= 10) desbloquear = true;
        if (l.id === 'nivel_5' && getNivelInfo(xp).nivel >= 5) desbloquear = true;
        if (desbloquear) {
          return { ...l, desbloqueado: true, fechaDesbloqueo: getHoy() };
        }
        return l;
      })
    );
  };

  const sincronizarAPI = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${config.apiUrl}/rondas?fecha=${getHoy()}`);
      if (response.ok) {
        setIsOnline(true);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setSyncing(false);
    }
  };

  const exportarExcel = () => {
    const rondasHoy = rondas.filter((r) => r.fecha === getHoy());
    const ws = XLSX.utils.json_to_sheet(rondasHoy);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rondas');
    XLSX.writeFile(wb, `litper_procesos_${getHoy()}.xlsx`);
  };

  // ==================== CÁLCULOS ====================
  const rondasHoy = useMemo(() => rondas.filter((r) => r.fecha === getHoy()), [rondas]);
  const guiasHoy = useMemo(() => rondasHoy.reduce((sum, r) => sum + r.realizado, 0), [rondasHoy]);
  const canceladasHoy = useMemo(() => rondasHoy.reduce((sum, r) => sum + r.cancelado, 0), [rondasHoy]);
  const xpHoy = useMemo(() => rondasHoy.reduce((sum, r) => sum + r.xpGanado, 0), [rondasHoy]);
  const eficiencia = useMemo(() => {
    const total = guiasHoy + canceladasHoy;
    return total > 0 ? Math.round((guiasHoy / total) * 100) : 100;
  }, [guiasHoy, canceladasHoy]);

  const ranking = useMemo(() => {
    return [...usuarios].sort((a, b) => b.xp - a.xp);
  }, [usuarios]);

  // ==================== RENDER: SELECTOR DE USUARIO ====================
  if (viewMode === 'selector') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-navy-900 dark:to-purple-900/20 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl mb-4">
              <Gamepad2 className="w-8 h-8 text-white" />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">LITPER PROCESOS</h1>
                <p className="text-purple-200 text-sm">Enterprise Edition v3.0</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Selecciona tu usuario para comenzar</p>
          </div>

          {/* Grid de usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {usuarios.map((usuario) => (
              <UserCard
                key={usuario.id}
                usuario={usuario}
                onClick={() => seleccionarUsuario(usuario)}
                onAnalyze={() => abrirAnalisis(usuario)}
              />
            ))}
          </div>

          {/* Botón Admin */}
          <div className="text-center">
            <button
              onClick={() => setViewMode('admin')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all"
            >
              <Shield className="w-5 h-5" />
              Panel Administrativo
            </button>
          </div>

          {/* Estado de conexión */}
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Conectado' : 'Sin conexión'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: VISTA USUARIO ====================
  if (viewMode === 'usuario' && usuarioActual) {
    const nivelInfo = getNivelInfo(usuarioActual.xp);
    const tiempoColor = tiempo <= config.alertaCritica
      ? 'text-red-500'
      : tiempo <= config.alertaTemprana
      ? 'text-amber-500'
      : 'text-emerald-500';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-navy-900 dark:to-purple-900/20 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header con usuario */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewMode('selector')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-xl shadow-lg`}>
                {nivelInfo.badge}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white">{usuarioActual.nombre}</h2>
                <p className="text-xs text-purple-600">{nivelInfo.nombre} - {usuarioActual.xp} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.modoTurbo && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold animate-pulse">
                  ⚡ TURBO
                </span>
              )}
              <button
                onClick={() => setConfig((c) => ({ ...c, sonido: !c.sonido }))}
                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg"
              >
                {config.sonido ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Barra de XP */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Nivel {nivelInfo.nivel}</span>
              <span>{Math.round(nivelInfo.progreso)}%</span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${nivelInfo.color} transition-all duration-500`}
                style={{ width: `${nivelInfo.progreso}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500 mb-2">Ronda #{rondaActual}</p>
              <div className={`text-6xl font-mono font-bold ${tiempoColor}`}>
                {fmt(tiempo)}
              </div>
              {comboActual > 1 && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400 font-bold">COMBO x{comboActual}</span>
                </div>
              )}
            </div>

            {/* Controles de timer */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={() => setCorriendo(!corriendo)}
                className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 ${
                  corriendo
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {corriendo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {corriendo ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={resetRonda}
                className="px-4 py-3 bg-slate-200 dark:bg-navy-700 rounded-xl hover:bg-slate-300 dark:hover:bg-navy-600"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              <MiniCounter
                icon="✅"
                label="Realizado"
                value={realizado}
                onChange={handleRealizado}
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <MiniCounter
                icon="❌"
                label="Cancelado"
                value={cancelado}
                onChange={handleCancelado}
                color="bg-gradient-to-br from-red-500 to-red-600"
              />
              <MiniCounter
                icon="📅"
                label="Agendado"
                value={agendado}
                onChange={setAgendado}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <MiniCounter
                icon="⚠️"
                label="Difícil"
                value={dificiles}
                onChange={setDificiles}
                color="bg-gradient-to-br from-amber-500 to-amber-600"
              />
              <MiniCounter
                icon="⏳"
                label="Pendiente"
                value={pendientes}
                onChange={setPendientes}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
            </div>

            {/* Botón guardar */}
            <button
              onClick={guardarRonda}
              disabled={realizado === 0 && cancelado === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              <Save className="w-5 h-5" />
              Guardar Ronda (+{calcXP(realizado, cancelado, comboMaximo, config.modoTurbo)} XP)
            </button>
          </div>

          {/* Stats del día */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white dark:bg-navy-800 rounded-xl p-4 text-center shadow">
              <p className="text-2xl font-bold text-emerald-600">{guiasHoy}</p>
              <p className="text-xs text-slate-500">Guías hoy</p>
            </div>
            <div className="bg-white dark:bg-navy-800 rounded-xl p-4 text-center shadow">
              <p className="text-2xl font-bold text-red-500">{canceladasHoy}</p>
              <p className="text-xs text-slate-500">Canceladas</p>
            </div>
            <div className="bg-white dark:bg-navy-800 rounded-xl p-4 text-center shadow">
              <p className="text-2xl font-bold text-blue-600">{eficiencia}%</p>
              <p className="text-xs text-slate-500">Eficiencia</p>
            </div>
            <div className="bg-white dark:bg-navy-800 rounded-xl p-4 text-center shadow">
              <p className="text-2xl font-bold text-purple-600">{xpHoy}</p>
              <p className="text-xs text-slate-500">XP hoy</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: ANÁLISIS DE USUARIO ====================
  if (viewMode === 'analisis' && usuarioAnalisis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-navy-900 dark:to-blue-900/20 p-4">
        <div className="max-w-6xl mx-auto">
          <UserAnalysisPanel
            usuario={usuarioAnalisis}
            onBack={() => {
              setUsuarioAnalisis(null);
              setViewMode('selector');
            }}
          />
        </div>
      </div>
    );
  }

  // ==================== RENDER: PANEL ADMIN ====================
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-navy-900 dark:to-purple-900/20 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Admin */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewMode('selector')}
              className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Panel Administrativo</h1>
                <p className="text-sm text-slate-500">LITPER PROCESOS v3.0</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={sincronizarAPI}
                disabled={syncing}
                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportarExcel}
                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs Admin */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Dashboard' },
              { id: 'ranking', icon: <Trophy className="w-4 h-4" />, label: 'Ranking' },
              { id: 'equipo', icon: <Users className="w-4 h-4" />, label: 'Equipo' },
              { id: 'logros', icon: <Award className="w-4 h-4" />, label: 'Logros' },
              { id: 'config', icon: <Settings className="w-4 h-4" />, label: 'Config' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  adminTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-navy-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dashboard */}
          {adminTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-8 h-8 text-emerald-500" />
                    <span className="text-3xl font-bold text-emerald-600">{guiasHoy}</span>
                  </div>
                  <p className="text-slate-500">Guías hoy</p>
                </div>
                <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <XCircle className="w-8 h-8 text-red-500" />
                    <span className="text-3xl font-bold text-red-600">{canceladasHoy}</span>
                  </div>
                  <p className="text-slate-500">Canceladas</p>
                </div>
                <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <span className="text-3xl font-bold text-blue-600">{eficiencia}%</span>
                  </div>
                  <p className="text-slate-500">Eficiencia</p>
                </div>
                <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-8 h-8 text-amber-500" />
                    <span className="text-3xl font-bold text-amber-600">
                      {rondasHoy.length > 0 ? Math.round(rondasHoy.reduce((s, r) => s + r.tiempoTotal, 0) / rondasHoy.length / 60) : 0}m
                    </span>
                  </div>
                  <p className="text-slate-500">Tiempo prom.</p>
                </div>
                <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-8 h-8 text-purple-500" />
                    <span className="text-3xl font-bold text-purple-600">{xpHoy}</span>
                  </div>
                  <p className="text-slate-500">XP Total</p>
                </div>
              </div>

              {/* Tabla de actividad */}
              <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700">
                  <h3 className="font-bold text-slate-800 dark:text-white">Actividad de hoy</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-navy-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Usuario</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Ronda</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Realizado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Cancelado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">XP</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                      {rondasHoy.slice(-10).reverse().map((ronda) => (
                        <tr key={ronda.id} className="hover:bg-slate-50 dark:hover:bg-navy-700">
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{ronda.usuarioNombre}</td>
                          <td className="px-4 py-3 text-center text-slate-500">#{ronda.numero}</td>
                          <td className="px-4 py-3 text-center text-emerald-600 font-medium">{ronda.realizado}</td>
                          <td className="px-4 py-3 text-center text-red-500">{ronda.cancelado}</td>
                          <td className="px-4 py-3 text-center text-purple-600 font-medium">+{ronda.xpGanado}</td>
                          <td className="px-4 py-3 text-center text-slate-400 text-sm">{ronda.hora}</td>
                        </tr>
                      ))}
                      {rondasHoy.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            No hay actividad registrada hoy
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Ranking */}
          {adminTab === 'ranking' && (
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Ranking por XP
                </h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-navy-700">
                {ranking.map((usuario, index) => {
                  const nivelInfo = getNivelInfo(usuario.xp);
                  return (
                    <div key={usuario.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-navy-700">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-xl shadow`}>
                        {nivelInfo.badge}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-white">{usuario.nombre}</h4>
                        <p className="text-sm text-slate-500">{nivelInfo.nombre} - Nivel {nivelInfo.nivel}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{usuario.xp.toLocaleString()} XP</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>🔥 {usuario.racha}</span>
                          <span>|</span>
                          <span>{usuario.guiasTotales} guías</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Equipo */}
          {adminTab === 'equipo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuarios.map((usuario) => {
                const nivelInfo = getNivelInfo(usuario.xp);
                return (
                  <div key={usuario.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-lg p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-2xl shadow`}>
                        {nivelInfo.badge}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{usuario.nombre}</h4>
                        <p className="text-sm text-slate-500">{usuario.rol}</p>
                        <p className="text-xs text-purple-600">{usuario.departamento}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-navy-700 rounded-lg p-2">
                        <p className="text-lg font-bold text-purple-600">{usuario.xp}</p>
                        <p className="text-xs text-slate-500">XP</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-navy-700 rounded-lg p-2">
                        <p className="text-lg font-bold text-emerald-600">{usuario.guiasTotales}</p>
                        <p className="text-xs text-slate-500">Guías</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-navy-700 rounded-lg p-2">
                        <p className="text-lg font-bold text-amber-600">{usuario.racha}</p>
                        <p className="text-xs text-slate-500">Racha</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Logros */}
          {adminTab === 'logros' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {logros.map((logro) => (
                <div
                  key={logro.id}
                  className={`bg-white dark:bg-navy-800 rounded-2xl shadow-lg p-5 ${
                    logro.desbloqueado ? '' : 'opacity-50'
                  }`}
                >
                  <div className="text-4xl mb-3">{logro.icono}</div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1">{logro.nombre}</h4>
                  <p className="text-sm text-slate-500 mb-2">{logro.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600">{logro.requisito}</span>
                    {logro.desbloqueado ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <X className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  {logro.fechaDesbloqueo && (
                    <p className="text-xs text-slate-400 mt-2">Desbloqueado: {logro.fechaDesbloqueo}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Config */}
          {adminTab === 'config' && (
            <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tiempo por ronda */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tiempo por ronda (segundos)
                  </label>
                  <input
                    type="number"
                    value={config.tiempoRonda}
                    onChange={(e) => setConfig((c) => ({ ...c, tiempoRonda: parseInt(e.target.value) || 300 }))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900"
                  />
                </div>
                {/* Alerta temprana */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Alerta temprana (segundos)
                  </label>
                  <input
                    type="number"
                    value={config.alertaTemprana}
                    onChange={(e) => setConfig((c) => ({ ...c, alertaTemprana: parseInt(e.target.value) || 60 }))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900"
                  />
                </div>
                {/* Alerta crítica */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Alerta crítica (segundos)
                  </label>
                  <input
                    type="number"
                    value={config.alertaCritica}
                    onChange={(e) => setConfig((c) => ({ ...c, alertaCritica: parseInt(e.target.value) || 30 }))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900"
                  />
                </div>
                {/* Meta diaria */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Meta diaria (guías)
                  </label>
                  <input
                    type="number"
                    value={config.metaDiaria}
                    onChange={(e) => setConfig((c) => ({ ...c, metaDiaria: parseInt(e.target.value) || 60 }))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900"
                  />
                </div>
                {/* API URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    URL del API
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.apiUrl}
                      onChange={(e) => setConfig((c) => ({ ...c, apiUrl: e.target.value }))}
                      placeholder="https://litper-tracker-api.onrender.com/api/tracker"
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900 font-mono text-sm"
                    />
                    <button
                      onClick={sincronizarAPI}
                      disabled={syncing}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Se guarda permanentemente</p>
                </div>
                {/* Toggles */}
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.countdown}
                      onChange={(e) => setConfig((c) => ({ ...c, countdown: e.target.checked }))}
                      className="w-5 h-5 rounded text-purple-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Countdown</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.sonido}
                      onChange={(e) => setConfig((c) => ({ ...c, sonido: e.target.checked }))}
                      className="w-5 h-5 rounded text-purple-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Sonidos</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.modoTurbo}
                      onChange={(e) => setConfig((c) => ({ ...c, modoTurbo: e.target.checked }))}
                      className="w-5 h-5 rounded text-purple-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Modo Turbo (+50% XP)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notificaciones}
                      onChange={(e) => setConfig((c) => ({ ...c, notificaciones: e.target.checked }))}
                      className="w-5 h-5 rounded text-purple-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Notificaciones</span>
                  </label>
                </div>
              </div>
              {/* Estado de conexión */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-navy-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Estado de conexión:</span>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    {isOnline ? 'Conectado' : 'Sin conexión'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ProcesosLitperTab;
