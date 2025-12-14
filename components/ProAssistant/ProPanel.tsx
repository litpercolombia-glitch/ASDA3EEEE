// components/ProAssistant/ProPanel.tsx
// Panel principal expandible del Asistente PRO
import React from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  MessageCircle,
  Brain,
  Zap,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useProAssistantStore } from '../../stores/proAssistantStore';
import ProChatTab from './tabs/ProChatTab';
import ProKnowledgeTab from './tabs/ProKnowledgeTab';
import ProTasksTab from './tabs/ProTasksTab';
import ProConfigTab from './tabs/ProConfigTab';

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageCircle, color: 'amber' },
  { id: 'knowledge' as const, label: 'Conocimiento', icon: Brain, color: 'purple' },
  { id: 'tasks' as const, label: 'Tareas', icon: Zap, color: 'emerald' },
  { id: 'config' as const, label: 'Config', icon: Settings, color: 'slate' },
];

const ProPanel: React.FC = () => {
  const { setIsOpen, isMaximized, setIsMaximized, activeTab, setActiveTab, isProcessing } =
    useProAssistantStore();

  const panelSize = isMaximized
    ? 'fixed inset-4 z-[9998]'
    : 'fixed bottom-24 right-6 z-[9998] w-[420px] h-[600px]';

  return (
    <div
      className={`
        ${panelSize}
        bg-slate-900 rounded-2xl shadow-2xl
        border border-slate-700/50
        overflow-hidden
        flex flex-col
        animate-in slide-in-from-bottom-4 fade-in duration-300
      `}
    >
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div
        className="flex items-center justify-between px-4 py-3
          bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-red-500/20
          border-b border-slate-700/50"
      >
        <div className="flex items-center gap-3">
          {/* Logo PRO */}
          <div
            className="w-10 h-10 rounded-xl
              bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
              flex items-center justify-center
              shadow-lg shadow-orange-500/30"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Litper PRO</span>
              {isProcessing && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full animate-pulse">
                  Procesando...
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Asistente IA con Superpoderes</p>
          </div>
        </div>

        {/* Controles de ventana */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-slate-400"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* TABS */}
      {/* ============================================ */}
      <div className="flex border-b border-slate-700/50 bg-slate-900/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3
                transition-all duration-200
                ${
                  isActive
                    ? `text-${tab.color}-400 border-b-2 border-${tab.color}-400 bg-${tab.color}-500/10`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-b-2 border-transparent'
                }
              `}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* CONTENIDO DE TABS */}
      {/* ============================================ */}
      <div className="flex-1 overflow-hidden bg-slate-900">
        {activeTab === 'chat' && <ProChatTab />}
        {activeTab === 'knowledge' && <ProKnowledgeTab />}
        {activeTab === 'tasks' && <ProTasksTab />}
        {activeTab === 'config' && <ProConfigTab />}
      </div>
    </div>
  );
};

export default ProPanel;
