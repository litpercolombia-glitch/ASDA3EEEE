/**
 * CONFIRM MODAL COMPONENT
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar accion',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
  isLoading = false,
}) => {
  const variantConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      buttonColor: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      buttonColor: 'bg-amber-500 hover:bg-amber-600',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      buttonColor: 'bg-emerald-500 hover:bg-emerald-600',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${config.iconBg} flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${config.buttonColor}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
