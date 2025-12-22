/**
 * 🎮 LITPER PROCESOS - GAMING EDITION v2.0
 * Optimizado y compacto con Fase 1 completa
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Crown, Package, AlertTriangle, Clock, Play, Pause, RotateCcw, Plus, Minus, Save,
  CheckCircle2, XCircle, Star, Trophy, ChevronLeft, ChevronRight, Download, Settings,
  User, Flame, Medal, Gamepad2, X, Pin, PinOff, Lightbulb, Sparkles, Timer, Target,
  BarChart3, Zap, UserPlus, Trash2, Edit3, Volume2, VolumeX
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ===== TIPOS =====
interface Usuario {
  id: string; nombre: string; xp: number; nivel: number; racha: number;
  medallas: string[]; guiasTotales: number; mejorTiempo: number; combosMaximos: number;
}

interface Ronda {
  id: string; numero: number; usuarioId: string; fecha: string;
  tiempoTotal: number; realizado: number; cancelado: number; agendado: number;
  dificiles: number; pendientes: number; xpGanado: number; comboMaximo: number;
}

interface Config {
  tiempoRonda: number; alertaTemprana: number; alertaCritica: number;
  metaDiaria: number; sonido: boolean; countdown: boolean;
}

// ===== CONSTANTES =====
const STORAGE = { RONDAS: 'lp_rondas', CONFIG: 'lp_config', USUARIOS: 'lp_users', WIDGET: 'lp_widget' };
const API_URL = 'http://localhost:8000/api/tracker';

const NIVELES = [
  { min: 0, max: 100, nombre: 'Novato', color: 'from-gray-400 to-gray-500' },
  { min: 100, max: 500, nombre: 'Aprendiz', color: 'from-green-400 to-green-500' },
  { min: 500, max: 2000, nombre: 'Experto', color: 'from-blue-400 to-blue-500' },
  { min: 2000, max: 5000, nombre: 'Maestro', color: 'from-purple-400 to-purple-500' },
  { min: 5000, max: 15000, nombre: 'Leyenda', color: 'from-amber-400 to-amber-500' },
  { min: 15000, max: 999999, nombre: 'ELITE', color: 'from-yellow-400 to-red-500' },
];

const TIPS = [
  "💡 Técnica Pomodoro: 25 min trabajo, 5 min descanso",
  "⏱️ Si toma menos de 2 min, hazlo ya",
  "🎯 Una guía a la vez = mejor tiempo",
  "💧 Bebe agua cada hora",
  "🎉 Cada ronda completada es una victoria",
];

// Los 9 usuarios reales de LITPER (sincronizados con backend)
const DEFAULT_USERS: Usuario[] = [
  { id: 'cat1', nombre: 'CATALINA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'ang1', nombre: 'ANGIE', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'car1', nombre: 'CAROLINA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'ale1', nombre: 'ALEJANDRA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'eva1', nombre: 'EVAN', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'jim1', nombre: 'JIMMY', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'fel1', nombre: 'FELIPE', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'nor1', nombre: 'NORMA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
  { id: 'kar1', nombre: 'KAREN', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0 },
];

const DEFAULT_CONFIG: Config = {
  tiempoRonda: 300, alertaTemprana: 60, alertaCritica: 30,
  metaDiaria: 60, sonido: true, countdown: true
};

// ===== HELPERS =====
const load = <T,>(key: string, def: T): T => {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
};
const save = <T,>(key: string, data: T) => localStorage.setItem(key, JSON.stringify(data));
const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
const getNivel = (xp: number) => {
  const n = NIVELES.findIndex(l => xp >= l.min && xp < l.max);
  const nivel = NIVELES[n] || NIVELES[0];
  const prog = ((xp - nivel.min) / (nivel.max - nivel.min)) * 100;
  return { ...nivel, nivel: n + 1, progreso: Math.min(prog, 100) };
};
const calcXP = (r: number, t: number, c: number, combo: number) => {
  let xp = r * 10 + (t < 2 ? r * 5 : t < 3 ? r * 2 : 0) - c * 3 + 50 + (c === 0 ? 25 : 0);
  return Math.max(0, Math.floor(xp * (1 + (combo - 1) * 0.1)));
};

// ===== API HELPERS =====
const fetchUsuariosFromAPI = async (): Promise<Usuario[]> => {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Usuarios cargados desde backend:', data.length);
      return data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        xp: 0,
        nivel: 1,
        racha: 0,
        medallas: [],
        guiasTotales: 0,
        mejorTiempo: 0,
        combosMaximos: 0,
      }));
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar usuarios desde backend:', error);
  }
  return [];
};

const syncRondaToAPI = async (ronda: Ronda, usuario: Usuario) => {
  try {
    await fetch(`${API_URL}/rondas/guias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: ronda.usuarioId,
        usuario_nombre: usuario.nombre,
        numero: ronda.numero,
        fecha: ronda.fecha,
        hora_inicio: new Date().toTimeString().slice(0, 5),
        hora_fin: new Date().toTimeString().slice(0, 5),
        tiempo_usado: Math.round(ronda.tiempoTotal / 60),
        realizado: ronda.realizado,
        cancelado: ronda.cancelado,
        agendado: ronda.agendado,
        dificiles: ronda.dificiles,
        pendientes: ronda.pendientes,
      }),
    });
    console.log('✅ Ronda sincronizada con backend');
  } catch (error) {
    console.warn('⚠️ No se pudo sincronizar ronda con backend:', error);
  }
};

const fetchRondasFromAPI = async (fecha?: string): Promise<Ronda[]> => {
  try {
    const fechaParam = fecha || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/rondas?fecha=${fechaParam}&tipo=guias`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Rondas cargadas desde backend:', data.length);
      return data.map((r: any) => ({
        id: r.id,
        numero: r.numero || 1,
        usuarioId: r.usuario_id,
        fecha: r.fecha,
        tiempoTotal: (r.tiempo_usado || 0) * 60,
        realizado: r.realizado || 0,
        cancelado: r.cancelado || 0,
        agendado: r.agendado || 0,
        dificiles: r.dificiles || 0,
        pendientes: r.pendientes || 0,
        xpGanado: 0,
        comboMaximo: 1,
      }));
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar rondas desde backend:', error);
  }
  return [];
};

// ===== SONIDO =====
const playBeep = (freq: number, dur: number) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch {}
};

// ===== COMPONENTE: CONTADOR MINI =====
const MiniCounter: React.FC<{icon: string; value: number; onChange: (v: number) => void; color: string}> =
  ({icon, value, onChange, color}) => (
  <div className={`${color} rounded-lg p-1.5 text-center`}>
    <div className="text-xs">{icon}</div>
    <div className="flex items-center justify-center gap-1">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="w-5 h-5 rounded bg-black/20 hover:bg-black/40 text-white text-xs">-</button>
      <span className="w-6 text-white font-bold text-sm">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-5 h-5 rounded bg-black/20 hover:bg-black/40 text-white text-xs">+</button>
    </div>
  </div>
);

// ===== COMPONENTE: WIDGET FLOTANTE =====
const FloatingWidget: React.FC<{
  usuario: Usuario; tiempo: number; maxTiempo: number; activo: boolean; countdown: boolean;
  contadores: {r: number; c: number; a: number; d: number; p: number};
  setContadores: (c: any) => void; combo: number; meta: number; guiasHoy: number;
  onToggle: () => void; onSave: () => void; onClose: () => void;
  pinned: boolean; onPin: () => void; pos: {x: number; y: number}; setPos: (p: any) => void;
  alertaT: number; alertaC: number; sonido: boolean;
}> = ({usuario, tiempo, maxTiempo, activo, countdown, contadores, setContadores, combo, meta, guiasHoy,
       onToggle, onSave, onClose, pinned, onPin, pos, setPos, alertaT, alertaC, sonido}) => {
  const [drag, setDrag] = useState(false);
  const [offset, setOffset] = useState({x: 0, y: 0});

  const displayTime = countdown ? Math.max(0, maxTiempo - tiempo) : tiempo;
  const isWarning = countdown ? displayTime <= alertaT && displayTime > alertaC : tiempo >= (maxTiempo - alertaT);
  const isCritical = countdown ? displayTime <= alertaC : tiempo >= (maxTiempo - alertaC);

  const color = isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400';
  const bg = isCritical ? 'bg-red-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-emerald-500/20';

  useEffect(() => {
    const move = (e: MouseEvent) => drag && setPos({x: e.clientX - offset.x, y: e.clientY - offset.y});
    const up = () => setDrag(false);
    if (drag) { document.addEventListener('mousemove', move); document.addEventListener('mouseup', up); }
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [drag, offset]);

  const nivelInfo = getNivel(usuario.xp);
  const progMeta = Math.min((guiasHoy / meta) * 100, 100);

  return (
    <div
      className={`fixed z-50 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 w-72 ${drag ? 'cursor-grabbing' : 'cursor-grab'} ${pinned ? 'ring-2 ring-cyan-500' : ''}`}
      style={{left: pos.x, top: pos.y}}
      onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('.ctrl')) { setDrag(true); setOffset({x: e.clientX - pos.x, y: e.clientY - pos.y}); }}}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-white" />
          <span className="font-bold text-white text-sm">LITPER</span>
          {combo > 1 && <span className="bg-orange-500 text-white text-xs px-1.5 rounded-full animate-pulse">x{combo}</span>}
        </div>
        <div className="flex items-center gap-1 ctrl">
          <button onClick={onPin} className="p-1 hover:bg-white/20 rounded">{pinned ? <PinOff className="w-3 h-3 text-white"/> : <Pin className="w-3 h-3 text-white"/>}</button>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded"><X className="w-3 h-3 text-white"/></button>
        </div>
      </div>

      <div className="p-3">
        {/* Timer */}
        <div className={`${bg} rounded-xl p-3 text-center mb-3`}>
          <div className={`text-4xl font-mono font-bold ${color}`}>{fmt(displayTime)}</div>
          <div className={`text-xs ${color} flex items-center justify-center gap-1`}>
            {isCritical ? '🔴' : isWarning ? '🟡' : '🟢'} {activo ? 'EN RONDA' : countdown ? 'COUNTDOWN' : 'PAUSADO'}
          </div>
        </div>

        {/* Contadores con +/- */}
        <div className="grid grid-cols-5 gap-1 mb-3 ctrl">
          <MiniCounter icon="✅" value={contadores.r} onChange={(v) => setContadores({...contadores, r: v})} color="bg-emerald-500/30" />
          <MiniCounter icon="❌" value={contadores.c} onChange={(v) => setContadores({...contadores, c: v})} color="bg-red-500/30" />
          <MiniCounter icon="📅" value={contadores.a} onChange={(v) => setContadores({...contadores, a: v})} color="bg-blue-500/30" />
          <MiniCounter icon="⚠️" value={contadores.d} onChange={(v) => setContadores({...contadores, d: v})} color="bg-amber-500/30" />
          <MiniCounter icon="⏳" value={contadores.p} onChange={(v) => setContadores({...contadores, p: v})} color="bg-purple-500/30" />
        </div>

        {/* Controles */}
        <div className="flex gap-2 mb-3 ctrl">
          <button onClick={onToggle} className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${activo ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}>
            {activo ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
          </button>
          <button onClick={onSave} className="flex-1 py-2 rounded-lg font-bold text-sm bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center gap-1">
            <Save className="w-4 h-4"/>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400"/>{usuario.racha}d</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400"/>{usuario.xp} XP</span>
          <span>Lvl {nivelInfo.nivel}</span>
        </div>

        {/* Meta */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Meta: {guiasHoy}/{meta}</span><span>{Math.round(progMeta)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{width: `${progMeta}%`}}/>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE: MODAL USUARIO =====
const UserModal: React.FC<{
  user?: Usuario; onSave: (u: Usuario) => void; onClose: () => void; onDelete?: () => void;
}> = ({user, onSave, onClose, onDelete}) => {
  const [nombre, setNombre] = useState(user?.nombre || '');
  const isEdit = !!user;

  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave({
      id: user?.id || `u-${Date.now()}`,
      nombre: nombre.toUpperCase(),
      xp: user?.xp || 0,
      nivel: user?.nivel || 1,
      racha: user?.racha || 0,
      medallas: user?.medallas || [],
      guiasTotales: user?.guiasTotales || 0,
      mejorTiempo: user?.mejorTiempo || 0,
      combosMaximos: user?.combosMaximos || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-2xl p-6 w-80 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">{isEdit ? '✏️ Editar' : '➕ Nuevo'} Usuario</h3>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del usuario"
          className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold">Guardar</button>
        </div>
        {isEdit && onDelete && (
          <button onClick={onDelete} className="w-full mt-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 font-medium flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4"/> Eliminar Usuario
          </button>
        )}
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
export const ProcesosLitperTab: React.FC<{selectedCountry?: string}> = () => {
  // Estados
  const [modo, setModo] = useState<'selector' | 'usuario' | 'admin'>('selector');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => load(STORAGE.USUARIOS, DEFAULT_USERS));
  const [rondas, setRondas] = useState<Ronda[]>(() => load(STORAGE.RONDAS, []));
  const [config, setConfig] = useState<Config>(() => load(STORAGE.CONFIG, DEFAULT_CONFIG));

  const [tiempo, setTiempo] = useState(0);
  const [activo, setActivo] = useState(false);
  const [rondaNum, setRondaNum] = useState(1);
  const [combo, setCombo] = useState(1);
  const [contadores, setContadores] = useState({r: 0, c: 0, a: 0, d: 0, p: 0});

  const [showWidget, setShowWidget] = useState(false);
  const [widgetPin, setWidgetPin] = useState(false);
  const [widgetPos, setWidgetPos] = useState(() => load(STORAGE.WIDGET, {x: 20, y: 100}));

  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | undefined>();
  const [showMsg, setShowMsg] = useState('');
  const [vistaAdmin, setVistaAdmin] = useState<'hoy' | 'ranking' | 'equipo' | 'config'>('hoy');

  // Estado de conexión
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Cargar usuarios desde backend al inicio
  useEffect(() => {
    const loadFromBackend = async () => {
      setSyncStatus('syncing');
      try {
        // Cargar usuarios del backend
        const backendUsers = await fetchUsuariosFromAPI();
        if (backendUsers.length > 0) {
          // Merge con datos locales (XP, nivel, etc)
          const localUsers = load<Usuario[]>(STORAGE.USUARIOS, DEFAULT_USERS);
          const mergedUsers = backendUsers.map(bu => {
            const local = localUsers.find(lu => lu.id === bu.id);
            return local ? { ...bu, xp: local.xp, nivel: local.nivel, racha: local.racha, guiasTotales: local.guiasTotales, medallas: local.medallas, mejorTiempo: local.mejorTiempo, combosMaximos: local.combosMaximos } : bu;
          });
          setUsuarios(mergedUsers);
          setIsOnline(true);
        }

        // Cargar rondas del día desde backend
        const backendRondas = await fetchRondasFromAPI();
        if (backendRondas.length > 0) {
          const localRondas = load<Ronda[]>(STORAGE.RONDAS, []);
          const allRondas = [...localRondas.filter(lr => !backendRondas.some(br => br.id === lr.id)), ...backendRondas];
          setRondas(allRondas);
        }

        setSyncStatus('idle');
      } catch (error) {
        console.warn('Error cargando desde backend:', error);
        setIsOnline(false);
        setSyncStatus('error');
      }
    };

    loadFromBackend();

    // Listener de conexión
    const handleOnline = () => { setIsOnline(true); loadFromBackend(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistencia local (backup)
  useEffect(() => { save(STORAGE.USUARIOS, usuarios); }, [usuarios]);
  useEffect(() => { save(STORAGE.RONDAS, rondas); }, [rondas]);
  useEffect(() => { save(STORAGE.CONFIG, config); }, [config]);
  useEffect(() => { save(STORAGE.WIDGET, widgetPos); }, [widgetPos]);

  // Timer
  useEffect(() => {
    if (!activo) return;
    const interval = setInterval(() => {
      setTiempo(t => {
        const newT = t + 1;
        const remaining = config.tiempoRonda - newT;
        // Alertas de sonido
        if (config.sonido && config.countdown) {
          if (remaining === config.alertaTemprana) playBeep(800, 0.2);
          if (remaining === config.alertaCritica) playBeep(1000, 0.3);
          if (remaining === 0) { playBeep(1200, 0.5); playBeep(1200, 0.5); }
        }
        return newT;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activo, config]);

  // Cálculos
  const hoy = new Date().toLocaleDateString('es-CO');
  const guiasHoy = useMemo(() => usuario ? rondas.filter(r => r.usuarioId === usuario.id && r.fecha === hoy).reduce((a, r) => a + r.realizado, 0) : 0, [rondas, usuario, hoy]);
  const tiempoProm = useMemo(() => { const total = contadores.r + contadores.c + contadores.a; return total > 0 && tiempo > 0 ? (tiempo / 60 / total) : 0; }, [contadores, tiempo]);

  // Funciones
  const finalizarRonda = async () => {
    if (!usuario) return;
    const xp = calcXP(contadores.r, tiempoProm, contadores.c, combo);
    const nuevaRonda: Ronda = {
      id: `r-${Date.now()}`, numero: rondaNum, usuarioId: usuario.id, fecha: hoy,
      tiempoTotal: tiempo, realizado: contadores.r, cancelado: contadores.c, agendado: contadores.a,
      dificiles: contadores.d, pendientes: contadores.p, xpGanado: xp, comboMaximo: combo,
    };
    setRondas(prev => [...prev, nuevaRonda]);

    const nuevoXP = usuario.xp + xp;
    const updated = {...usuario, xp: nuevoXP, guiasTotales: usuario.guiasTotales + contadores.r};
    setUsuarios(prev => prev.map(u => u.id === usuario.id ? updated : u));
    setUsuario(updated);

    // Sincronizar con backend
    if (isOnline) {
      syncRondaToAPI(nuevaRonda, usuario);
    }

    setShowMsg(`🎉 +${xp} XP!${isOnline ? ' (Sincronizado)' : ' (Guardado local)'}`);
    setTimeout(() => setShowMsg(''), 3000);
    if (config.sonido) playBeep(600, 0.2);

    setRondaNum(n => n + 1);
    setTiempo(0);
    setActivo(false);
    setContadores({r: 0, c: 0, a: 0, d: 0, p: 0});
    setCombo(1);
  };

  const saveUser = (u: Usuario) => {
    setUsuarios(prev => {
      const exists = prev.find(x => x.id === u.id);
      return exists ? prev.map(x => x.id === u.id ? u : x) : [...prev, u];
    });
    setShowUserModal(false);
    setEditUser(undefined);
  };

  const deleteUser = (id: string) => {
    if (confirm('¿Eliminar este usuario?')) {
      setUsuarios(prev => prev.filter(u => u.id !== id));
      setShowUserModal(false);
      setEditUser(undefined);
    }
  };

  const stats = useMemo(() => {
    const rondasHoy = rondas.filter(r => r.fecha === hoy);
    return {
      rondas: rondasHoy.length,
      realizado: rondasHoy.reduce((a, r) => a + r.realizado, 0),
      cancelado: rondasHoy.reduce((a, r) => a + r.cancelado, 0),
      prom: rondasHoy.length > 0 ? (rondasHoy.reduce((a, r) => a + r.tiempoTotal, 0) / rondasHoy.length / 60).toFixed(1) : '0',
      xp: rondasHoy.reduce((a, r) => a + r.xpGanado, 0),
    };
  }, [rondas, hoy]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = [['Fecha', 'Usuario', 'Realizado', 'Cancelado', 'Tiempo', 'XP'],
      ...rondas.map(r => [r.fecha, usuarios.find(u => u.id === r.usuarioId)?.nombre, r.realizado, r.cancelado, fmt(r.tiempoTotal), r.xpGanado])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Rondas');
    XLSX.writeFile(wb, `Litper_${hoy}.xlsx`);
  };

  // ===== RENDERS =====
  const msgFloat = showMsg && (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
      {showMsg}
    </div>
  );

  const widget = showWidget && usuario && (
    <FloatingWidget
      usuario={usuario} tiempo={tiempo} maxTiempo={config.tiempoRonda} activo={activo}
      countdown={config.countdown} contadores={contadores} setContadores={setContadores}
      combo={combo} meta={config.metaDiaria} guiasHoy={guiasHoy}
      onToggle={() => setActivo(!activo)} onSave={finalizarRonda} onClose={() => setShowWidget(false)}
      pinned={widgetPin} onPin={() => setWidgetPin(!widgetPin)} pos={widgetPos} setPos={setWidgetPos}
      alertaT={config.alertaTemprana} alertaC={config.alertaCritica} sonido={config.sonido}
    />
  );

  const userModal = showUserModal && (
    <UserModal
      user={editUser}
      onSave={saveUser}
      onClose={() => { setShowUserModal(false); setEditUser(undefined); }}
      onDelete={editUser ? () => deleteUser(editUser.id) : undefined}
    />
  );

  // SELECTOR
  if (modo === 'selector') {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {msgFloat}
        <div className="text-center">
          {/* Indicador de conexión */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4 ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
            {syncStatus === 'syncing' ? 'Sincronizando...' : isOnline ? 'Conectado al Backend' : 'Modo Offline'}
          </div>
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">LITPER PROCESOS</h1>
          <p className="text-cyan-400 text-sm mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />GAMING EDITION v2.0<Sparkles className="w-4 h-4" />
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setModo('usuario')} className="group bg-slate-800/80 rounded-2xl p-6 shadow-xl hover:shadow-cyan-500/20 border border-slate-700 hover:border-cyan-500 w-40">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-white">USUARIO</h3>
              <p className="text-xs text-slate-400">Logístico</p>
            </button>
            <button onClick={() => setModo('admin')} className="group bg-slate-800/80 rounded-2xl p-6 shadow-xl hover:shadow-amber-500/20 border border-slate-700 hover:border-amber-500 w-40">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-white">ADMIN</h3>
              <p className="text-xs text-slate-400">Gerencia</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SELECCIÓN USUARIO
  if (modo === 'usuario' && !usuario) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {userModal}
        <div className="bg-slate-800/80 rounded-2xl p-6 shadow-xl max-w-md w-full mx-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setModo('selector')} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />Volver
            </button>
            <button onClick={() => { setEditUser(undefined); setShowUserModal(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm">
              <UserPlus className="w-4 h-4" />Nuevo
            </button>
          </div>
          <div className="text-center mb-4">
            <span className="text-3xl">👋</span>
            <h2 className="text-xl font-bold text-white">¿Quién eres?</h2>
          </div>
          <div className="space-y-2">
            {usuarios.map(u => {
              const niv = getNivel(u.xp);
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-600 hover:border-cyan-500 bg-slate-700/50 hover:bg-slate-700 transition-all group">
                  <button onClick={() => { setUsuario(u); setShowWidget(true); }} className="flex-1 flex items-center gap-3 text-left">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {u.nombre.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{u.nombre}</span>
                        <span className="text-xs bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded">Lvl {niv.nivel}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex gap-2">
                        <span><Star className="w-3 h-3 inline text-yellow-400"/> {u.xp} XP</span>
                        <span><Flame className="w-3 h-3 inline text-orange-400"/> {u.racha}d</span>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => { setEditUser(u); setShowUserModal(true); }} className="p-2 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // MODO USUARIO - TRABAJANDO
  if (modo === 'usuario' && usuario) {
    const niv = getNivel(usuario.xp);
    const progMeta = Math.min((guiasHoy / config.metaDiaria) * 100, 100);
    const displayTime = config.countdown ? Math.max(0, config.tiempoRonda - tiempo) : tiempo;
    const isWarn = config.countdown ? displayTime <= config.alertaTemprana : tiempo >= (config.tiempoRonda - config.alertaTemprana);
    const isCrit = config.countdown ? displayTime <= config.alertaCritica : tiempo >= (config.tiempoRonda - config.alertaCritica);
    const color = isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400';

    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {msgFloat}{widget}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setUsuario(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />Cambiar
            </button>
            <button onClick={() => setShowWidget(!showWidget)} className={`p-2 rounded-lg ${showWidget ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              <Gamepad2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Usuario */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-bold`}>{usuario.nombre.charAt(0)}</div>
                <div>
                  <div className="font-bold text-white">{usuario.nombre}</div>
                  <div className="text-sm text-slate-400">Nivel {niv.nivel} - {niv.nombre}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{usuario.xp} XP</span><span>{Math.round(niv.progreso)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${niv.color}`} style={{width: `${niv.progreso}%`}}/>
                </div>
              </div>
            </div>
            {/* Meta */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-400" /><span className="font-bold text-white">MISIÓN DEL DÍA</span>
              </div>
              <div className="text-2xl font-bold text-white">{guiasHoy}/{config.metaDiaria}</div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{width: `${progMeta}%`}}/>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Timer className="w-5 h-5 text-cyan-400"/>RONDA {rondaNum}</h2>
              {combo > 1 && <span className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-full text-white text-sm font-bold animate-pulse">🔥 COMBO x{combo}</span>}
            </div>
            <div className="text-center mb-4">
              <div className={`text-6xl font-mono font-bold ${color}`}>{fmt(displayTime)}</div>
              <div className={`text-sm ${color}`}>{isCrit ? '🔴 CRÍTICO' : isWarn ? '🟡 ALERTA' : '🟢 NORMAL'}</div>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setActivo(!activo)} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${activo ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}>
                {activo ? <><Pause className="w-5 h-5"/>PAUSAR</> : <><Play className="w-5 h-5"/>INICIAR</>}
              </button>
              <button onClick={() => { setTiempo(0); setActivo(false); }} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl"><RotateCcw className="w-5 h-5 text-white"/></button>
              <button onClick={finalizarRonda} className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center gap-2"><Save className="w-5 h-5"/>GUARDAR</button>
            </div>
          </div>

          {/* Contadores */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400"/>CONTADORES</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                {k: 'r', icon: '✅', label: 'Realizado', color: 'bg-emerald-500/20 text-emerald-400'},
                {k: 'c', icon: '❌', label: 'Cancelado', color: 'bg-red-500/20 text-red-400'},
                {k: 'a', icon: '📅', label: 'Agendado', color: 'bg-blue-500/20 text-blue-400'},
                {k: 'd', icon: '⚠️', label: 'Difícil', color: 'bg-amber-500/20 text-amber-400'},
                {k: 'p', icon: '⏳', label: 'Pendiente', color: 'bg-purple-500/20 text-purple-400'},
              ].map(({k, icon, label, color}) => (
                <div key={k} className={`${color} rounded-xl p-3 text-center`}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <button onClick={() => setContadores({...contadores, [k]: Math.max(0, contadores[k as keyof typeof contadores] - 1)})} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20">-</button>
                    <span className="w-8 font-bold text-lg">{contadores[k as keyof typeof contadores]}</span>
                    <button onClick={() => setContadores({...contadores, [k]: contadores[k as keyof typeof contadores] + 1})} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20">+</button>
                  </div>
                  <div className="text-xs opacity-70">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-cyan-600/20 rounded-xl p-3 text-center border border-cyan-500/30">
              <p className="text-sm text-slate-400">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-cyan-400">{tiempoProm.toFixed(2)} <span className="text-sm">min</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN
  if (modo === 'admin') {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {userModal}
        <div className="bg-slate-800/80 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setModo('selector')} className="p-2 hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-5 h-5 text-white"/></button>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500"/>PANEL ADMIN</h1>
                <p className="text-xs text-slate-400">Gaming Edition v2.0</p>
              </div>
            </div>
            <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm">
              <Download className="w-4 h-4"/>Excel
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            {['hoy', 'ranking', 'equipo', 'config'].map(t => (
              <button key={t} onClick={() => setVistaAdmin(t as any)} className={`px-3 py-1.5 rounded-lg text-sm ${vistaAdmin === t ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                {t === 'hoy' ? '📅 HOY' : t === 'ranking' ? '🏆 RANKING' : t === 'equipo' ? '👥 EQUIPO' : '⚙️ CONFIG'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {vistaAdmin === 'hoy' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {label: 'Rondas', value: stats.rondas, icon: <Target className="w-4 h-4 text-blue-500"/>},
                  {label: 'Realizadas', value: stats.realizado, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500"/>, color: 'text-emerald-400'},
                  {label: 'Canceladas', value: stats.cancelado, icon: <XCircle className="w-4 h-4 text-red-500"/>, color: 'text-red-400'},
                  {label: 'T. Prom', value: `${stats.prom}m`, icon: <Clock className="w-4 h-4 text-purple-500"/>, color: 'text-purple-400'},
                  {label: 'XP Total', value: stats.xp, icon: <Star className="w-4 h-4 text-yellow-500"/>, color: 'text-yellow-400'},
                ].map(({label, value, icon, color}) => (
                  <div key={label} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-400">{label}</span>{icon}</div>
                    <p className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-3 border-b border-slate-700"><h3 className="font-bold text-white">Rondas de Hoy</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        {['Usuario', 'Ronda', 'Tiempo', 'Realizado', 'Cancel.', 'XP'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {rondas.filter(r => r.fecha === hoy).map(r => (
                        <tr key={r.id} className="hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-white">{usuarios.find(u => u.id === r.usuarioId)?.nombre}</td>
                          <td className="px-3 py-2 text-slate-300">{r.numero}</td>
                          <td className="px-3 py-2 text-slate-300">{fmt(r.tiempoTotal)}</td>
                          <td className="px-3 py-2 text-emerald-400 font-bold">{r.realizado}</td>
                          <td className="px-3 py-2 text-red-400">{r.cancelado}</td>
                          <td className="px-3 py-2 text-yellow-400">+{r.xpGanado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {vistaAdmin === 'ranking' && (
            <div className="max-w-xl mx-auto bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-4"><Trophy className="w-5 h-5 text-yellow-400"/><h3 className="font-bold text-white">RANKING</h3></div>
              {usuarios.sort((a, b) => b.xp - a.xp).map((u, i) => {
                const niv = getNivel(u.xp);
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 mb-2">
                    <span className="text-xl w-8">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-bold`}>{u.nombre.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{u.nombre}</div>
                      <div className="text-xs text-slate-400">Lvl {niv.nivel} • {u.guiasTotales} guías</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-400">{u.xp} XP</div>
                      <div className="text-xs text-slate-400">{u.racha}d racha</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {vistaAdmin === 'equipo' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => { setEditUser(undefined); setShowUserModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm">
                  <UserPlus className="w-4 h-4"/>Nuevo Usuario
                </button>
              </div>
              {usuarios.map(u => {
                const niv = getNivel(u.xp);
                return (
                  <div key={u.id} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-bold text-lg`}>{u.nombre.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-white">{u.nombre}</div>
                        <div className="text-sm text-slate-400 flex gap-3">
                          <span>Lvl {niv.nivel}</span><span>{u.xp} XP</span><span>{u.guiasTotales} guías</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setEditUser(u); setShowUserModal(true); }} className="p-2 hover:bg-slate-700 rounded-lg">
                      <Edit3 className="w-5 h-5 text-slate-400"/>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {vistaAdmin === 'config' && (
            <div className="max-w-md mx-auto bg-slate-800/80 rounded-xl p-6 border border-slate-700 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400"/>Configuración</h3>
              {[
                {label: 'Tiempo por ronda (seg)', key: 'tiempoRonda', value: config.tiempoRonda},
                {label: 'Alerta temprana (seg)', key: 'alertaTemprana', value: config.alertaTemprana},
                {label: 'Alerta crítica (seg)', key: 'alertaCritica', value: config.alertaCritica},
                {label: 'Meta diaria', key: 'metaDiaria', value: config.metaDiaria},
              ].map(({label, key, value}) => (
                <div key={key}>
                  <label className="block text-sm text-slate-300 mb-1">{label}</label>
                  <input type="number" value={value} onChange={(e) => setConfig({...config, [key]: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"/>
                </div>
              ))}
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={config.countdown} onChange={(e) => setConfig({...config, countdown: e.target.checked})} className="w-5 h-5 rounded"/>
                  <span className="text-slate-300">Modo Countdown (cuenta regresiva)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={config.sonido} onChange={(e) => setConfig({...config, sonido: e.target.checked})} className="w-5 h-5 rounded"/>
                  <span className="text-slate-300 flex items-center gap-2">{config.sonido ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>} Sonidos de alerta</span>
                </label>
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
