// components/ChatFirst/SkillViews/AutomatizacionesSkillView.tsx
// Vista de Automatizaciones - Panel unificado de automatizacion
import React, { useState } from 'react';
import {
  Zap,
  Upload,
  FileSpreadsheet,
  Bell,
  MessageSquare,
  Clock,
  Settings,
  Play,
  Pause,
  Plus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Smartphone,
} from 'lucide-react';
import { Shipment } from '../../../types';

interface AutomatizacionesSkillViewProps {
  shipments: Shipment[];
  onChatQuery?: (query: string) => void;
  onFileUpload?: (file: File) => void;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun?: Date;
  runsToday: number;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export const AutomatizacionesSkillView: React.FC<AutomatizacionesSkillViewProps> = ({
  shipments,
  onChatQuery,
  onFileUpload,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'rules' | 'scheduled'>('quick');

  // Automatizaciones activas (simuladas)
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Alerta envios criticos',
      description: 'Notifica cuando un envio supera 5 dias sin movimiento',
      trigger: 'Envio > 5 dias sin actualizar',
      action: 'Enviar alerta WhatsApp',
      isActive: true,
      lastRun: new Date(Date.now() - 3600000),
      runsToday: 12,
    },
    {
      id: '2',
      name: 'Reporte diario automatico',
      description: 'Genera y envia reporte cada dia a las 8am',
      trigger: 'Cada dia 8:00 AM',
      action: 'Generar reporte + Email',
      isActive: true,
      lastRun: new Date(Date.now() - 7200000),
      runsToday: 1,
    },
    {
      id: '3',
      name: 'Mensaje cliente entrega',
      description: 'Notifica al cliente cuando su pedido esta por llegar',
      trigger: 'Estado: En camino a destino',
      action: 'SMS al cliente',
      isActive: false,
      runsToday: 0,
    },
  ]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);

    onFileUpload?.(file);
    onChatQuery?.(`Procesa el archivo Excel ${file.name}`);
  };

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const quickActions: QuickAction[] = [
    {
      id: 'upload',
      name: 'Cargar Excel',
      description: 'Importar guias desde archivo',
      icon: FileSpreadsheet,
      color: 'from-emerald-500 to-teal-500',
      action: () => document.getElementById('file-upload')?.click(),
    },
    {
      id: 'alert-team',
      name: 'Alertar Equipo',
      description: 'Enviar alerta inmediata',
      icon: Bell,
      color: 'from-red-500 to-orange-500',
      action: () => onChatQuery?.('Envia alerta al equipo sobre envios criticos'),
    },
    {
      id: 'message-clients',
      name: 'Mensajes Masivos',
      description: 'Notificar clientes afectados',
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500',
      action: () => onChatQuery?.('Genera mensajes para clientes con envios retrasados'),
    },
    {
      id: 'schedule-report',
      name: 'Programar Reporte',
      description: 'Automatizar generacion',
      icon: Clock,
      color: 'from-purple-500 to-violet-500',
      action: () => onChatQuery?.('Quiero programar un reporte automatico diario'),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        id="file-upload"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
        {[
          { id: 'quick', label: 'Acciones Rapidas', icon: Zap },
          { id: 'rules', label: 'Reglas Activas', icon: Settings },
          { id: 'scheduled', label: 'Programadas', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-accent-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Actions Tab */}
      {activeTab === 'quick' && (
        <div className="space-y-4">
          {/* Upload Zone */}
          <label
            htmlFor="file-upload"
            className={`block p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
              isUploading
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-accent-400 animate-spin" />
                <p className="text-white font-medium">Procesando archivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-400" />
                <div>
                  <p className="text-white font-medium">Arrastra un archivo o haz clic</p>
                  <p className="text-xs text-slate-500">.xlsx, .xls, .csv</p>
                </div>
              </div>
            )}
          </label>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all hover:scale-[1.02]"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-white text-sm">{action.name}</p>
                <p className="text-xs text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className={`p-4 rounded-xl border transition-all ${
                auto.isActive
                  ? 'bg-white/5 border-white/20'
                  : 'bg-white/[0.02] border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{auto.name}</p>
                    {auto.isActive && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        Activa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{auto.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {auto.trigger}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {auto.action}
                    </span>
                  </div>
                  {auto.lastRun && (
                    <p className="text-xs text-slate-600 mt-1">
                      Ultima: {auto.lastRun.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} | Hoy: {auto.runsToday} veces
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleAutomation(auto.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    auto.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-white/10 text-slate-400 hover:bg-white/20'
                  }`}
                >
                  {auto.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => onChatQuery?.('Quiero crear una nueva regla de automatizacion')}
            className="w-full p-3 border border-dashed border-white/20 hover:border-white/40 rounded-xl text-center text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear nueva regla
          </button>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-3">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Reporte Diario</span>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                Activo
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-sm font-medium text-white">8:00 AM</p>
                <p className="text-xs text-slate-500">Hora</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-sm font-medium text-white">Diario</p>
                <p className="text-xs text-slate-500">Frecuencia</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  <Mail className="w-3 h-3 text-white" />
                  <Smartphone className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs text-slate-500">Canales</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onChatQuery?.('Programa un nuevo reporte automatico')}
            className="w-full p-3 border border-dashed border-white/20 hover:border-white/40 rounded-xl text-center text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Programar nuevo
          </button>
        </div>
      )}

      {/* Quick Chat Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <button
          onClick={() => onChatQuery?.('Que automatizaciones me recomiendas?')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Recomendar automatizaciones
        </button>
        <button
          onClick={() => onChatQuery?.('Crea una regla: si retraso mayor a 3 dias, alertar')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Crear regla ejemplo
        </button>
      </div>
    </div>
  );
};

export default AutomatizacionesSkillView;
