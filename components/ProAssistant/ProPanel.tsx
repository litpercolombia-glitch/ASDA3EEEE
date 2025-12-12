// components/ProAssistant/ProPanel.tsx
// Panel principal expandible del Asistente PRO con Multi-Conversación
import React, { useState } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  MessageCircle,
  Brain,
  Zap,
  Settings,
  Sparkles,
  Plus,
  Pin,
  MoreHorizontal,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useProAssistantStore, Conversation } from '../../stores/proAssistantStore';
import ProChatTab from './tabs/ProChatTab';
import ProKnowledgeTab from './tabs/ProKnowledgeTab';
import ProTasksTab from './tabs/ProTasksTab';
import ProConfigTab from './tabs/ProConfigTab';
import { RescueQueuePanel } from '../RescueSystem';
import { Shield } from 'lucide-react';

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageCircle, color: 'amber' },
  { id: 'rescue' as const, label: 'Rescate', icon: Shield, color: 'red' },
  { id: 'knowledge' as const, label: 'Base', icon: Brain, color: 'purple' },
  { id: 'tasks' as const, label: 'Tareas', icon: Zap, color: 'emerald' },
  { id: 'config' as const, label: 'Config', icon: Settings, color: 'slate' },
];

// Componente de pestañas de conversación
const ConversationTabs: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    closeConversation,
    renameConversation,
    pinConversation,
  } = useProAssistantStore();

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/30 overflow-x-auto scrollbar-none">
      {/* Pestañas de conversación */}
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`
            relative group flex items-center gap-1.5 px-2.5 py-1.5
            rounded-lg text-xs font-medium cursor-pointer
            transition-all duration-200 min-w-[80px] max-w-[140px]
            ${conv.id === activeConversationId
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent'
            }
          `}
          onClick={() => setActiveConversationId(conv.id)}
        >
          {/* Indicador de fijada */}
          {conv.isPinned && (
            <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" />
          )}

          {/* Título editable */}
          {editingId === conv.id ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleRename(conv.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(conv.id)}
              className="flex-1 bg-transparent border-none outline-none text-white text-xs w-full"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate flex-1">{conv.title}</span>
          )}

          {/* Botón menú / cerrar */}
          {conversations.length > 1 && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === conv.id ? null : conv.id);
                }}
                className="p-0.5 hover:bg-slate-600 rounded"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeConversation(conv.id);
                }}
                className="p-0.5 hover:bg-red-500/30 hover:text-red-400 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Menú desplegable */}
          {menuOpen === conv.id && (
            <div
              className="absolute top-full left-0 mt-1 z-50 w-32 bg-slate-800 rounded-lg border border-slate-700 shadow-xl py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setEditingId(conv.id);
                  setEditTitle(conv.title);
                  setMenuOpen(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
              >
                <Edit2 className="w-3 h-3" /> Renombrar
              </button>
              <button
                onClick={() => {
                  pinConversation(conv.id);
                  setMenuOpen(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
              >
                <Pin className="w-3 h-3" /> {conv.isPinned ? 'Desfijar' : 'Fijar'}
              </button>
              <button
                onClick={() => {
                  closeConversation(conv.id);
                  setMenuOpen(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-3 h-3" /> Cerrar
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Botón nueva conversación */}
      {conversations.length < 5 && (
        <button
          onClick={() => createConversation()}
          className="flex items-center justify-center w-7 h-7 rounded-lg
            bg-slate-700/30 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400
            transition-all duration-200 flex-shrink-0"
          title="Nueva conversación (máx 5)"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const ProPanel: React.FC = () => {
  const {
    setIsOpen,
    isMaximized,
    setIsMaximized,
    activeTab,
    setActiveTab,
    isProcessing,
    conversations,
    shipmentsContext,
  } = useProAssistantStore();

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
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
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
      {/* PESTAÑAS DE CONVERSACIÓN (Solo en Chat) */}
      {/* ============================================ */}
      {activeTab === 'chat' && conversations.length > 0 && (
        <ConversationTabs />
      )}

      {/* ============================================ */}
      {/* CONTENIDO DE TABS */}
      {/* ============================================ */}
      <div className="flex-1 overflow-hidden bg-slate-900">
        {activeTab === 'chat' && <ProChatTab />}
        {activeTab === 'rescue' && <RescueQueuePanel shipments={shipmentsContext} />}
        {activeTab === 'knowledge' && <ProKnowledgeTab />}
        {activeTab === 'tasks' && <ProTasksTab />}
        {activeTab === 'config' && <ProConfigTab />}
      </div>
    </div>
  );
};

export default ProPanel;
