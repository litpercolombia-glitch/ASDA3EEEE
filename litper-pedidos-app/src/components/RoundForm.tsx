import React, { useState } from 'react';
import { Plus, Save, Package, CheckCircle } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

const RoundForm: React.FC = () => {
  const { usuarioActual, rondaActual, timerState, guardarRonda, getTotalHoy, resetearTimer } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  if (!usuarioActual) return null;

  const totalHoy = getTotalHoy(usuarioActual.id);
  const progreso = (totalHoy / usuarioActual.metaDiaria) * 100;
  const metaCumplida = progreso >= 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    guardarRonda();
    setShowForm(false);
    resetearTimer();
  };

  const shouldShowPrompt = timerState === 'finished' && !showForm;

  return (
    <div className="px-4 pb-4">
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

      {!showForm && !shouldShowPrompt && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-dark-300 hover:text-white hover:border-primary-500/50 transition-all no-drag"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Registrar ronda #{rondaActual}</span>
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-fade-in">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-400" />
            Ronda #{rondaActual}
          </h4>
          <p className="text-xs text-dark-400">Los contadores actuales se guardarán automáticamente.</p>
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
