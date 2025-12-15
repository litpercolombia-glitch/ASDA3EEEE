/**
 * ROUND FORM COMPONENT
 * Formulario para registrar rondas de guías
 */

import React, { useState } from 'react';
import { Plus, Save, X, ClipboardList } from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';
import Modal from '../../../shared/modals/Modal';

interface RoundFormProps {
  className?: string;
}

const RoundForm: React.FC<RoundFormProps> = ({ className = '' }) => {
  const { usuarioActual, rondas, agregarRonda, getRondasUsuario } = useProcesosStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pedidosIniciales: 0,
    realizado: 0,
    cancelado: 0,
    agendado: 0,
    dificiles: 0,
    pendientes: 0,
    revisado: 0,
  });

  if (!usuarioActual) return null;

  const rondasHoy = getRondasUsuario(usuarioActual.id).filter(
    (r) => r.fecha === new Date().toISOString().split('T')[0]
  );

  const siguienteNumeroRonda = rondasHoy.length + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    agregarRonda({
      numero: siguienteNumeroRonda,
      usuarioId: usuarioActual.id,
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      tiempoTotal: 25, // Default timer duration
      ...formData,
    });

    setFormData({
      pedidosIniciales: 0,
      realizado: 0,
      cancelado: 0,
      agendado: 0,
      dificiles: 0,
      pendientes: 0,
      revisado: 0,
    });

    setShowModal(false);
  };

  const totalGuiasHoy = rondasHoy.reduce((acc, r) => acc + r.realizado, 0);
  const progreso = usuarioActual.metaDiaria > 0
    ? Math.min(100, (totalGuiasHoy / usuarioActual.metaDiaria) * 100)
    : 0;

  return (
    <div className={className}>
      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progreso del dia</span>
          <span className="text-sm font-medium text-white">
            {totalGuiasHoy} / {usuarioActual.metaDiaria}
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progreso >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : progreso >= 75
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-blue-500 to-blue-400'
            }`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        {progreso >= 100 && (
          <p className="text-emerald-400 text-xs mt-1 text-center">Meta cumplida!</p>
        )}
      </div>

      {/* Today's Rounds */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-amber-400" />
            Rondas de hoy
          </h4>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva ronda
          </button>
        </div>

        {rondasHoy.length > 0 ? (
          <div className="space-y-2">
            {rondasHoy.map((ronda) => (
              <div
                key={ronda.id}
                className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold">
                    {ronda.numero}
                  </div>
                  <div>
                    <p className="text-white text-sm">
                      {ronda.realizado} guias realizadas
                    </p>
                    <p className="text-xs text-slate-400">{ronda.horaInicio}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-2 text-xs">
                    {ronda.cancelado > 0 && (
                      <span className="text-red-400">{ronda.cancelado} cancel</span>
                    )}
                    {ronda.agendado > 0 && (
                      <span className="text-blue-400">{ronda.agendado} agend</span>
                    )}
                    {ronda.dificiles > 0 && (
                      <span className="text-orange-400">{ronda.dificiles} dific</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay rondas registradas hoy</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Ronda #${siguienteNumeroRonda}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Pedidos iniciales</label>
              <input
                type="number"
                value={formData.pedidosIniciales}
                onChange={(e) =>
                  setFormData({ ...formData, pedidosIniciales: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Realizadas</label>
              <input
                type="number"
                value={formData.realizado}
                onChange={(e) =>
                  setFormData({ ...formData, realizado: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Canceladas</label>
              <input
                type="number"
                value={formData.cancelado}
                onChange={(e) =>
                  setFormData({ ...formData, cancelado: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Agendadas</label>
              <input
                type="number"
                value={formData.agendado}
                onChange={(e) =>
                  setFormData({ ...formData, agendado: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Dificiles</label>
              <input
                type="number"
                value={formData.dificiles}
                onChange={(e) =>
                  setFormData({ ...formData, dificiles: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Pendientes</label>
              <input
                type="number"
                value={formData.pendientes}
                onChange={(e) =>
                  setFormData({ ...formData, pendientes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Revisadas</label>
            <input
              type="number"
              value={formData.revisado}
              onChange={(e) =>
                setFormData({ ...formData, revisado: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoundForm;
