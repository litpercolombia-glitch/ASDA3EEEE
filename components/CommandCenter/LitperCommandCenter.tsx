// ============================================
// LITPER COMMAND CENTER
// Centro de Comando Conversacional con IA
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain, Send, Sparkles, Package, MapPin, DollarSign, FileText, Bell, Zap, Upload,
  Settings, History, Plus, X, ChevronRight, RefreshCw, Wifi, WifiOff, Bot, User,
  BarChart3, TrendingUp, AlertTriangle, PanelLeftClose, PanelLeft, Copy, ThumbsUp,
  ThumbsDown, Globe,
} from 'lucide-react';
import { claudeService, ClaudeMessage, Artifact } from '../../services/claudeService';
import { guiasService, alertasService } from '../../services/supabaseService';

// ============================================
// TIPOS
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  artifacts?: Artifact[];
  suggestions?: string[];
  isLoading?: boolean;
  skillUsed?: string;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  type: string;
  size: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  color: string;
}

interface SavedTab {
  id: string;
  name: string;
  icon: string;
  type: 'dashboard' | 'chat' | 'report';
}

// ============================================
// CONSTANTES
// ============================================

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'resumen', label: 'Resumen del día', icon: TrendingUp, prompt: '¿Cómo va el día de hoy? Dame un resumen completo.', color: 'from-blue-500 to-cyan-500' },
  { id: 'ciudades', label: 'Ciudades críticas', icon: MapPin, prompt: '¿Cuáles ciudades tienen problemas de entrega?', color: 'from-red-500 to-rose-500' },
  { id: 'guias', label: 'Estado de guías', icon: Package, prompt: '¿Cuántas guías llevo hoy y cuál es su estado?', color: 'from-emerald-500 to-green-500' },
  { id: 'ventas', label: 'Ventas del día', icon: DollarSign, prompt: '¿Cómo van las ventas de hoy?', color: 'from-purple-500 to-violet-500' },
  { id: 'alertas', label: 'Ver alertas', icon: Bell, prompt: '¿Hay alertas pendientes?', color: 'from-amber-500 to-orange-500' },
  { id: 'novedades', label: 'Novedades', icon: AlertTriangle, prompt: 'Analiza las novedades pendientes.', color: 'from-pink-500 to-rose-500' },
];

