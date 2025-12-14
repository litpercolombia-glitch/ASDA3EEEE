// components/pwa/InstallPrompt.tsx
// PWA Install Prompt and Update Banner
import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
  CheckCircle,
  Crown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { canInstall, promptInstall, isOnline, isRunningAsPWA } from '../../utils/pwa';

// ============================================
// INSTALL PROMPT COMPONENT
// ============================================
export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        setDismissed(true);
        return;
      }
    }

    // Check if already installed
    if (isRunningAsPWA()) {
      return;
    }

    // Listen for install availability
    const handleInstallAvailable = () => {
      setInstallAvailable(true);
      setShowPrompt(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);

    // Check if already available
    if (canInstall()) {
      setInstallAvailable(true);
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || dismissed || !installAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-corporate-900 rounded-2xl shadow-2xl border border-navy-700 overflow-hidden">
        {/* Header */}
        <div className="relative p-4 pb-0">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-3 rounded-xl shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-navy-900 flex items-center justify-center">
                <Download className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold">Instalar LITPER PRO</h3>
              <p className="text-slate-400 text-sm">Acceso rápido desde tu dispositivo</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Zap, label: 'Más rápido' },
              { icon: WifiOff, label: 'Modo offline' },
              { icon: Sparkles, label: 'Notificaciones' },
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 p-2 bg-white/5 rounded-xl"
              >
                <benefit.icon className="w-4 h-4 text-accent-400" />
                <span className="text-xs text-slate-300">{benefit.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            Ahora no
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 text-sm font-bold bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-500/30"
          >
            <Download className="w-4 h-4" />
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// UPDATE BANNER COMPONENT
// ============================================
export const UpdateBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShowBanner(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    // Reload to activate new service worker
    window.location.reload();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 shadow-lg animate-slide-down">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="font-semibold">Nueva versión disponible</p>
            <p className="text-sm text-emerald-100">Actualiza para obtener las últimas mejoras</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBanner(false)}
            className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors"
          >
            Más tarde
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="px-4 py-2 text-sm font-bold bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2"
          >
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Actualizar ahora
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// OFFLINE INDICATOR COMPONENT
// ============================================
export const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(isOnline());
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Show briefly to confirm reconnection
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pwa-online', handleOnline);
    window.addEventListener('pwa-offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-online', handleOnline);
      window.removeEventListener('pwa-offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all animate-slide-up ${
        online
          ? 'bg-emerald-500 text-white'
          : 'bg-slate-800 text-white border border-slate-700'
      }`}
    >
      {online ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Conexión restaurada</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Sin conexión - Modo offline</span>
        </>
      )}
    </div>
  );
};

// ============================================
// PWA PROVIDER COMPONENT
// ============================================
export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Register service worker
    import('../../utils/pwa').then(({ registerServiceWorker, initInstallPrompt, initOnlineStatus }) => {
      registerServiceWorker();
      initInstallPrompt();
      initOnlineStatus();
    });
  }, []);

  return (
    <>
      {children}
      <InstallPrompt />
      <UpdateBanner />
      <OfflineIndicator />
    </>
  );
};

export default InstallPrompt;
