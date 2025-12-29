import React, { useState } from 'react';
import { Plus, Save, Package, CheckCircle } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

const RoundForm: React.FC = () => {
  const { usuarioActual, rondaActual, configTimer, timerState, registrarRonda, getTotalHoy, resetearTimer } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    realizados: 0,
    cancelados: 0,
    agendados: 0,
    dificiles: 0,
    pendientes: 0,
    revisados: 0,
  });

  if (!usuarioActual) return null;

  const totalHoy = getTotalHoy(usuarioActual.id);
  const progreso = (totalHoy / usuarioActual.metaDiaria) * 100;
  const metaCumplida = progreso >= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    registrarRonda({
      usuarioId: usuarioActual.id,
      numero: rondaActual,
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      horaFin: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      tiempoUsado: configTimer.duracionMinutos * 60,
      ...formData,
    });

    setFormData({
      realizados: 0,
      cancelados: 0,
      agendados: 0,
      dificiles: 0,
      pendientes: 0,
      revisados: 0,
    });

    setShowForm(false);
    resetearTimer();
  };

  // Mostrar automáticamente cuando termina el timer
  const shouldShowPrompt = timerState === 'finished' && !showForm;

  return (
    <div className="px-4 pb-4">
      {/* Progress bar */}
      <div className="card mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-dark-400">Progreso del día</span>
          <span className="text-sm font-semibold text-white">
            {totalHoy} / {usuarioActual.metaDiaria}
          </span>
        </div>
        <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              metaCumplida ? 'bg-accent-green' : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(100, progreso)}%` }}
          />
        </div>
        {metaCumplida && (
          <div className="flex items-center gap-1 mt-2 text-accent-green text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Meta cumplida!</span>
          </div>
        )}
      </div>

      {/* Prompt when timer finishes */}
      {shouldShowPrompt && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-4 bg-primary-500/20 border border-primary-500/50 rounded-xl text-primary-400 text-center hover:bg-primary-500/30 transition-all animate-pulse no-drag mb-3"
        >
          <Package className="w-6 h-6 mx-auto mb-1" />
          <p className="text-sm font-medium">Tiempo terminado!</p>
          <p className="text-xs opacity-80">Clic para registrar ronda #{rondaActual}</p>
        </button>
      )}

      {/* Add button */}
      {!showForm && !shouldShowPrompt && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-dark-300 hover:text-white hover:border-primary-500/50 transition-all no-drag"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Registrar ronda #{rondaActual}</span>
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-fade-in">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-400" />
            Ronda #{rondaActual}
          </h4>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-dark-400 mb-1 text-center">Realizados</label>
              <input
                type="number"
                value={formData.realizados}
                onChange={(e) => setFormData({ ...formData, realizados: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-2 bg-accent-green/10 border border-accent-green/30 rounded-lg text-accent-green text-center text-lg font-bold no-drag"
                min="0"
              />
            </div>
            <div>
              <label className="block text-[10px] text-dark-400 mb-1 text-center">Cancelados</label>
              <input
                type="number"
                value={formData.cancelados}
                onChange={(e) => setFormData({ ...formData, cancelados: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-2 bg-accent-red/10 border border-accent-red/30 rounded-lg text-accent-red text-center text-lg font-bold no-drag"
                min="0"
              />
            </div>
            <div>
              <label className="block text-[10px] text-dark-400 mb-1 text-center">Agendados</label>
              <input
                type="number"
                value={formData.agendados}
                onChange={(e) => setFormData({ ...formData, agendados: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-2 bg-accent-blue/10 border border-accent-blue/30 rounded-lg text-accent-blue text-center text-lg font-bold no-drag"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 bg-dark-700 text-dark-300 rounded-lg text-sm hover:bg-dark-600 transition-colors no-drag"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-1 no-drag"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RoundForm;
