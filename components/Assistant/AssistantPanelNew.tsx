import React, { useState } from 'react';
import { X, Minimize2, MessageCircle, BookOpen, Settings, Bot, Maximize2 } from 'lucide-react';
import { ChatTab } from './ChatTab';
import { KnowledgeTab } from './KnowledgeTab';
import { ConfigTab } from './ConfigTab';

interface AssistantPanelNewProps {
  onClose: () => void;
  shipmentsContext?: any[];
}

type TabType = 'chat' | 'knowledge' | 'config';

export const AssistantPanelNew: React.FC<AssistantPanelNewProps> = ({
  onClose,
  shipmentsContext = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Panel minimizado
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-24 right-6 z-40 bg-white dark:bg-navy-900 rounded-lg shadow-xl p-3 cursor-pointer hover:shadow-2xl transition-all border border-slate-200 dark:border-navy-700"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-white">Asistente Litper</span>
        </div>
      </div>
    );
  }

  const panelClasses = isMaximized
    ? 'fixed inset-4 z-50'
    : 'fixed bottom-24 right-6 z-40 w-[420px] h-[650px]';

  return (
    <div className={`${panelClasses} bg-white dark:bg-navy-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-navy-700 animate-in slide-in-from-bottom-4 duration-300`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
              <Bot className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Asistente Litper</h2>
            <p className="text-[10px] text-blue-100">IA con Memoria</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
            activeTab === 'chat'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
          {activeTab === 'chat' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
            activeTab === 'knowledge'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Conocimiento</span>
          {activeTab === 'knowledge' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
            activeTab === 'config'
              ? 'text-slate-600 dark:text-slate-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Config</span>
          {activeTab === 'config' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatTab shipmentsContext={shipmentsContext} />}
        {activeTab === 'knowledge' && <KnowledgeTab />}
        {activeTab === 'config' && <ConfigTab />}
      </div>
    </div>
  );
};

export default AssistantPanelNew;
