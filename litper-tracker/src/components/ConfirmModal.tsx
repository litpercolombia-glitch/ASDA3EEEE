import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTrackerStore } from '../stores/trackerStore';

const ConfirmModal: React.FC = () => {
  const { modalVisible, hideModal, confirmModal } = useTrackerStore();

  if (!modalVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={hideModal}
      />

      {/* Modal */}
      <div className="relative bg-dark-800 border border-dark-600 rounded-xl p-5 w-[90%] max-w-sm shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={hideModal}
          className="absolute top-3 right-3 p-1 hover:bg-dark-700 rounded transition-colors text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white text-center mb-2">
          Iniciar nuevo día?
        </h3>

        {/* Message */}
        <p className="text-slate-400 text-sm text-center mb-6">
          Se exportará el Excel del día actual y se reiniciarán todos los contadores para empezar un día nuevo.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={hideModal}
            className="flex-1 py-2.5 px-4 bg-dark-600 hover:bg-dark-500 text-slate-300 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmModal}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
