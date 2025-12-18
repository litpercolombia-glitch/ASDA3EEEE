import React, { useEffect, useState } from 'react';
import { useTrackerStore, Usuario, verifyConnectionPassword } from './stores/trackerStore';
import TitleBar from './components/TitleBar';
import Timer from './components/Timer';
import QuickCounter from './components/QuickCounter';
import ProgressBar from './components/ProgressBar';
import MiniMode from './components/MiniMode';
import SuperMiniMode from './components/SuperMiniMode';
import { LogOut, ArrowLeft, FileText, AlertTriangle, User, Download, Wifi, WifiOff, RefreshCw, Settings, Lock, Check, X } from 'lucide-react';

// ============================================
// Componente: Indicador de Conexión
// ============================================
const ConnectionIndicator: React.FC = () => {
  const { isOnline, syncStatus, lastSync, sincronizarUsuarios } = useTrackerStore();

  const handleRefresh = async () => {
    await sincronizarUsuarios();
  };

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-dark-700 rounded-lg mb-3">
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">Conectado al servidor</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Modo offline</span>
        </>
      )}
      {syncStatus === 'syncing' && (
        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
      )}
      <button
        onClick={handleRefresh}
        className="ml-auto p-1 hover:bg-dark-600 rounded transition-colors"
        title="Sincronizar"
      >
        <RefreshCw className={`w-3 h-3 text-slate-400 hover:text-white ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

// ============================================
// Componente: Configuración de Conexión
// ============================================
const ConnectionConfig: React.FC = () => {
  const { apiUrl, connectionConfigured, setApiUrl, testConnection, isOnline } = useTrackerStore();
  const [showConfig, setShowConfig] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [newUrl, setNewUrl] = useState(apiUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');

  const handleOpenConfig = () => {
    if (connectionConfigured) {
      // Si ya está configurado, pedir contraseña
      setShowPasswordModal(true);
      setPassword('');
      setPasswordError(false);
    } else {
      // Primera vez, pedir contraseña también
      setShowPasswordModal(true);
      setPassword('');
      setPasswordError(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (verifyConnectionPassword(password)) {
      setShowPasswordModal(false);
      setShowConfig(true);
      setNewUrl(apiUrl);
      setTestResult('none');
    } else {
      setPasswordError(true);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult('none');
    const result = await testConnection(newUrl);
    setTestResult(result ? 'success' : 'error');
    setTesting(false);
  };

  const handleSaveConnection = () => {
    setApiUrl(newUrl);
    setShowConfig(false);
  };

  return (
    <>
      {/* Botón para abrir configuración */}
      <button
        onClick={handleOpenConfig}
        className="w-full mb-3 p-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-amber-500/50 rounded-lg transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-white">Conexión</span>
        </div>
        <div className="flex items-center gap-2">
          {connectionConfigured && (
            <Lock className="w-3 h-3 text-slate-500" />
          )}
          {isOnline ? (
            <span className="text-xs text-emerald-400">Conectado</span>
          ) : (
            <span className="text-xs text-slate-400">Sin conexión</span>
          )}
        </div>
      </button>

      {/* Modal de Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl p-4 w-80 border border-dark-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Contraseña requerida
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-400 text-xs mb-3">
              Ingresa la contraseña para configurar la conexión
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Contraseña..."
              className={`w-full p-2 bg-dark-700 border rounded text-white text-sm mb-3 ${
                passwordError ? 'border-red-500' : 'border-dark-600'
              }`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-xs mb-3">Contraseña incorrecta</p>
            )}
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 rounded text-white font-bold text-sm"
            >
              Ingresar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Configuración */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl p-4 w-80 border border-dark-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Configurar Conexión
              </h3>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-slate-400 text-xs mb-1 block">URL del Servidor</label>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                setTestResult('none');
              }}
              placeholder="https://tu-servidor.glitch.me/api/tracker"
              className="w-full p-2 bg-dark-700 border border-dark-600 rounded text-white text-sm mb-3"
            />

            {/* Botón probar conexión */}
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm mb-3 flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  Probar Conexión
                </>
              )}
            </button>

            {/* Resultado del test */}
            {testResult === 'success' && (
              <div className="flex items-center gap-2 p-2 bg-emerald-500/20 rounded mb-3">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm">Conexión exitosa</span>
              </div>
            )}
            {testResult === 'error' && (
              <div className="flex items-center gap-2 p-2 bg-red-500/20 rounded mb-3">
                <X className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">No se pudo conectar</span>
              </div>
            )}

            {/* Botón guardar */}
            <button
              onClick={handleSaveConnection}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 rounded text-white font-bold text-sm"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  const { modo, pantalla, cargarDatos, tick, estadoTimer } = useTrackerStore();

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (estadoTimer === 'running') {
      interval = setInterval(tick, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estadoTimer, tick]);

  // Renderizar segun modo
  if (modo === 'super-mini') {
    return <SuperMiniMode />;
  }

  if (modo === 'mini') {
    return <MiniMode />;
  }

  // Modo normal - verificar pantalla
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

// ============================================
// PANTALLA: Selección de Usuario
// ============================================
const SeleccionUsuario: React.FC = () => {
  const { usuarios, seleccionarUsuario, sincronizarUsuarios } = useTrackerStore();

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

  return (
    <div className="h-full bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
      {/* Title bar simple */}
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
        {/* Configuración de conexión */}
        <ConnectionConfig />

        {/* Indicador de conexión */}
        <ConnectionIndicator />

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
  const { usuarioActual, seleccionarProceso, cerrarSesion, rondasHoy } = useTrackerStore();

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
    <div className="h-full bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
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

        {/* Botón exportar datos */}
        <button
          onClick={() => useTrackerStore.getState().exportarExcel()}
          className="w-full mb-4 p-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Exportar mis datos (Excel)</span>
        </button>

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
    <div className="h-full bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
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
    estadoTimer,
    volverASeleccion,
  } = useTrackerStore();

  const campos: Array<{
    key: keyof typeof valoresNovedades;
    label: string;
    icon: string;
    color: string;
  }> = [
    { key: 'revisadas', label: 'Revisadas', icon: '👁️', color: 'slate' },
    { key: 'solucionadas', label: 'Solucionadas', icon: '✅', color: 'emerald' },
    { key: 'devolucion', label: 'Devolución', icon: '↩️', color: 'red' },
    { key: 'cliente', label: 'Cliente', icon: '👤', color: 'blue' },
    { key: 'transportadora', label: 'Transportadora', icon: '🚚', color: 'purple' },
    { key: 'litper', label: 'LITPER', icon: '🏢', color: 'orange' },
  ];

  return (
    <div className="h-full bg-dark-800 rounded-xl overflow-hidden flex flex-col border border-dark-600">
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
            estadoTimer === 'finished'
              ? 'bg-amber-500 hover:bg-amber-600 animate-pulse-red'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          💾 GUARDAR RONDA
        </button>

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
