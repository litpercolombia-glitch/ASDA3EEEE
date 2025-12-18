/**
 * TRACKER POPUP COMPONENT
 * Ventana emergente flotante para tracking de rondas logísticas
 * Se puede abrir en una ventana separada del navegador
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Save,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  Truck,
  FileText,
  Users
} from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';

interface TrackerPopupProps {
  usuarioId: string;
  usuarioNombre: string;
  usuarioAvatar: string;
  usuarioColor: string;
  onClose: () => void;
  isMinimized?: boolean;
}

type TipoProceso = 'guias' | 'novedades';

interface RondaData {
  id: string;
  tipo: TipoProceso;
  numero: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  // Campos guías
  pedidosIniciales?: number;
  realizado?: number;
  cancelado?: number;
  agendado?: number;
  dificiles?: number;
  pendientes?: number;
  revisado?: number;
  // Campos novedades
  revisadas?: number;
  solucionadas?: number;
  devolucion?: number;
  cliente?: number;
  transportadora?: number;
  litper?: number;
}

const API_URL = 'http://localhost:8000/api/tracker';

const TrackerPopup: React.FC<TrackerPopupProps> = ({
  usuarioId,
  usuarioNombre,
  usuarioAvatar,
  usuarioColor,
  onClose,
}) => {
  // Estados
  const [proceso, setProceso] = useState<TipoProceso | null>(null);
  const [tiempoTotal, setTiempoTotal] = useState(30 * 60); // 30 minutos por defecto
  const [tiempoRestante, setTiempoRestante] = useState(30 * 60);
  const [estadoTimer, setEstadoTimer] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [rondaNumero, setRondaNumero] = useState(1);
  const [horaInicio, setHoraInicio] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [rondasHoy, setRondasHoy] = useState<RondaData[]>([]);

  // Valores Guías
  const [valoresGuias, setValoresGuias] = useState({
    pedidosIniciales: 0,
    realizado: 0,
    cancelado: 0,
    agendado: 0,
    dificiles: 0,
    pendientes: 0,
    revisado: 0,
  });

  // Valores Novedades
  const [valoresNovedades, setValoresNovedades] = useState({
    revisadas: 0,
    solucionadas: 0,
    devolucion: 0,
    cliente: 0,
    transportadora: 0,
    litper: 0,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (estadoTimer === 'running' && tiempoRestante > 0) {
      interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            setEstadoTimer('finished');
            playAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [estadoTimer, tiempoRestante]);

  // Cargar rondas del día
  useEffect(() => {
    const cargarRondas = async () => {
      try {
        const fecha = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_URL}/rondas?fecha=${fecha}&usuario_id=${usuarioId}`);
        if (response.ok) {
          const data = await response.json();
          setRondasHoy(data);
          // Calcular número de ronda
          const rondasProceso = data.filter((r: RondaData) => r.tipo === proceso);
          setRondaNumero(rondasProceso.length + 1);
        }
      } catch (error) {
        console.warn('No se pudieron cargar rondas:', error);
      }
    };
    if (proceso) {
      cargarRondas();
    }
  }, [usuarioId, proceso]);

  const playAlarmSound = () => {
    try {
      const ctx = new AudioContext();
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.2);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.2);
      }
    } catch (e) {
      console.log('No se pudo reproducir alarma');
    }
  };

  const playSuccessSound = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.log('No se pudo reproducir sonido');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const horaActual = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const iniciarTimer = () => {
    if (!horaInicio) setHoraInicio(horaActual());
    setEstadoTimer('running');
  };

  const pausarTimer = () => setEstadoTimer('paused');

  const resetTimer = () => {
    setEstadoTimer('idle');
    setTiempoRestante(tiempoTotal);
    setHoraInicio('');
  };

  const guardarRonda = async () => {
    if (!proceso) return;

    const rondaBase = {
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      numero: rondaNumero,
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: horaInicio || horaActual(),
      hora_fin: horaActual(),
      tiempo_usado: Math.floor((tiempoTotal - tiempoRestante) / 60),
      tipo: proceso,
    };

    try {
      const endpoint = proceso === 'guias' ? '/rondas/guias' : '/rondas/novedades';
      const body = proceso === 'guias'
        ? { ...rondaBase, ...valoresGuias, pedidos_iniciales: valoresGuias.pedidosIniciales }
        : { ...rondaBase, ...valoresNovedades };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        playSuccessSound();
        // Reset para siguiente ronda
        setRondaNumero(rondaNumero + 1);
        setValoresGuias({
          pedidosIniciales: 0,
          realizado: 0,
          cancelado: 0,
          agendado: 0,
          dificiles: 0,
          pendientes: 0,
          revisado: 0,
        });
        setValoresNovedades({
          revisadas: 0,
          solucionadas: 0,
          devolucion: 0,
          cliente: 0,
          transportadora: 0,
          litper: 0,
        });
        resetTimer();
        // Recargar rondas
        const fecha = new Date().toISOString().split('T')[0];
        const rondasResponse = await fetch(`${API_URL}/rondas?fecha=${fecha}&usuario_id=${usuarioId}`);
        if (rondasResponse.ok) {
          setRondasHoy(await rondasResponse.json());
        }
      }
    } catch (error) {
      console.error('Error guardando ronda:', error);
    }
  };

  const abrirEnVentana = () => {
    const width = 400;
    const height = 650;
    const left = window.screenX + window.outerWidth - width - 20;
    const top = window.screenY + 100;

    const popup = window.open(
      '',
      `tracker_${usuarioId}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (popup) {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>LITPER Tracker - ${usuarioNombre}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #1e293b;
              color: white;
              padding: 16px;
            }
            .header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 1px solid #334155;
            }
            .avatar {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: ${usuarioColor}30;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
            }
            .name { font-size: 18px; font-weight: 600; }
            .timer {
              text-align: center;
              font-size: 64px;
              font-weight: bold;
              font-family: monospace;
              margin: 20px 0;
              color: ${usuarioColor};
            }
            .info { text-align: center; color: #94a3b8; margin: 10px 0; }
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 500;
              transition: all 0.2s;
            }
            .btn-primary { background: #22c55e; color: white; }
            .btn-primary:hover { background: #16a34a; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="avatar">${usuarioAvatar}</div>
            <div class="name">${usuarioNombre}</div>
          </div>
          <div class="timer">${formatTime(tiempoRestante)}</div>
          <p class="info">Ronda #${rondaNumero} - ${proceso || 'Sin proceso'}</p>
          <p class="info" style="margin-top: 20px; font-size: 14px;">
            Esta ventana se puede mover y redimensionar.<br>
            La información se sincroniza con la aplicación principal.
          </p>
        </body>
        </html>
      `);
      popup.document.close();
    }
  };

  // Vista selección de proceso
  if (!proceso) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          style={{ borderTop: `4px solid ${usuarioColor}` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${usuarioColor}30` }}
              >
                {usuarioAvatar}
              </div>
              <span className="font-semibold text-white">{usuarioNombre}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Selección de proceso */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white text-center mb-6">
              ¿Qué proceso vas a realizar?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setProceso('guias')}
                className="p-6 bg-slate-700/50 hover:bg-emerald-500/20 border-2 border-slate-600 hover:border-emerald-500 rounded-xl transition-all group"
              >
                <Package className="w-12 h-12 mx-auto mb-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="block text-lg font-semibold text-white">Guías</span>
                <span className="text-sm text-slate-400">Proceso logístico</span>
              </button>
              <button
                onClick={() => setProceso('novedades')}
                className="p-6 bg-slate-700/50 hover:bg-amber-500/20 border-2 border-slate-600 hover:border-amber-500 rounded-xl transition-all group"
              >
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="block text-lg font-semibold text-white">Novedades</span>
                <span className="text-sm text-slate-400">Gestión de casos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista minimizada
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 bg-slate-800 rounded-xl shadow-2xl p-3 cursor-pointer hover:scale-105 transition-transform"
        style={{ borderLeft: `4px solid ${usuarioColor}` }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{usuarioAvatar}</span>
          <div>
            <p className="text-white font-mono text-lg">{formatTime(tiempoRestante)}</p>
            <p className="text-xs text-slate-400">Ronda #{rondaNumero}</p>
          </div>
          <Maximize2 className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    );
  }

  // Vista principal del tracker
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ borderTop: `4px solid ${usuarioColor}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${usuarioColor}30` }}
            >
              {usuarioAvatar}
            </div>
            <div>
              <span className="font-semibold text-white block">{usuarioNombre}</span>
              <span className="text-xs text-slate-400">
                {proceso === 'guias' ? 'Guías' : 'Novedades'} - Ronda #{rondaNumero}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={abrirEnVentana}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Abrir en ventana separada"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="p-6 text-center">
          <div
            className="text-6xl font-bold font-mono mb-4"
            style={{ color: tiempoRestante < 60 ? '#ef4444' : usuarioColor }}
          >
            {formatTime(tiempoRestante)}
          </div>

          {/* Time selector */}
          <div className="flex justify-center gap-2 mb-4">
            {[30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  if (estadoTimer === 'idle') {
                    setTiempoTotal(mins * 60);
                    setTiempoRestante(mins * 60);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tiempoTotal === mins * 60
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
                disabled={estadoTimer !== 'idle'}
              >
                {mins} min
              </button>
            ))}
            {/* Botón +5 min */}
            <button
              onClick={() => {
                setTiempoTotal((prev) => prev + 5 * 60);
                setTiempoRestante((prev) => prev + 5 * 60);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              title="Agregar 5 minutos"
            >
              <Plus className="w-4 h-4" />
              5 min
            </button>
          </div>

          {/* Timer controls */}
          <div className="flex justify-center gap-3">
            {estadoTimer === 'running' ? (
              <button
                onClick={pausarTimer}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors flex items-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Pausar
              </button>
            ) : (
              <button
                onClick={iniciarTimer}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                {estadoTimer === 'idle' ? 'Iniciar' : 'Continuar'}
              </button>
            )}
            {estadoTimer !== 'idle' && (
              <button
                onClick={resetTimer}
                className="px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Campos del proceso */}
        <div className="px-4 pb-4 space-y-2">
          {proceso === 'guias' ? (
            <>
              <CounterField label="Iniciales" icon={<Package />} value={valoresGuias.pedidosIniciales} onChange={(v) => setValoresGuias({...valoresGuias, pedidosIniciales: v})} color="#94a3b8" />
              <CounterField label="Realizado" icon={<CheckCircle />} value={valoresGuias.realizado} onChange={(v) => setValoresGuias({...valoresGuias, realizado: v})} color="#22c55e" />
              <CounterField label="Cancelado" icon={<XCircle />} value={valoresGuias.cancelado} onChange={(v) => setValoresGuias({...valoresGuias, cancelado: v})} color="#ef4444" />
              <CounterField label="Agendado" icon={<Calendar />} value={valoresGuias.agendado} onChange={(v) => setValoresGuias({...valoresGuias, agendado: v})} color="#3b82f6" />
              <CounterField label="Difíciles" icon={<AlertTriangle />} value={valoresGuias.dificiles} onChange={(v) => setValoresGuias({...valoresGuias, dificiles: v})} color="#f59e0b" />
              <CounterField label="Pendientes" icon={<Clock />} value={valoresGuias.pendientes} onChange={(v) => setValoresGuias({...valoresGuias, pendientes: v})} color="#8b5cf6" />
              <CounterField label="Revisado" icon={<FileText />} value={valoresGuias.revisado} onChange={(v) => setValoresGuias({...valoresGuias, revisado: v})} color="#06b6d4" />
            </>
          ) : (
            <>
              <CounterField label="Revisadas" icon={<FileText />} value={valoresNovedades.revisadas} onChange={(v) => setValoresNovedades({...valoresNovedades, revisadas: v})} color="#94a3b8" />
              <CounterField label="Solucionadas" icon={<CheckCircle />} value={valoresNovedades.solucionadas} onChange={(v) => setValoresNovedades({...valoresNovedades, solucionadas: v})} color="#22c55e" />
              <CounterField label="Devolución" icon={<Package />} value={valoresNovedades.devolucion} onChange={(v) => setValoresNovedades({...valoresNovedades, devolucion: v})} color="#ef4444" />
              <CounterField label="Cliente" icon={<Users />} value={valoresNovedades.cliente} onChange={(v) => setValoresNovedades({...valoresNovedades, cliente: v})} color="#3b82f6" />
              <CounterField label="Transportadora" icon={<Truck />} value={valoresNovedades.transportadora} onChange={(v) => setValoresNovedades({...valoresNovedades, transportadora: v})} color="#f59e0b" />
              <CounterField label="LITPER" icon={<AlertTriangle />} value={valoresNovedades.litper} onChange={(v) => setValoresNovedades({...valoresNovedades, litper: v})} color="#8b5cf6" />
            </>
          )}
        </div>

        {/* Guardar ronda */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={guardarRonda}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Guardar Ronda
          </button>
        </div>

        {/* Resumen del día */}
        {rondasHoy.length > 0 && (
          <div className="p-4 bg-slate-900/50 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-slate-400 mb-2">Resumen de hoy</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-800 p-2 rounded-lg">
                <span className="text-slate-400">Rondas:</span>
                <span className="text-white font-semibold ml-2">{rondasHoy.length}</span>
              </div>
              <div className="bg-slate-800 p-2 rounded-lg">
                <span className="text-slate-400">Realizados:</span>
                <span className="text-emerald-400 font-semibold ml-2">
                  {rondasHoy.reduce((acc, r) => acc + (r.realizado || r.solucionadas || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botón volver */}
        <div className="p-4">
          <button
            onClick={() => setProceso(null)}
            className="w-full py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
          >
            Cambiar proceso
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para los contadores
const CounterField: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  color: string;
}> = ({ label, icon, value, onChange, color }) => (
  <div className="flex items-center justify-between bg-slate-700/50 rounded-xl p-3">
    <div className="flex items-center gap-3">
      <div style={{ color }} className="w-5 h-5">{icon}</div>
      <span className="text-white font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center justify-center transition-colors"
      >
        <Minus className="w-4 h-4 text-white" />
      </button>
      <span className="w-10 text-center text-xl font-bold text-white">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center justify-center transition-colors"
      >
        <Plus className="w-4 h-4 text-white" />
      </button>
    </div>
  </div>
);

export default TrackerPopup;
