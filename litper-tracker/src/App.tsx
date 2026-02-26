import React, { useEffect } from 'react';
import { useTrackerStore, Usuario } from './stores/trackerStore';
import TitleBar from './components/TitleBar';
import Timer from './components/Timer';
import Stopwatch from './components/Stopwatch';
import QuickCounter from './components/QuickCounter';
import ProgressBar from './components/ProgressBar';
import MiniMode from './components/MiniMode';
import SuperMiniMode from './components/SuperMiniMode';
import BarMode from './components/BarMode';
import ConfigPanel from './components/ConfigPanel';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import StatsPanel from './components/StatsPanel';
import Celebrations from './components/Celebrations';
import HistoryPanel from './components/HistoryPanel';
import DailySummary from './components/DailySummary';
import GoalsIndicator from './components/GoalsIndicator';
import TemplatesPanel from './components/TemplatesPanel';
import { LogOut, ArrowLeft, FileText, AlertTriangle, User, Download, Settings, RefreshCw, RotateCcw, CheckCircle, Eye, ArrowLeftRight } from 'lucide-react';

const App: React.FC = () => {
  const { modo, pantalla, cargarDatos, tick, estadoTimer, tickStopwatch, estadoStopwatch, setModo, toggleDailySummary, toggleGoals, toggleHistory, exportarExcel, realizarBackup } = useTrackerStore();

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();

    // Registrar listeners para acciones desde el tray
    if (window.electronAPI) {
      window.electronAPI.onSetMode?.((mode: string) => {
        setModo(mode as any);
      });
      window.electronAPI.onShowDailySummary?.(() => {
        toggleDailySummary();
      });
      window.electronAPI.onShowGoals?.(() => {
        toggleGoals();
      });
      window.electronAPI.onShowHistory?.(() => {
        toggleHistory();
      });
      window.electronAPI.onExportData?.(() => {
        exportarExcel();
      });
      window.electronAPI.onDoBackup?.(() => {
        realizarBackup();
      });
    }
  }, [cargarDatos]);

  // Timer tick (countdown)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (estadoTimer === 'running') {
      interval = setInterval(tick, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estadoTimer, tick]);

  // Stopwatch tick (count up)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (estadoStopwatch === 'running') {
      interval = setInterval(tickStopwatch, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estadoStopwatch, tickStopwatch]);

  // Renderizar segun modo
  if (modo === 'barra') {
    return (
      <div className="h-full w-full bg-dark-900 overflow-hidden">
        <BarMode />
      </div>
    );
  }

  if (modo === 'micro') {
    return (
      <div className="h-full w-full bg-dark-900 overflow-hidden">
        <SuperMiniMode />
      </div>
    );
  }

  if (modo === 'mini') {
    return (
      <div className="h-full w-full flex flex-col bg-dark-800 overflow-hidden">
        <MiniMode />
      </div>
    );
  }

  // Modo normal o compacto - verificar pantalla
  const renderPantalla = () => {
    switch (pantalla) {
      case 'seleccion-usuario':
        return <SeleccionUsuario />;
      case 'seleccion-proceso':
        return <SeleccionProceso />;
      case 'trabajo':
        return <PantallaTrabajo />;
      default:
        return <SeleccionUsuario />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-dark-800">
      {renderPantalla()}
      <ConfigPanel />
      <StatsPanel />
      <HistoryPanel />
      <DailySummary />
      <GoalsIndicator />
      <TemplatesPanel />
      <Toast />
      <ConfirmModal />
      <Celebrations />
    </div>
  );
};

