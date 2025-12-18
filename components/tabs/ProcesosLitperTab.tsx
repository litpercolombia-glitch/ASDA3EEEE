/**
 * 🏢 LITPER PROCESOS - ENTERPRISE EDITION v3.0
 * World-Class Interface for Desktop App Integration
 * API: https://litper-tracker-api.onrender.com/api/tracker
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Crown, Package, AlertTriangle, Clock, Play, Pause, RotateCcw, Plus, Minus, Save,
  CheckCircle2, XCircle, Star, Trophy, ChevronLeft, ChevronRight, Download, Settings,
  User, Flame, Medal, Gamepad2, X, Pin, PinOff, Lightbulb, Sparkles, Timer, Target,
  BarChart3, Zap, UserPlus, Trash2, Edit3, Volume2, VolumeX, TrendingUp, Award,
  Activity, Users, Globe, Rocket, Shield, Coffee, Moon, Sun, Bell, BellOff,
  Monitor, Wifi, WifiOff, RefreshCw, Calendar, PieChart, LineChart, Layers,
  Gift, Heart, ThumbsUp, MessageCircle, Share2, ExternalLink, Database
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ===== TIPOS =====
interface Usuario {
  id: string; nombre: string; xp: number; nivel: number; racha: number;
  medallas: string[]; guiasTotales: number; mejorTiempo: number; combosMaximos: number;
  avatar?: string; rol?: string; departamento?: string;
}

interface Ronda {
  id: string; numero: number; usuarioId: string; fecha: string;
  tiempoTotal: number; realizado: number; cancelado: number; agendado: number;
  dificiles: number; pendientes: number; xpGanado: number; comboMaximo: number;
}

interface Config {
  tiempoRonda: number; alertaTemprana: number; alertaCritica: number;
  metaDiaria: number; sonido: boolean; countdown: boolean;
  modoTurbo: boolean; notificaciones: boolean; tema: 'dark' | 'light';
}

interface Logro {
  id: string; nombre: string; descripcion: string; icono: string;
  requisito: number; tipo: 'guias' | 'racha' | 'xp' | 'nivel' | 'combo';
  desbloqueado: boolean; fechaDesbloqueo?: string;
}

interface DesafioDiario {
  id: string; titulo: string; descripcion: string; objetivo: number;
  progreso: number; recompensaXP: number; completado: boolean;
  icono: string;
}

// ===== CONSTANTES =====
const STORAGE = { RONDAS: 'lp_rondas', CONFIG: 'lp_config', USUARIOS: 'lp_users', WIDGET: 'lp_widget', LOGROS: 'lp_logros' };
const API_URL = 'https://litper-tracker-api.onrender.com/api/tracker';

const NIVELES = [
  { min: 0, max: 100, nombre: 'Novato', color: 'from-slate-400 to-slate-500', badge: '🌱' },
  { min: 100, max: 300, nombre: 'Aprendiz', color: 'from-emerald-400 to-emerald-600', badge: '📚' },
  { min: 300, max: 800, nombre: 'Competente', color: 'from-blue-400 to-blue-600', badge: '⚡' },
  { min: 800, max: 1500, nombre: 'Profesional', color: 'from-purple-400 to-purple-600', badge: '💼' },
  { min: 1500, max: 3000, nombre: 'Experto', color: 'from-indigo-400 to-indigo-600', badge: '🎯' },
  { min: 3000, max: 5000, nombre: 'Maestro', color: 'from-violet-400 to-violet-600', badge: '🏅' },
  { min: 5000, max: 8000, nombre: 'Gran Maestro', color: 'from-pink-400 to-pink-600', badge: '👑' },
  { min: 8000, max: 12000, nombre: 'Campeón', color: 'from-amber-400 to-amber-600', badge: '🏆' },
  { min: 12000, max: 20000, nombre: 'Leyenda', color: 'from-orange-400 to-red-500', badge: '🔥' },
  { min: 20000, max: 999999, nombre: 'ÉLITE MUNDIAL', color: 'from-yellow-300 via-amber-400 to-orange-500', badge: '💎' },
];

const LOGROS_DISPONIBLES: Logro[] = [
  { id: 'l1', nombre: 'Primera Guía', descripcion: 'Completa tu primera guía', icono: '🎉', requisito: 1, tipo: 'guias', desbloqueado: false },
  { id: 'l2', nombre: 'Racha de Fuego', descripcion: '5 días consecutivos', icono: '🔥', requisito: 5, tipo: 'racha', desbloqueado: false },
  { id: 'l3', nombre: 'Centurión', descripcion: '100 guías completadas', icono: '💯', requisito: 100, tipo: 'guias', desbloqueado: false },
  { id: 'l4', nombre: 'Veterano', descripcion: '500 guías completadas', icono: '🎖️', requisito: 500, tipo: 'guias', desbloqueado: false },
  { id: 'l5', nombre: 'Leyenda', descripcion: '1000 guías completadas', icono: '🏆', requisito: 1000, tipo: 'guias', desbloqueado: false },
  { id: 'l6', nombre: 'XP Master', descripcion: 'Alcanza 5000 XP', icono: '⭐', requisito: 5000, tipo: 'xp', desbloqueado: false },
  { id: 'l7', nombre: 'Combo King', descripcion: 'Combo x10', icono: '👑', requisito: 10, tipo: 'combo', desbloqueado: false },
  { id: 'l8', nombre: 'Nivel 5', descripcion: 'Alcanza nivel Experto', icono: '🎯', requisito: 5, tipo: 'nivel', desbloqueado: false },
];

const DESAFIOS_BASE: DesafioDiario[] = [
  { id: 'd1', titulo: 'Madrugador', descripcion: 'Completa 10 guías antes del mediodía', objetivo: 10, progreso: 0, recompensaXP: 50, completado: false, icono: '🌅' },
  { id: 'd2', titulo: 'Sin Errores', descripcion: 'Una ronda sin cancelaciones', objetivo: 1, progreso: 0, recompensaXP: 30, completado: false, icono: '✨' },
  { id: 'd3', titulo: 'Velocista', descripcion: 'Tiempo promedio menor a 2 min', objetivo: 1, progreso: 0, recompensaXP: 40, completado: false, icono: '⚡' },
  { id: 'd4', titulo: 'Meta Diaria', descripcion: 'Cumple tu meta del día', objetivo: 1, progreso: 0, recompensaXP: 100, completado: false, icono: '🎯' },
];

// Los 9 usuarios reales de LITPER
const DEFAULT_USERS: Usuario[] = [
  { id: 'cat1', nombre: 'CATALINA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Líder', departamento: 'Operaciones' },
  { id: 'ang1', nombre: 'ANGIE', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Senior', departamento: 'Logística' },
  { id: 'car1', nombre: 'CAROLINA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Senior', departamento: 'Logística' },
  { id: 'ale1', nombre: 'ALEJANDRA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Analista', departamento: 'Operaciones' },
  { id: 'eva1', nombre: 'EVAN', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Especialista', departamento: 'Logística' },
  { id: 'jim1', nombre: 'JIMMY', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Coordinador', departamento: 'Operaciones' },
  { id: 'fel1', nombre: 'FELIPE', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Analista', departamento: 'Logística' },
  { id: 'nor1', nombre: 'NORMA', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Senior', departamento: 'Operaciones' },
  { id: 'kar1', nombre: 'KAREN', xp: 0, nivel: 1, racha: 0, medallas: [], guiasTotales: 0, mejorTiempo: 0, combosMaximos: 0, rol: 'Especialista', departamento: 'Logística' },
];

const DEFAULT_CONFIG: Config = {
  tiempoRonda: 300, alertaTemprana: 60, alertaCritica: 30,
  metaDiaria: 60, sonido: true, countdown: true,
  modoTurbo: false, notificaciones: true, tema: 'dark'
};

// ===== HELPERS =====
const load = <T,>(key: string, def: T): T => {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
};
const save = <T,>(key: string, data: T) => localStorage.setItem(key, JSON.stringify(data));
const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
const getNivel = (xp: number) => {
  const n = NIVELES.findIndex(l => xp >= l.min && xp < l.max);
  const nivel = NIVELES[n >= 0 ? n : 0] || NIVELES[0];
  const prog = ((xp - nivel.min) / (nivel.max - nivel.min)) * 100;
  return { ...nivel, nivel: n + 1, progreso: Math.min(prog, 100) };
};
const calcXP = (r: number, t: number, c: number, combo: number, modoTurbo: boolean) => {
  let xp = r * 10 + (t < 2 ? r * 5 : t < 3 ? r * 2 : 0) - c * 3 + 50 + (c === 0 ? 25 : 0);
  const base = Math.max(0, Math.floor(xp * (1 + (combo - 1) * 0.1)));
  return modoTurbo ? Math.floor(base * 1.5) : base;
};

// ===== API HELPERS =====
const fetchUsuariosFromAPI = async (): Promise<Usuario[]> => {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Usuarios cargados desde API Render:', data.length);
      return data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        xp: u.xp || 0,
        nivel: u.nivel || 1,
        racha: u.racha || 0,
        medallas: u.medallas || [],
        guiasTotales: u.guias_totales || 0,
        mejorTiempo: u.mejor_tiempo || 0,
        combosMaximos: u.combos_maximos || 0,
        rol: u.rol || 'Operador',
        departamento: u.departamento || 'Logística',
      }));
    }
  } catch (error) {
    console.warn('⚠️ API no disponible, usando datos locales:', error);
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
    console.log('✅ Ronda sincronizada con API Render');
    return true;
  } catch (error) {
    console.warn('⚠️ Error sincronizando ronda:', error);
    return false;
  }
};

const fetchRondasFromAPI = async (fecha?: string): Promise<Ronda[]> => {
  try {
    const fechaParam = fecha || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/rondas?fecha=${fechaParam}&tipo=guias`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Rondas cargadas desde API Render:', data.length);
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
        xpGanado: r.xp_ganado || 0,
        comboMaximo: r.combo_maximo || 1,
      }));
    }
  } catch (error) {
    console.warn('⚠️ Error cargando rondas:', error);
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

const playSuccessSound = () => {
  playBeep(523, 0.1);
  setTimeout(() => playBeep(659, 0.1), 100);
  setTimeout(() => playBeep(784, 0.2), 200);
};

// ===== COMPONENTE: KPI Card Premium =====
const KPICard: React.FC<{
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; trend?: number; color: string;
}> = ({ title, value, subtitle, icon, trend, color }) => (
  <div className={`relative overflow-hidden bg-gradient-to-br ${color} rounded-2xl p-4 shadow-xl border border-white/10`}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-4 -mb-4" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70 text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">{icon}</div>
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      {subtitle && <div className="text-white/60 text-xs">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          <span>{trend >= 0 ? '+' : ''}{trend}% vs ayer</span>
        </div>
      )}
    </div>
  </div>
);

// ===== COMPONENTE: Mini Progress Ring =====
const ProgressRing: React.FC<{progress: number; size?: number; color?: string}> = ({
  progress, size = 60, color = 'stroke-cyan-500'
}) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor"
        strokeWidth="4" className="text-white/10" />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" strokeWidth="4"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className={`${color} transition-all duration-500`} strokeLinecap="round" />
    </svg>
  );
};

// ===== COMPONENTE: Badge Animado =====
const AnimatedBadge: React.FC<{children: React.ReactNode; color: string; pulse?: boolean}> = ({
  children, color, pulse
}) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color} ${pulse ? 'animate-pulse' : ''}`}>
    {children}
  </span>
);

// ===== COMPONENTE: Stat Mini =====
const StatMini: React.FC<{icon: React.ReactNode; label: string; value: string | number; color?: string}> = ({
  icon, label, value, color = 'text-white'
}) => (
  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
    <div className="text-white/50">{icon}</div>
    <div>
      <div className="text-[10px] text-white/40 uppercase">{label}</div>
      <div className={`font-bold ${color}`}>{value}</div>
    </div>
  </div>
);

// ===== COMPONENTE: Desafío Card =====
const DesafioCard: React.FC<{desafio: DesafioDiario}> = ({ desafio }) => {
  const progress = (desafio.progreso / desafio.objetivo) * 100;
  return (
    <div className={`relative overflow-hidden rounded-xl p-3 border transition-all ${
      desafio.completado
        ? 'bg-emerald-500/20 border-emerald-500/50'
        : 'bg-white/5 border-white/10 hover:border-white/20'
    }`}>
      {desafio.completado && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="text-2xl">{desafio.icono}</div>
        <div className="flex-1">
          <div className="font-bold text-white text-sm">{desafio.titulo}</div>
          <div className="text-xs text-white/50">{desafio.descripcion}</div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>{desafio.progreso}/{desafio.objetivo}</span>
              <span className="text-amber-400">+{desafio.recompensaXP} XP</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${desafio.completado ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE: Usuario Card Premium =====
const UserCardPremium: React.FC<{
  usuario: Usuario; onClick: () => void; onEdit: () => void; isSelected?: boolean;
}> = ({ usuario, onClick, onEdit, isSelected }) => {
  const niv = getNivel(usuario.xp);
  return (
    <div className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
      isSelected
        ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20'
        : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'
    }`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <button onClick={onClick} className="w-full p-4 text-left">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
              {usuario.nombre.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs border-2 border-slate-700">
              {niv.badge}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white truncate">{usuario.nombre}</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-white/60">
                Lvl {niv.nivel}
              </span>
            </div>
            <div className="text-xs text-white/50">{usuario.rol} • {usuario.departamento}</div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-3 h-3" /> {usuario.xp}
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <Flame className="w-3 h-3" /> {usuario.racha}d
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Target className="w-3 h-3" /> {usuario.guiasTotales}
              </span>
            </div>
          </div>
        </div>
      </button>
      <button onClick={onEdit} className="absolute top-3 right-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
        <Edit3 className="w-4 h-4 text-white/50" />
      </button>
    </div>
  );
};

// ===== COMPONENTE: Timer Display Premium =====
const TimerDisplayPremium: React.FC<{
  tiempo: number; maxTiempo: number; countdown: boolean;
  alertaT: number; alertaC: number; activo: boolean; modoTurbo: boolean;
}> = ({ tiempo, maxTiempo, countdown, alertaT, alertaC, activo, modoTurbo }) => {
  const displayTime = countdown ? Math.max(0, maxTiempo - tiempo) : tiempo;
  const isWarn = countdown ? displayTime <= alertaT && displayTime > alertaC : tiempo >= (maxTiempo - alertaT);
  const isCrit = countdown ? displayTime <= alertaC : tiempo >= (maxTiempo - alertaC);
  const progress = countdown ? (displayTime / maxTiempo) * 100 : Math.min((tiempo / maxTiempo) * 100, 100);

  const getColor = () => {
    if (isCrit) return { text: 'text-red-400', bg: 'from-red-500/30 to-red-600/30', ring: 'stroke-red-500' };
    if (isWarn) return { text: 'text-amber-400', bg: 'from-amber-500/30 to-orange-600/30', ring: 'stroke-amber-500' };
    return { text: 'text-emerald-400', bg: 'from-emerald-500/30 to-cyan-600/30', ring: 'stroke-emerald-500' };
  };

  const colors = getColor();

  return (
    <div className={`relative bg-gradient-to-br ${colors.bg} rounded-3xl p-8 border border-white/10 ${modoTurbo ? 'animate-pulse' : ''}`}>
      {modoTurbo && (
        <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white text-xs font-bold flex items-center gap-1">
          <Rocket className="w-3 h-3" /> TURBO x1.5
        </div>
      )}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
            <circle cx="100" cy="100" r="90" fill="none" strokeWidth="8"
              strokeDasharray={565.48} strokeDashoffset={565.48 - (progress / 100) * 565.48}
              className={`${colors.ring} transition-all duration-1000`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-6xl font-mono font-black ${colors.text} tracking-tight`}>
              {fmt(displayTime)}
            </div>
            <div className={`text-sm font-medium ${colors.text} flex items-center gap-2 mt-1`}>
              {activo ? (
                <><span className="w-2 h-2 rounded-full bg-current animate-pulse" /> EN CURSO</>
              ) : (
                <><span className="w-2 h-2 rounded-full bg-white/30" /> PAUSADO</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE: Counter Premium =====
const CounterPremium: React.FC<{
  icon: string; label: string; value: number; onChange: (v: number) => void;
  color: string; bgColor: string;
}> = ({ icon, label, value, onChange, color, bgColor }) => (
  <div className={`${bgColor} rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
    </div>
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-all active:scale-95"
      >-</button>
      <span className={`text-4xl font-black ${color} w-16 text-center`}>{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-all active:scale-95"
      >+</button>
    </div>
  </div>
);

// ===== COMPONENTE: Modal Premium =====
const ModalPremium: React.FC<{
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE: Widget Flotante Premium =====
const FloatingWidgetPremium: React.FC<{
  usuario: Usuario; tiempo: number; maxTiempo: number; activo: boolean; countdown: boolean;
  contadores: {r: number; c: number; a: number; d: number; p: number};
  setContadores: (c: any) => void; combo: number; meta: number; guiasHoy: number;
  onToggle: () => void; onSave: () => void; onClose: () => void;
  pinned: boolean; onPin: () => void; pos: {x: number; y: number}; setPos: (p: any) => void;
  alertaT: number; alertaC: number; sonido: boolean; modoTurbo: boolean;
}> = (props) => {
  const { usuario, tiempo, maxTiempo, activo, countdown, contadores, setContadores, combo,
    meta, guiasHoy, onToggle, onSave, onClose, pinned, onPin, pos, setPos, alertaT, alertaC, modoTurbo } = props;
  const [drag, setDrag] = useState(false);
  const [offset, setOffset] = useState({x: 0, y: 0});

  const displayTime = countdown ? Math.max(0, maxTiempo - tiempo) : tiempo;
  const isWarn = countdown ? displayTime <= alertaT && displayTime > alertaC : tiempo >= (maxTiempo - alertaT);
  const isCrit = countdown ? displayTime <= alertaC : tiempo >= (maxTiempo - alertaC);
  const color = isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400';
  const bgColor = isCrit ? 'from-red-500/20' : isWarn ? 'from-amber-500/20' : 'from-emerald-500/20';

  useEffect(() => {
    const move = (e: MouseEvent) => drag && setPos({x: e.clientX - offset.x, y: e.clientY - offset.y});
    const up = () => setDrag(false);
    if (drag) { document.addEventListener('mousemove', move); document.addEventListener('mouseup', up); }
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [drag, offset]);

  const niv = getNivel(usuario.xp);
  const progMeta = Math.min((guiasHoy / meta) * 100, 100);

  return (
    <div
      className={`fixed z-50 bg-slate-900/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 w-80 ${drag ? 'cursor-grabbing' : 'cursor-grab'} ${pinned ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900' : ''}`}
      style={{left: pos.x, top: pos.y}}
      onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('.ctrl')) { setDrag(true); setOffset({x: e.clientX - pos.x, y: e.clientY - pos.y}); }}}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-t-3xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-bold shadow-lg`}>
              {usuario.nombre.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{usuario.nombre}</div>
              <div className="text-white/70 text-xs">Nivel {niv.nivel} • {niv.nombre}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 ctrl">
            {modoTurbo && <span className="text-orange-400 text-lg animate-bounce">🚀</span>}
            {combo > 1 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">x{combo}</span>}
            <button onClick={onPin} className="p-1.5 hover:bg-white/20 rounded-lg">{pinned ? <PinOff className="w-4 h-4 text-white"/> : <Pin className="w-4 h-4 text-white"/>}</button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg"><X className="w-4 h-4 text-white"/></button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Timer */}
        <div className={`bg-gradient-to-br ${bgColor} to-transparent rounded-2xl p-4 text-center border border-white/10`}>
          <div className={`text-5xl font-mono font-black ${color}`}>{fmt(displayTime)}</div>
          <div className={`text-xs ${color} mt-1`}>
            {isCrit ? '🔴 TIEMPO CRÍTICO' : isWarn ? '🟡 CASI TERMINA' : '🟢 EN PROGRESO'}
          </div>
        </div>

        {/* Mini Contadores */}
        <div className="grid grid-cols-5 gap-1.5 ctrl">
          {[
            {k: 'r', icon: '✅', color: 'bg-emerald-500/30 text-emerald-400'},
            {k: 'c', icon: '❌', color: 'bg-red-500/30 text-red-400'},
            {k: 'a', icon: '📅', color: 'bg-blue-500/30 text-blue-400'},
            {k: 'd', icon: '⚠️', color: 'bg-amber-500/30 text-amber-400'},
            {k: 'p', icon: '⏳', color: 'bg-purple-500/30 text-purple-400'},
          ].map(({k, icon, color: c}) => (
            <div key={k} className={`${c} rounded-xl p-2 text-center`}>
              <div className="text-sm mb-1">{icon}</div>
              <div className="flex items-center justify-center gap-0.5">
                <button onClick={() => setContadores({...contadores, [k]: Math.max(0, contadores[k as keyof typeof contadores] - 1)})} className="w-5 h-5 rounded bg-black/20 hover:bg-black/40 text-[10px]">-</button>
                <span className="w-5 font-bold text-sm">{contadores[k as keyof typeof contadores]}</span>
                <button onClick={() => setContadores({...contadores, [k]: contadores[k as keyof typeof contadores] + 1})} className="w-5 h-5 rounded bg-black/20 hover:bg-black/40 text-[10px]">+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Controles */}
        <div className="flex gap-2 ctrl">
          <button onClick={onToggle} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${activo ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}>
            {activo ? <><Pause className="w-4 h-4"/>PAUSAR</> : <><Play className="w-4 h-4"/>INICIAR</>}
          </button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-lg hover:shadow-cyan-500/30">
            <Save className="w-4 h-4"/>GUARDAR
          </button>
        </div>

        {/* Meta del día */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex justify-between text-xs text-white/60 mb-2">
            <span className="flex items-center gap-1"><Target className="w-3 h-3"/> Meta diaria</span>
            <span className="text-cyan-400">{guiasHoy}/{meta}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{width: `${progMeta}%`}}/>
          </div>
          {progMeta >= 100 && <div className="text-center text-emerald-400 text-xs mt-2 animate-pulse">🎉 ¡Meta cumplida!</div>}
        </div>

        {/* Stats mini */}
        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400"/>{usuario.xp} XP</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400"/>{usuario.racha}d racha</span>
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-purple-400"/>{usuario.guiasTotales} total</span>
        </div>
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
  const [logros, setLogros] = useState<Logro[]>(() => load(STORAGE.LOGROS, LOGROS_DISPONIBLES));
  const [desafios, setDesafios] = useState<DesafioDiario[]>(DESAFIOS_BASE);

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
  const [vistaAdmin, setVistaAdmin] = useState<'dashboard' | 'ranking' | 'equipo' | 'config' | 'logros'>('dashboard');
  const [showLogros, setShowLogros] = useState(false);
  const [showDesafios, setShowDesafios] = useState(false);

  // Estado de conexión
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Cargar datos desde API al inicio
  useEffect(() => {
    const loadFromAPI = async () => {
      setSyncStatus('syncing');
      try {
        const backendUsers = await fetchUsuariosFromAPI();
        if (backendUsers.length > 0) {
          const localUsers = load<Usuario[]>(STORAGE.USUARIOS, DEFAULT_USERS);
          const mergedUsers = backendUsers.map(bu => {
            const local = localUsers.find(lu => lu.id === bu.id);
            return local ? { ...bu, xp: local.xp, nivel: local.nivel, racha: local.racha, guiasTotales: local.guiasTotales, medallas: local.medallas, mejorTiempo: local.mejorTiempo, combosMaximos: local.combosMaximos } : bu;
          });
          setUsuarios(mergedUsers);
          setIsOnline(true);
        }

        const backendRondas = await fetchRondasFromAPI();
        if (backendRondas.length > 0) {
          const localRondas = load<Ronda[]>(STORAGE.RONDAS, []);
          const allRondas = [...localRondas.filter(lr => !backendRondas.some(br => br.id === lr.id)), ...backendRondas];
          setRondas(allRondas);
        }

        setSyncStatus('success');
        setLastSync(new Date());
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (error) {
        console.warn('Error cargando desde API:', error);
        setIsOnline(false);
        setSyncStatus('error');
      }
    };

    loadFromAPI();

    const handleOnline = () => { setIsOnline(true); loadFromAPI(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistencia local
  useEffect(() => { save(STORAGE.USUARIOS, usuarios); }, [usuarios]);
  useEffect(() => { save(STORAGE.RONDAS, rondas); }, [rondas]);
  useEffect(() => { save(STORAGE.CONFIG, config); }, [config]);
  useEffect(() => { save(STORAGE.WIDGET, widgetPos); }, [widgetPos]);
  useEffect(() => { save(STORAGE.LOGROS, logros); }, [logros]);

  // Timer
  useEffect(() => {
    if (!activo) return;
    const interval = setInterval(() => {
      setTiempo(t => {
        const newT = t + 1;
        const remaining = config.tiempoRonda - newT;
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

  // Verificar logros
  const verificarLogros = (u: Usuario) => {
    const nuevosLogros = [...logros];
    let cambios = false;

    nuevosLogros.forEach(l => {
      if (l.desbloqueado) return;
      let cumple = false;
      switch (l.tipo) {
        case 'guias': cumple = u.guiasTotales >= l.requisito; break;
        case 'racha': cumple = u.racha >= l.requisito; break;
        case 'xp': cumple = u.xp >= l.requisito; break;
        case 'nivel': cumple = getNivel(u.xp).nivel >= l.requisito; break;
        case 'combo': cumple = u.combosMaximos >= l.requisito; break;
      }
      if (cumple) {
        l.desbloqueado = true;
        l.fechaDesbloqueo = new Date().toISOString();
        cambios = true;
        setShowMsg(`🏆 ¡Logro desbloqueado: ${l.nombre}!`);
        setTimeout(() => setShowMsg(''), 3000);
        if (config.sonido) playSuccessSound();
      }
    });

    if (cambios) setLogros(nuevosLogros);
  };

  // Funciones
  const finalizarRonda = async () => {
    if (!usuario) return;
    const xp = calcXP(contadores.r, tiempoProm, contadores.c, combo, config.modoTurbo);
    const nuevaRonda: Ronda = {
      id: `r-${Date.now()}`, numero: rondaNum, usuarioId: usuario.id, fecha: hoy,
      tiempoTotal: tiempo, realizado: contadores.r, cancelado: contadores.c, agendado: contadores.a,
      dificiles: contadores.d, pendientes: contadores.p, xpGanado: xp, comboMaximo: combo,
    };
    setRondas(prev => [...prev, nuevaRonda]);

    const nuevoXP = usuario.xp + xp;
    const nuevasGuias = usuario.guiasTotales + contadores.r;
    const nuevoComboMax = Math.max(usuario.combosMaximos, combo);
    const updated = {...usuario, xp: nuevoXP, guiasTotales: nuevasGuias, combosMaximos: nuevoComboMax};
    setUsuarios(prev => prev.map(u => u.id === usuario.id ? updated : u));
    setUsuario(updated);

    // Verificar logros
    verificarLogros(updated);

    // Sincronizar con API
    if (isOnline) {
      const synced = await syncRondaToAPI(nuevaRonda, usuario);
      setShowMsg(`🎉 +${xp} XP! ${config.modoTurbo ? '🚀 TURBO BONUS!' : ''} ${synced ? '☁️' : '💾'}`);
    } else {
      setShowMsg(`🎉 +${xp} XP! ${config.modoTurbo ? '🚀' : ''} (Guardado local)`);
    }
    setTimeout(() => setShowMsg(''), 3000);
    if (config.sonido) playSuccessSound();

    // Actualizar combo
    if (contadores.c === 0 && contadores.r >= 3) {
      setCombo(c => Math.min(c + 1, 10));
    } else {
      setCombo(1);
    }

    setRondaNum(n => n + 1);
    setTiempo(0);
    setActivo(false);
    setContadores({r: 0, c: 0, a: 0, d: 0, p: 0});
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
    const rondasAyer = rondas.filter(r => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      return r.fecha === ayer.toLocaleDateString('es-CO');
    });
    const realizadoHoy = rondasHoy.reduce((a, r) => a + r.realizado, 0);
    const realizadoAyer = rondasAyer.reduce((a, r) => a + r.realizado, 0);
    const trend = realizadoAyer > 0 ? Math.round(((realizadoHoy - realizadoAyer) / realizadoAyer) * 100) : 0;

    return {
      rondas: rondasHoy.length,
      realizado: realizadoHoy,
      cancelado: rondasHoy.reduce((a, r) => a + r.cancelado, 0),
      prom: rondasHoy.length > 0 ? (rondasHoy.reduce((a, r) => a + r.tiempoTotal, 0) / rondasHoy.length / 60).toFixed(1) : '0',
      xp: rondasHoy.reduce((a, r) => a + r.xpGanado, 0),
      trend,
      eficiencia: realizadoHoy > 0 ? Math.round((realizadoHoy / (realizadoHoy + rondasHoy.reduce((a, r) => a + r.cancelado, 0))) * 100) : 0,
    };
  }, [rondas, hoy]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = [['Fecha', 'Usuario', 'Ronda', 'Realizado', 'Cancelado', 'Agendado', 'Tiempo', 'XP', 'Combo'],
      ...rondas.map(r => [r.fecha, usuarios.find(u => u.id === r.usuarioId)?.nombre, r.numero, r.realizado, r.cancelado, r.agendado, fmt(r.tiempoTotal), r.xpGanado, r.comboMaximo])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Rondas');
    XLSX.writeFile(wb, `LITPER_Enterprise_${hoy.replace(/\//g, '-')}.xlsx`);
  };

  // ===== RENDERS =====
  const msgFloat = showMsg && (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce border border-white/20">
        <span className="font-bold">{showMsg}</span>
      </div>
    </div>
  );

  const widget = showWidget && usuario && (
    <FloatingWidgetPremium
      usuario={usuario} tiempo={tiempo} maxTiempo={config.tiempoRonda} activo={activo}
      countdown={config.countdown} contadores={contadores} setContadores={setContadores}
      combo={combo} meta={config.metaDiaria} guiasHoy={guiasHoy}
      onToggle={() => setActivo(!activo)} onSave={finalizarRonda} onClose={() => setShowWidget(false)}
      pinned={widgetPin} onPin={() => setWidgetPin(!widgetPin)} pos={widgetPos} setPos={setWidgetPos}
      alertaT={config.alertaTemprana} alertaC={config.alertaCritica} sonido={config.sonido}
      modoTurbo={config.modoTurbo}
    />
  );

  // ===== SELECTOR PREMIUM =====
  if (modo === 'selector') {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
        {msgFloat}

        {/* Efectos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid de fondo */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 text-center max-w-2xl px-6">
          {/* Status de conexión premium */}
          <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm mb-8 backdrop-blur-xl border ${
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="font-medium">
              {syncStatus === 'syncing' ? 'Conectando con API...' : isOnline ? 'Conectado a LITPER Cloud' : 'Modo Offline'}
            </span>
            {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin" />}
            {syncStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
          </div>

          {/* Logo y título */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-28 h-28 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/30 mb-6">
                <Monitor className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                3.0
              </div>
            </div>

            <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
              LITPER <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">PROCESOS</span>
            </h1>

            <div className="flex items-center justify-center gap-3 text-white/60">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
              <span className="text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Enterprise Edition
                <Sparkles className="w-4 h-4 text-amber-400" />
              </span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
            </div>
          </div>

          {/* Descripción */}
          <p className="text-white/50 text-sm mb-10 max-w-md mx-auto">
            Sistema de gestión de procesos logísticos con gamificación,
            análisis en tiempo real y sincronización cloud.
          </p>

          {/* Botones de acceso */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setModo('usuario')}
              className="group relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 border border-cyan-400/30 min-w-[200px]"
            >
              <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">OPERADOR</h3>
                <p className="text-white/70 text-xs">Área Logística</p>
              </div>
            </button>

            <button
              onClick={() => setModo('admin')}
              className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105 border border-amber-400/30 min-w-[200px]"
            >
              <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">GERENCIA</h3>
                <p className="text-white/70 text-xs">Panel Administrativo</p>
              </div>
            </button>
          </div>

          {/* Stats globales */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-white/40">
              <Users className="w-4 h-4" />
              <span>{usuarios.length} usuarios activos</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 text-white/40">
              <Database className="w-4 h-4" />
              <span>{rondas.length} registros</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 text-white/40">
              <Globe className="w-4 h-4" />
              <span>API Cloud</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== SELECCIÓN USUARIO =====
  if (modo === 'usuario' && !usuario) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 overflow-auto">
        <ModalPremium
          isOpen={showUserModal}
          onClose={() => { setShowUserModal(false); setEditUser(undefined); }}
          title={editUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
        >
          <UserForm user={editUser} onSave={saveUser} onDelete={editUser ? () => deleteUser(editUser.id) : undefined} />
        </ModalPremium>

        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setModo('selector')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <button
              onClick={() => { setEditUser(undefined); setShowUserModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👋</div>
            <h2 className="text-2xl font-bold text-white mb-2">Selecciona tu perfil</h2>
            <p className="text-white/50 text-sm">Elige tu usuario para comenzar a trabajar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usuarios.map(u => (
              <UserCardPremium
                key={u.id}
                usuario={u}
                onClick={() => { setUsuario(u); setShowWidget(true); }}
                onEdit={() => { setEditUser(u); setShowUserModal(true); }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== MODO TRABAJO =====
  if (modo === 'usuario' && usuario) {
    const niv = getNivel(usuario.xp);
    const progMeta = Math.min((guiasHoy / config.metaDiaria) * 100, 100);

    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        {msgFloat}{widget}

        <div className="max-w-5xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setUsuario(null)} className="flex items-center gap-2 text-white/50 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {usuario.nombre.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white">{usuario.nombre}</div>
                  <div className="text-xs text-white/50">Nivel {niv.nivel} • {niv.nombre}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfig({...config, modoTurbo: !config.modoTurbo})}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  config.modoTurbo
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <Rocket className="w-4 h-4" />
                TURBO
              </button>
              <button onClick={() => setShowDesafios(!showDesafios)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl">
                <Gift className="w-5 h-5 text-amber-400" />
              </button>
              <button onClick={() => setShowLogros(!showLogros)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl">
                <Trophy className="w-5 h-5 text-purple-400" />
              </button>
              <button onClick={() => setShowWidget(!showWidget)} className={`p-2 rounded-xl ${showWidget ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                <Gamepad2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desafíos Diarios */}
          {showDesafios && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" /> Desafíos del Día
                </h3>
                <button onClick={() => setShowDesafios(false)} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {desafios.map(d => <DesafioCard key={d.id} desafio={d} />)}
              </div>
            </div>
          )}

          {/* Logros */}
          {showLogros && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-400" /> Logros ({logros.filter(l => l.desbloqueado).length}/{logros.length})
                </h3>
                <button onClick={() => setShowLogros(false)} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {logros.map(l => (
                  <div key={l.id} className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${l.desbloqueado ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-white/5 opacity-40'}`} title={l.descripcion}>
                    <span className="text-2xl">{l.icono}</span>
                    <span className="text-[8px] text-white/60 mt-1 text-center truncate w-full">{l.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
                <Target className="w-4 h-4" /> Meta Diaria
              </div>
              <div className="text-3xl font-black text-white">{guiasHoy}/{config.metaDiaria}</div>
              <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{width: `${progMeta}%`}} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                <Star className="w-4 h-4" /> XP Total
              </div>
              <div className="text-3xl font-black text-white">{usuario.xp}</div>
              <div className="text-xs text-white/40 mt-1">+{stats.xp} hoy</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl p-4 border border-orange-500/20">
              <div className="flex items-center gap-2 text-orange-400 text-xs mb-1">
                <Flame className="w-4 h-4" /> Racha
              </div>
              <div className="text-3xl font-black text-white">{usuario.racha} <span className="text-sm font-normal text-white/40">días</span></div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 text-purple-400 text-xs mb-1">
                <Zap className="w-4 h-4" /> Combo
              </div>
              <div className="text-3xl font-black text-white">x{combo}</div>
              {config.modoTurbo && <div className="text-xs text-orange-400 mt-1">🚀 +50% XP</div>}
            </div>
          </div>

          {/* Timer y Contadores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Timer */}
            <div className="space-y-4">
              <TimerDisplayPremium
                tiempo={tiempo}
                maxTiempo={config.tiempoRonda}
                countdown={config.countdown}
                alertaT={config.alertaTemprana}
                alertaC={config.alertaCritica}
                activo={activo}
                modoTurbo={config.modoTurbo}
              />

              {/* Controles */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActivo(!activo)}
                  className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-98 ${
                    activo
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30'
                  }`}
                >
                  {activo ? <><Pause className="w-5 h-5"/>PAUSAR</> : <><Play className="w-5 h-5"/>INICIAR</>}
                </button>
                <button onClick={() => { setTiempo(0); setActivo(false); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>
                <button onClick={finalizarRonda} className="flex-1 py-4 rounded-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all active:scale-98">
                  <Save className="w-5 h-5"/>GUARDAR
                </button>
              </div>
            </div>

            {/* Contadores */}
            <div className="space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" /> Ronda #{rondaNum}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <CounterPremium icon="✅" label="Realizado" value={contadores.r} onChange={(v) => setContadores({...contadores, r: v})} color="text-emerald-400" bgColor="bg-emerald-500/10" />
                <CounterPremium icon="❌" label="Cancelado" value={contadores.c} onChange={(v) => setContadores({...contadores, c: v})} color="text-red-400" bgColor="bg-red-500/10" />
                <CounterPremium icon="📅" label="Agendado" value={contadores.a} onChange={(v) => setContadores({...contadores, a: v})} color="text-blue-400" bgColor="bg-blue-500/10" />
                <CounterPremium icon="⚠️" label="Difícil" value={contadores.d} onChange={(v) => setContadores({...contadores, d: v})} color="text-amber-400" bgColor="bg-amber-500/10" />
              </div>
              <CounterPremium icon="⏳" label="Pendiente" value={contadores.p} onChange={(v) => setContadores({...contadores, p: v})} color="text-purple-400" bgColor="bg-purple-500/10" />

              {/* Tiempo promedio */}
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl p-4 border border-cyan-500/20 text-center">
                <div className="text-xs text-cyan-400 mb-1">Tiempo Promedio por Guía</div>
                <div className="text-4xl font-black text-white">{tiempoProm.toFixed(2)} <span className="text-lg font-normal text-white/40">min</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== ADMIN DASHBOARD =====
  if (modo === 'admin') {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <ModalPremium
          isOpen={showUserModal}
          onClose={() => { setShowUserModal(false); setEditUser(undefined); }}
          title={editUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
        >
          <UserForm user={editUser} onSave={saveUser} onDelete={editUser ? () => deleteUser(editUser.id) : undefined} />
        </ModalPremium>

        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setModo('selector')} className="p-2 hover:bg-white/10 rounded-xl">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Panel de Control
                  </h1>
                  <p className="text-xs text-white/50">LITPER Enterprise v3.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {[
                { id: 'dashboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Dashboard' },
                { id: 'ranking', icon: <Trophy className="w-4 h-4" />, label: 'Ranking' },
                { id: 'equipo', icon: <Users className="w-4 h-4" />, label: 'Equipo' },
                { id: 'logros', icon: <Award className="w-4 h-4" />, label: 'Logros' },
                { id: 'config', icon: <Settings className="w-4 h-4" />, label: 'Config' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setVistaAdmin(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    vistaAdmin === t.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {vistaAdmin === 'dashboard' && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <KPICard
                  title="Guías Hoy"
                  value={stats.realizado}
                  subtitle={`${stats.rondas} rondas completadas`}
                  icon={<Package className="w-5 h-5 text-white" />}
                  trend={stats.trend}
                  color="from-emerald-500/80 to-emerald-700/80"
                />
                <KPICard
                  title="Canceladas"
                  value={stats.cancelado}
                  subtitle="Hoy"
                  icon={<XCircle className="w-5 h-5 text-white" />}
                  color="from-red-500/80 to-red-700/80"
                />
                <KPICard
                  title="Eficiencia"
                  value={`${stats.eficiencia}%`}
                  subtitle="Tasa de éxito"
                  icon={<TrendingUp className="w-5 h-5 text-white" />}
                  color="from-blue-500/80 to-blue-700/80"
                />
                <KPICard
                  title="T. Promedio"
                  value={`${stats.prom}m`}
                  subtitle="Por ronda"
                  icon={<Clock className="w-5 h-5 text-white" />}
                  color="from-purple-500/80 to-purple-700/80"
                />
                <KPICard
                  title="XP Total"
                  value={stats.xp}
                  subtitle="Acumulado hoy"
                  icon={<Star className="w-5 h-5 text-white" />}
                  color="from-amber-500/80 to-orange-700/80"
                />
              </div>

              {/* Tabla de rondas */}
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Actividad de Hoy
                  </h3>
                  <span className="text-xs text-white/40">{rondas.filter(r => r.fecha === hoy).length} registros</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        {['Usuario', 'Ronda', 'Tiempo', 'Realizado', 'Cancelado', 'XP', 'Combo'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-white/40 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rondas.filter(r => r.fecha === hoy).slice(-20).reverse().map(r => {
                        const u = usuarios.find(u => u.id === r.usuarioId);
                        const niv = u ? getNivel(u.xp) : NIVELES[0];
                        return (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${niv.color} flex items-center justify-center text-white text-xs font-bold`}>
                                  {u?.nombre.charAt(0) || '?'}
                                </div>
                                <span className="text-white font-medium">{u?.nombre || 'Desconocido'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white/60">#{r.numero}</td>
                            <td className="px-4 py-3 text-white/60">{fmt(r.tiempoTotal)}</td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">{r.realizado}</td>
                            <td className="px-4 py-3 text-red-400">{r.cancelado}</td>
                            <td className="px-4 py-3 text-amber-400 font-bold">+{r.xpGanado}</td>
                            <td className="px-4 py-3">
                              {r.comboMaximo > 1 && (
                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">x{r.comboMaximo}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {vistaAdmin === 'ranking' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="text-center mb-6">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-white">Ranking Global</h2>
                <p className="text-white/50 text-sm">Clasificación por XP acumulado</p>
              </div>
              {usuarios.sort((a, b) => b.xp - a.xp).map((u, i) => {
                const niv = getNivel(u.xp);
                return (
                  <div key={u.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    i === 0 ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30' :
                    i === 1 ? 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/30' :
                    i === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/30' :
                    'bg-white/5 border-white/10'
                  }`}>
                    <span className="text-2xl w-10 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${niv.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {u.nombre.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{u.nombre}</div>
                      <div className="text-xs text-white/50">Nivel {niv.nivel} • {niv.nombre} • {u.guiasTotales} guías</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-amber-400">{u.xp} XP</div>
                      <div className="text-xs text-white/40 flex items-center gap-1 justify-end">
                        <Flame className="w-3 h-3 text-orange-400" /> {u.racha}d racha
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {vistaAdmin === 'equipo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Equipo ({usuarios.length})
                </h2>
                <button
                  onClick={() => { setEditUser(undefined); setShowUserModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Nuevo
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usuarios.map(u => (
                  <UserCardPremium
                    key={u.id}
                    usuario={u}
                    onClick={() => { setEditUser(u); setShowUserModal(true); }}
                    onEdit={() => { setEditUser(u); setShowUserModal(true); }}
                  />
                ))}
              </div>
            </div>
          )}

          {vistaAdmin === 'logros' && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <Award className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-white">Sistema de Logros</h2>
                <p className="text-white/50 text-sm">{logros.filter(l => l.desbloqueado).length} de {logros.length} desbloqueados</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {logros.map(l => (
                  <div key={l.id} className={`p-4 rounded-2xl border text-center transition-all ${
                    l.desbloqueado
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30'
                      : 'bg-white/5 border-white/10 opacity-50'
                  }`}>
                    <div className="text-4xl mb-2">{l.icono}</div>
                    <div className="font-bold text-white text-sm">{l.nombre}</div>
                    <div className="text-xs text-white/50 mt-1">{l.descripcion}</div>
                    {l.desbloqueado && l.fechaDesbloqueo && (
                      <div className="text-[10px] text-purple-400 mt-2">
                        {new Date(l.fechaDesbloqueo).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vistaAdmin === 'config' && (
            <div className="max-w-lg mx-auto bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6">
              <h3 className="font-bold text-white text-xl flex items-center gap-2">
                <Settings className="w-5 h-5 text-white/50" />
                Configuración
              </h3>

              {[
                { label: 'Tiempo por ronda (segundos)', key: 'tiempoRonda', value: config.tiempoRonda },
                { label: 'Alerta temprana (segundos)', key: 'alertaTemprana', value: config.alertaTemprana },
                { label: 'Alerta crítica (segundos)', key: 'alertaCritica', value: config.alertaCritica },
                { label: 'Meta diaria de guías', key: 'metaDiaria', value: config.metaDiaria },
              ].map(({ label, key, value }) => (
                <div key={key}>
                  <label className="block text-sm text-white/60 mb-2">{label}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setConfig({...config, [key]: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              ))}

              <div className="space-y-4 pt-4 border-t border-white/10">
                {[
                  { label: 'Modo Countdown (cuenta regresiva)', key: 'countdown', value: config.countdown, icon: <Timer className="w-4 h-4" /> },
                  { label: 'Sonidos de alerta', key: 'sonido', value: config.sonido, icon: config.sonido ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" /> },
                  { label: 'Modo Turbo (+50% XP)', key: 'modoTurbo', value: config.modoTurbo, icon: <Rocket className="w-4 h-4" /> },
                  { label: 'Notificaciones', key: 'notificaciones', value: config.notificaciones, icon: config.notificaciones ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" /> },
                ].map(({ label, key, value, icon }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-white/70 flex items-center gap-2 group-hover:text-white transition-colors">
                      {icon}
                      {label}
                    </span>
                    <div
                      onClick={() => setConfig({...config, [key]: !value})}
                      className={`w-12 h-6 rounded-full transition-all ${value ? 'bg-cyan-500' : 'bg-white/20'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-white/40 space-y-1">
                  <p>API: {API_URL}</p>
                  <p>Estado: {isOnline ? '🟢 Conectado' : '🔴 Desconectado'}</p>
                  {lastSync && <p>Última sync: {lastSync.toLocaleTimeString()}</p>}
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

// ===== COMPONENTE: User Form =====
const UserForm: React.FC<{
  user?: Usuario; onSave: (u: Usuario) => void; onDelete?: () => void;
}> = ({ user, onSave, onDelete }) => {
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [rol, setRol] = useState(user?.rol || 'Operador');
  const [departamento, setDepartamento] = useState(user?.departamento || 'Logística');

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
      rol,
      departamento,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-white/60 mb-2">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del usuario"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-2">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="Operador">Operador</option>
          <option value="Analista">Analista</option>
          <option value="Especialista">Especialista</option>
          <option value="Coordinador">Coordinador</option>
          <option value="Senior">Senior</option>
          <option value="Líder">Líder</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-2">Departamento</label>
        <select
          value={departamento}
          onChange={(e) => setDepartamento(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="Logística">Logística</option>
          <option value="Operaciones">Operaciones</option>
          <option value="Calidad">Calidad</option>
          <option value="Soporte">Soporte</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
          Guardar
        </button>
      </div>
      {onDelete && (
        <button onClick={onDelete} className="w-full py-3 rounded-xl font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center gap-2 transition-all">
          <Trash2 className="w-4 h-4" />
          Eliminar Usuario
        </button>
      )}
    </div>
  );
};

export default ProcesosLitperTab;