const SKILLS = [
  { id: 'guias', name: 'Guías', icon: Package, color: 'text-blue-400' },
  { id: 'ciudades', name: 'Ciudades', icon: MapPin, color: 'text-emerald-400' },
  { id: 'finanzas', name: 'Finanzas', icon: DollarSign, color: 'text-purple-400' },
  { id: 'reportes', name: 'Reportes', icon: FileText, color: 'text-amber-400' },
  { id: 'alertas', name: 'Alertas', icon: Bell, color: 'text-red-400' },
  { id: 'automatizar', name: 'Auto', icon: Zap, color: 'text-cyan-400' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const LitperCommandCenter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [stats, setStats] = useState({ guiasHoy: 0, entregadas: 0, tasaEntrega: 0, ventasHoy: 0, alertas: 0 });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ClaudeMessage[]>([]);
  const [savedTabs] = useState<SavedTab[]>([
    { id: 'chat', name: 'Chat', icon: '💬', type: 'chat' },
    { id: 'dashboard', name: 'Dashboard', icon: '📊', type: 'dashboard' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mensaje de bienvenida
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy **LITPER AI**, tu asistente de logística.

Tengo acceso completo a tus datos en tiempo real:
- 📦 Guías y envíos
- 🗺️ Semáforo de ciudades
- 💰 Finanzas y márgenes
- 🔔 Alertas y notificaciones

**¿En qué puedo ayudarte hoy?**`,
      timestamp: new Date(),
      suggestions: ['¿Cómo va el día?', '¿Hay ciudades con problemas?', '¿Cuántas guías llevo hoy?'],
    }]);
  }, []);

  // Cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const guiasHoy = await guiasService.getHoy();
      const alertas = await alertasService.getNoLeidas();
      const entregadas = guiasHoy.filter(g => g.estado?.toLowerCase().includes('entregad')).length;
      const tasaEntrega = guiasHoy.length > 0 ? (entregadas / guiasHoy.length) * 100 : 0;
      const ventasHoy = guiasHoy.reduce((sum, g) => sum + (g.valor_declarado || 0), 0);
      setStats({ guiasHoy: guiasHoy.length, entregadas, tasaEntrega, ventasHoy, alertas: alertas.length });
      setIsConnected(true);
    } catch { setIsConnected(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handlers
  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      let messageContent = content.trim();
      for (const file of attachedFiles) {
        const fileContent = await readFileContent(file);
        messageContent += `\n\n[Archivo: ${file.name}]\n${fileContent}`;
      }

      const newHistory: ClaudeMessage[] = [...conversationHistory, { role: 'user', content: messageContent }];
      const response = await claudeService.chat(newHistory);
      setConversationHistory([...newHistory, { role: 'assistant', content: response.content }]);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        artifacts: response.artifacts,
        suggestions: response.suggestions,
        skillUsed: response.skillUsed,
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage));
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${error instanceof Error ? error.message : 'Intenta de nuevo.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => handleSendMessage(action.prompt);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => setAttachedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
  const removeAttachedFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      if (file.type.includes('text') || file.name.endsWith('.csv')) reader.readAsText(file);
      else resolve(`[Archivo binario: ${file.name}]`);
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  // RENDER
  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-slate-900/50 border-r border-slate-800 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">LITPER</h1>
              <p className="text-xs text-slate-400">Command Center</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Guías hoy</p>
              <p className="text-xl font-bold text-white">{stats.guiasHoy}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Tasa</p>
              <p className="text-xl font-bold text-emerald-400">{stats.tasaEntrega.toFixed(0)}%</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Ventas</p>
              <p className="text-sm font-bold text-white">{formatCurrency(stats.ventasHoy)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Alertas</p>
              <p className="text-xl font-bold text-amber-400">{stats.alertas}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Skills</p>
          <div className="grid grid-cols-3 gap-2">
            {SKILLS.map(skill => {
              const Icon = skill.icon;
              return (
                <button key={skill.id} onClick={() => handleSendMessage(`Usa el skill de ${skill.name}`)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                  <Icon className={`w-5 h-5 ${skill.color}`} />
                  <span className="text-xs text-slate-400">{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Tabs</p>
          <div className="space-y-1">
            {savedTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-slate-800 text-slate-300'}`}>
                <span>{tab.icon}</span>
                <span className="text-sm">{tab.name}</span>
              </button>
            ))}
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-500">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Nueva tab</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              <span className="text-xs text-slate-400">{isConnected ? 'Conectado' : 'Offline'}</span>
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg"><Settings className="w-4 h-4 text-slate-400" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5 text-slate-400" /> : <PanelLeft className="w-5 h-5 text-slate-400" />}
            </button>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-white">LITPER AI</span>
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">PRO</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchStats} className="p-2 hover:bg-slate-800 rounded-lg"><RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} /></button>
            <button className="p-2 hover:bg-slate-800 rounded-lg"><History className="w-5 h-5 text-slate-400" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => <MessageBubble key={message.id} message={message} onSuggestionClick={handleSendMessage} />)}
            <div ref={messagesEndRef} />
          </div>

          <div className="w-80 border-l border-slate-800 p-4 overflow-y-auto hidden lg:block">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Acciones Rápidas</p>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <button key={action.id} onClick={() => handleQuickAction(action)} disabled={isLoading} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all group disabled:opacity-50">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}><Icon className="w-4 h-4 text-white" /></div>
                    <span className="text-sm text-slate-300 group-hover:text-white flex-1 text-left">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                  </button>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-violet-400" /><span className="text-sm font-medium text-white">Tip</span></div>
              <p className="text-xs text-slate-300">Sube archivos Excel o CSV para importar guías o analizar datos.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 p-4">
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{file.name}</span>
                  <button onClick={() => removeAttachedFile(index)} className="p-0.5 hover:bg-slate-700 rounded"><X className="w-3 h-3 text-slate-400" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="flex gap-1">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".xlsx,.xls,.csv,.pdf,.txt,.json" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><Upload className="w-5 h-5" /></button>
              <button className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><Globe className="w-5 h-5" /></button>
            </div>
            <div className="flex-1">
              <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribe tu mensaje..." rows={1} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none" style={{ minHeight: '48px', maxHeight: '200px' }} />
            </div>
            <button onClick={() => handleSendMessage()} disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)} className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl text-white disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/30 transition-all"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </main>
    </div>
  );
};

// MessageBubble Component
interface MessageBubbleProps { message: Message; onSuggestionClick: (text: string) => void; }

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSuggestionClick }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {message.isLoading ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-slate-800 rounded-2xl">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-slate-400">Pensando...</span>
          </div>
        ) : (
          <>
            <div className={`inline-block px-4 py-3 rounded-2xl ${isUser ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {message.attachments.map((att, i) => <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs">📎 {att.name}</span>)}
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{message.content}</div>
              {message.skillUsed && <div className="mt-2 pt-2 border-t border-slate-700"><span className="text-xs text-violet-400">Skill: {message.skillUsed}</span></div>}
            </div>
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {message.suggestions.map((s, i) => <button key={i} onClick={() => onSuggestionClick(s)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">{s}</button>)}
              </div>
            )}
            {!isUser && (
              <div className="mt-2 flex items-center gap-1">
                <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300"><Copy className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-400"><ThumbsUp className="w-4 h-4" /></button>
                <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400"><ThumbsDown className="w-4 h-4" /></button>
              </div>
            )}
          </>
        )}
        <p className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>{message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

export default LitperCommandCenter;
