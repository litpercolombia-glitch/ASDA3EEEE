import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Trash2,
  Database,
  Shield,
  Info,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface ConfigOption {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'action';
  value?: boolean;
  options?: string[];
  icon: React.ReactNode;
}

export const ConfigTab: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [useKnowledge, setUseKnowledge] = useState(true);

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Estas seguro de que quieres borrar el historial de conversaciones?')) {
      // Limpiar historial local
      localStorage.removeItem('assistant_history');
      alert('Historial borrado');
    }
  };

  const configSections = [
    {
      title: 'Asistente',
      items: [
        {
          id: 'useKnowledge',
          label: 'Usar base de conocimiento',
          description: 'El asistente buscara en la base de conocimiento para responder',
          icon: <Database className="w-5 h-5" />,
          value: useKnowledge,
          onChange: () => setUseKnowledge(!useKnowledge),
        },
        {
          id: 'notifications',
          label: 'Notificaciones',
          description: 'Recibir alertas del asistente',
          icon: <Bell className="w-5 h-5" />,
          value: notifications,
          onChange: () => setNotifications(!notifications),
        },
        {
          id: 'sound',
          label: 'Sonido',
          description: 'Reproducir sonido en nuevos mensajes',
          icon: sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />,
          value: sound,
          onChange: () => setSound(!sound),
        },
      ],
    },
    {
      title: 'Apariencia',
      items: [
        {
          id: 'darkMode',
          label: 'Modo oscuro',
          description: 'Cambiar tema de la aplicacion',
          icon: darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
          value: darkMode,
          onChange: handleDarkModeToggle,
        },
      ],
    },
    {
      title: 'Datos',
      items: [
        {
          id: 'clearHistory',
          label: 'Borrar historial',
          description: 'Eliminar todas las conversaciones guardadas',
          icon: <Trash2 className="w-5 h-5" />,
          isAction: true,
          action: handleClearHistory,
          actionLabel: 'Borrar',
          destructive: true,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {configSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-3 px-1">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-navy-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </div>
                  </div>

                  {item.isAction ? (
                    <button
                      onClick={item.action}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        item.destructive
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200'
                      }`}
                    >
                      {item.actionLabel}
                    </button>
                  ) : (
                    <button
                      onClick={item.onChange}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        item.value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-navy-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                          item.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Informacion */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-navy-800 dark:to-navy-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-700 dark:text-white">
                Asistente Litper v2.0
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Asistente con memoria e inteligencia artificial para gestionar tu logistica.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <a
                  href="#"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Documentacion
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="#"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Soporte
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Admin access */}
        <div className="border border-slate-200 dark:border-navy-600 rounded-xl overflow-hidden">
          <a
            href="#admin"
            className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Modo Administrador
                </p>
                <p className="text-xs text-slate-400">Acceso a configuracion avanzada</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Version */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-4">
          <p>Litper Logistica</p>
          <p>Sistema Enterprise v5.0</p>
        </div>
      </div>
    </div>
  );
};

export default ConfigTab;