// ============================================
// PANTALLA: Selección de Usuario
// ============================================
const SeleccionUsuario: React.FC = () => {
  const { usuarios, seleccionarUsuario, sincronizarUsuarios, toggleConfig, apiUrl } = useTrackerStore();
  const [sincronizando, setSincronizando] = React.useState(false);

  useEffect(() => {
    // Sincronizar usuarios al cargar
    const sync = async () => {
      await sincronizarUsuarios();
    };
    sync();
  }, [sincronizarUsuarios]);

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const handleSync = async () => {
    setSincronizando(true);
    await sincronizarUsuarios();
    setSincronizando(false);
  };

  // Verificar conexión con API
  const apiConectada = apiUrl && apiUrl !== '';

  return (
    <div className="h-full flex-1 bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
      {/* Title bar con configuración */}
      <div className="drag-region bg-dark-900 px-3 py-2 flex items-center justify-between border-b border-dark-600">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">LITPER</span>
          <span className="text-slate-500 text-xs">Tracker</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          {/* Botón sincronizar */}
          <button
            onClick={handleSync}
            disabled={sincronizando}
            className={`p-1.5 rounded transition-colors ${
              sincronizando ? 'text-amber-400 animate-spin' : 'text-slate-400 hover:text-white hover:bg-dark-700'
            }`}
            title="Sincronizar usuarios"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {/* Botón configuración */}
          <button
            onClick={toggleConfig}
            className="p-1.5 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-purple-400"
            title="Configuración"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          {/* Cerrar */}
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
      </div>

      {/* Indicador de conexión */}
      <div className="px-4 py-2 bg-dark-900/50 border-b border-dark-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-3 h-3 text-slate-500" />
          <span className="text-slate-500">Conexión</span>
        </div>
        <span className={apiConectada ? 'text-emerald-400' : 'text-slate-500'}>
          {apiConectada ? 'API conectada' : 'Sin conexión'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-bold text-white text-center mb-4">
          ¿Quién eres?
        </h2>

        {usuarios.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay usuarios disponibles</p>
            <p className="text-xs mt-1">Crea usuarios en Procesos 2.0</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {usuarios.map((usuario) => (
              <UsuarioCard
                key={usuario.id}
                usuario={usuario}
                onClick={() => seleccionarUsuario(usuario)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface UsuarioCardProps {
  usuario: Usuario;
  onClick: () => void;
}

const UsuarioCard: React.FC<UsuarioCardProps> = ({ usuario, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-all hover:scale-105 border border-dark-600 hover:border-amber-500/50"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2"
        style={{ backgroundColor: usuario.color + '30' }}
      >
        {usuario.avatar}
      </div>
      <span className="text-sm text-white font-medium truncate w-full text-center">
        {usuario.nombre}
      </span>
    </button>
  );
};

// ============================================
// PANTALLA: Selección de Proceso
// ============================================
const SeleccionProceso: React.FC = () => {
  const { usuarioActual, seleccionarProceso, cerrarSesion, rondasHoy, showModal, reiniciarDia } = useTrackerStore();

  const handleClose = () => {
    window.electronAPI?.close();
  };

  // Contar rondas del usuario actual
  const rondasGuias = rondasHoy.filter(
    r => r.tipo === 'guias' && r.usuarioId === usuarioActual?.id
  ).length;
  const rondasNovedades = rondasHoy.filter(
    r => r.tipo === 'novedades' && r.usuarioId === usuarioActual?.id
  ).length;

  return (
    <div className="h-full flex-1 bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
      {/* Title bar */}
      <div className="drag-region bg-dark-900 px-3 py-2 flex items-center justify-between border-b border-dark-600">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">LITPER</span>
          <span className="text-slate-500 text-xs">Tracker</span>
        </div>
        <button
          onClick={handleClose}
          className="no-drag p-1.5 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400"
        >
          <span className="text-lg">×</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Usuario actual */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: (usuarioActual?.color || '#666') + '30' }}
            >
              {usuarioActual?.avatar}
            </div>
            <span className="text-white font-medium">{usuarioActual?.nombre}</span>
          </div>
          <button
            onClick={cerrarSesion}
            className="p-2 hover:bg-dark-700 rounded text-slate-400 hover:text-red-400 transition-colors"
            title="Cambiar usuario"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-white text-center mb-4">
          ¿Qué vas a trabajar?
        </h2>

        {/* Botones de acciones */}
        <div className="flex gap-2 mb-4">
          {/* Botón exportar datos */}
          <button
            onClick={() => useTrackerStore.getState().exportarExcel()}
            className="flex-1 p-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Exportar</span>
          </button>

          {/* Botón nuevo día */}
          <button
            onClick={() => showModal(reiniciarDia)}
            className="flex-1 p-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-lg transition-all flex items-center justify-center gap-2 text-amber-400 hover:text-amber-300"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Nuevo Día</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Botón GUÍAS */}
          <button
            onClick={() => seleccionarProceso('guias')}
            className="w-full p-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold">Generación de Guías</h3>
              <p className="text-emerald-400 text-sm">
                {rondasGuias > 0 ? `${rondasGuias} ronda${rondasGuias > 1 ? 's' : ''} hoy` : 'Sin rondas hoy'}
              </p>
            </div>
          </button>

          {/* Botón NOVEDADES */}
          <button
            onClick={() => seleccionarProceso('novedades')}
            className="w-full p-4 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-500/50 rounded-xl transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold">Novedades</h3>
              <p className="text-orange-400 text-sm">
                {rondasNovedades > 0 ? `${rondasNovedades} ronda${rondasNovedades > 1 ? 's' : ''} hoy` : 'Sin rondas hoy'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PANTALLA: Trabajo (Guías o Novedades)
// ============================================
const PantallaTrabajo: React.FC = () => {
  const { procesoActual } = useTrackerStore();

  if (procesoActual === 'guias') {
    return <ModoGuias />;
  }
  return <ModoNovedades />;
};

// ============================================
// MODO GUÍAS
// ============================================
const ModoGuias: React.FC = () => {
  const {
    valoresGuias,
    incrementarGuias,
    decrementarGuias,
    setValorGuias,
    guardarRonda,
    rondaNumero,
    totalHoyGuias,
    usuarioActual,
    estadoTimer,
    volverASeleccion,
  } = useTrackerStore();

  const campos: Array<{
    key: keyof typeof valoresGuias;
    label: string;
    icon: string;
    color: string;
  }> = [
    { key: 'pedidosIniciales', label: 'Iniciales', icon: '📋', color: 'slate' },
    { key: 'realizado', label: 'Realizado', icon: '✅', color: 'emerald' },
    { key: 'cancelado', label: 'Cancelado', icon: '❌', color: 'red' },
    { key: 'agendado', label: 'Agendado', icon: '📅', color: 'blue' },
    { key: 'dificiles', label: 'Difíciles', icon: '⚠️', color: 'orange' },
    { key: 'pendientes', label: 'Pendientes', icon: '⏳', color: 'yellow' },
    { key: 'revisado', label: 'Revisado', icon: '👁️', color: 'purple' },
  ];

  const metaDiaria = usuarioActual?.metaDiaria || 100;

  return (
    <div className="h-full flex-1 bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
      <TitleBar />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Indicador de modo */}
        <div className="flex items-center justify-between">
          <button
            onClick={volverASeleccion}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">
              GUÍAS
            </span>
          </div>
        </div>

        {/* Timer */}
        <Timer />

        {/* Numero de ronda */}
        <div className="text-center text-sm text-slate-400">
          Ronda #{rondaNumero} • {usuarioActual?.nombre}
        </div>

        {/* Contadores */}
        <div className="space-y-1">
          {campos.map((campo) => (
            <QuickCounter
              key={campo.key}
              label={campo.label}
              icon={campo.icon}
              value={valoresGuias[campo.key]}
              color={campo.color}
              onIncrement={(amount) => incrementarGuias(campo.key, amount)}
              onDecrement={(amount) => decrementarGuias(campo.key, amount)}
              onChange={(value) => setValorGuias(campo.key, value)}
            />
          ))}
        </div>

        {/* Boton Guardar */}
        <button
          onClick={guardarRonda}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            estadoTimer === 'finished'
              ? 'bg-amber-500 hover:bg-amber-600 animate-pulse-red'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          💾 GUARDAR RONDA
        </button>

        {/* Progreso del dia */}
        <ProgressBar current={totalHoyGuias} target={metaDiaria} />
      </div>
    </div>
  );
};

// ============================================
// MODO NOVEDADES
// ============================================
const ModoNovedades: React.FC = () => {
  const {
    valoresNovedades,
    incrementarNovedades,
    decrementarNovedades,
    setValorNovedades,
    guardarRonda,
    rondaNumero,
    totalHoyNovedades,
    usuarioActual,
    estadoStopwatch,
    volverASeleccion,
  } = useTrackerStore();

  // Campos actualizados con nuevos nombres
  const campos: Array<{
    key: keyof typeof valoresNovedades;
    label: string;
    icon: string;
    color: string;
    editable?: boolean;
  }> = [
    { key: 'totalNovedades', label: 'Total novedades', icon: '📊', color: 'cyan', editable: true },
    { key: 'revisadas', label: 'Revisadas', icon: '👁️', color: 'slate' },
    { key: 'solucionadas', label: 'Solucionadas', icon: '✅', color: 'emerald' },
    { key: 'errorPorSolucion', label: 'Error por solución', icon: '🔄', color: 'red' },
    { key: 'proveedor', label: 'Proveedor', icon: '🏭', color: 'indigo' },
    { key: 'cliente', label: 'Cliente', icon: '👤', color: 'blue' },
    { key: 'transportadora', label: 'Transportadora', icon: '🚚', color: 'purple' },
    { key: 'litper', label: 'LITPER', icon: '🏢', color: 'orange' },
  ];

  return (
    <div className="h-full flex-1 bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
      <TitleBar />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Indicador de modo */}
        <div className="flex items-center justify-between">
          <button
            onClick={volverASeleccion}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded">
              NOVEDADES
            </span>
          </div>
        </div>

        {/* Stopwatch - Cronómetro ascendente */}
        <Stopwatch />

        {/* Numero de ronda */}
        <div className="text-center text-sm text-slate-400">
          Ronda #{rondaNumero} • {usuarioActual?.nombre}
        </div>

        {/* Contadores */}
        <div className="space-y-1">
          {campos.map((campo) => (
            <QuickCounter
              key={campo.key}
              label={campo.label}
              icon={campo.icon}
              value={valoresNovedades[campo.key]}
              color={campo.color}
              onIncrement={(amount) => incrementarNovedades(campo.key, amount)}
              onDecrement={(amount) => decrementarNovedades(campo.key, amount)}
              onChange={(value) => setValorNovedades(campo.key, value)}
            />
          ))}
        </div>

        {/* Boton Guardar */}
        <button
          onClick={guardarRonda}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            estadoStopwatch === 'paused'
              ? 'bg-amber-500 hover:bg-amber-600 animate-pulse'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          💾 GUARDAR RONDA
        </button>

        {/* Mini Dashboard - Resumen en tiempo real */}
        <div className="bg-dark-700 rounded-lg p-3">
          <h4 className="text-xs text-slate-500 mb-2 text-center">Resumen en tiempo real</h4>
          <div className="grid grid-cols-3 gap-2">
            {/* Solucionadas */}
            <div className="flex flex-col items-center gap-1 bg-emerald-500/10 rounded-lg p-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-bold text-white">{valoresNovedades.solucionadas}</span>
              <span className="text-[10px] text-slate-500">Solucionadas</span>
            </div>

            {/* Revisadas */}
            <div className="flex flex-col items-center gap-1 bg-slate-500/10 rounded-lg p-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-lg font-bold text-white">{valoresNovedades.revisadas}</span>
              <span className="text-[10px] text-slate-500">Revisadas</span>
            </div>

            {/* Error por solución */}
            <div className="flex flex-col items-center gap-1 bg-red-500/10 rounded-lg p-2">
              <ArrowLeftRight className="w-4 h-4 text-red-400" />
              <span className="text-lg font-bold text-white">{valoresNovedades.errorPorSolucion}</span>
              <span className="text-[10px] text-slate-500">Errores</span>
            </div>
          </div>
        </div>

        {/* Progreso del dia - Novedades solucionadas */}
        <div className="bg-dark-700 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Hoy</span>
            <span className="text-xs font-medium text-white">
              ✅ {totalHoyNovedades} solucionadas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
