// ============================================
// LITPER COMMAND CENTER PRO
// Centro de Comando Completo con IA, Skills, Tabs y Automatizaciones
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain, Send, Sparkles, Package, MapPin, DollarSign, FileText, Bell, Zap, Upload,
  Settings, History, Plus, X, ChevronRight, RefreshCw, Wifi, WifiOff, Bot, User,
  BarChart3, TrendingUp, AlertTriangle, PanelLeftClose, PanelLeft, Copy, ThumbsUp,
  ThumbsDown, Globe, Search, Cloud, CloudRain, Sun, Moon, Download, Trash2, Pin,
  PinOff, Edit3, Check, MoreVertical, Play, Pause, Clock, Filter, ChevronDown,
  Layout, Grid, List, Calendar, FileSpreadsheet, MessageSquare, Layers,
} from 'lucide-react';
import { claudeService, ClaudeMessage, Artifact } from '../../services/claudeService';
import { guiasService, alertasService, dashboardService } from '../../services/supabaseService';
import { skillsService, SKILLS_REGISTRY } from '../../services/skillsService';
import { tabsService, Tab, DashboardTab, DashboardWidget } from '../../services/tabsService';
import { automationEngineService, AutomationRule } from '../../services/automationEngineService';
import { fileProcessorService, ProcessedFile, ImportResult } from '../../services/fileProcessorService';
import { webSearchService, weatherService } from '../../services/webSearchService';

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
  processed?: ProcessedFile;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  color: string;
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
  { id: 'buscar_web', label: 'Buscar en web', icon: Globe, prompt: 'Busca en internet: ', color: 'from-indigo-500 to-blue-500' },
  { id: 'clima', label: 'Clima', icon: Cloud, prompt: '¿Cómo está el clima en las principales ciudades?', color: 'from-sky-500 to-blue-500' },
];

const TAB_ICONS: Record<string, React.ElementType> = {
  chat: MessageSquare,
  dashboard: Layout,
  report: FileText,
  custom: Layers,
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const LitperCommandCenterPro: React.FC = () => {
  // Estado del Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ClaudeMessage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Estado de la UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'actions' | 'skills' | 'automations'>('actions');
  const [isConnected, setIsConnected] = useState(false);

  // Estado de Tabs
  const [tabs, setTabs] = useState<Tab[]>(tabsService.getSortedTabs());
  const [activeTabId, setActiveTabId] = useState(tabsService.getActiveTabId());
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');

  // Estado de Stats
  const [stats, setStats] = useState({
    guiasHoy: 0,
    entregadas: 0,
    tasaEntrega: 0,
    ventasHoy: 0,
    alertas: 0,
  });

  // Estado de Automatizaciones
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationStats, setAutomationStats] = useState({ totalRules: 0, enabledRules: 0 });

  // Estado de Clima
  const [weather, setWeather] = useState<{ ciudad: string; temp: number; condicion: string }[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ============================================
  // EFECTOS
  // ============================================

  // Mensaje de bienvenida
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy **LITPER AI**, tu asistente de logística con capacidades avanzadas.

**Mis habilidades incluyen:**
- 📦 Gestión completa de guías y envíos
- 🗺️ Monitoreo de semáforo de ciudades
- 💰 Análisis financiero en tiempo real
- 🌐 Búsqueda de información en internet
- 🌤️ Consulta de clima por ciudad
- ⚡ Automatizaciones inteligentes
- 📊 Reportes y exportación de datos

**¿En qué puedo ayudarte hoy?**`,
      timestamp: new Date(),
      suggestions: ['¿Cómo va el día?', 'Buscar ciudades críticas', 'Ver automatizaciones activas'],
    };
    setMessages([welcomeMessage]);
  }, []);

  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    try {
      // Stats del dashboard
      const dashboardData = await dashboardService.getDashboardData();
      setStats({
        guiasHoy: dashboardData.guiasHoy,
        entregadas: dashboardData.entregadasHoy,
        tasaEntrega: dashboardData.tasaEntrega,
        ventasHoy: dashboardData.ventasHoy,
        alertas: dashboardData.alertasNoLeidas,
      });
      setIsConnected(true);

      // Automatizaciones
      const rules = automationEngineService.getRules();
      setAutomationRules(rules);
      setAutomationStats({
        totalRules: rules.length,
        enabledRules: rules.filter(r => r.enabled).length,
      });

      // Clima de ciudades principales
      const cities = ['Bogotá', 'Medellín', 'Cali'];
      const weatherData: { ciudad: string; temp: number; condicion: string }[] = [];
      for (const city of cities) {
        const w = await weatherService.getWeather(city);
        if (w) {
          weatherData.push({ ciudad: city, temp: w.temperatura, condicion: w.condicion });
        }
      }
      setWeather(weatherData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================================
  // HANDLERS DEL CHAT
  // ============================================

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
    const filesToProcess = [...attachedFiles];
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      let messageContent = content.trim();

      // Procesar archivos adjuntos
      for (const file of filesToProcess) {
        try {
          const processed = await fileProcessorService.processFile(file);
          messageContent += `\n\n[Archivo: ${file.name}]\nTipo detectado: ${processed.detectedType}\nFilas: ${processed.rowCount}\nColumnas: ${processed.headers.join(', ')}\n\nVista previa:\n${JSON.stringify(processed.preview.slice(0, 5), null, 2)}`;
        } catch (e) {
          messageContent += `\n\n[Archivo: ${file.name}] - Error al procesar: ${e}`;
        }
      }

      // Detectar y ejecutar skill automáticamente si es apropiado
      const detectedSkill = skillsService.detectSkill(messageContent);
      let skillResult = null;

      if (detectedSkill) {
        // Extraer parámetros básicos del mensaje
        const params: Record<string, unknown> = {};

        if (detectedSkill.id === 'web') {
          const match = messageContent.match(/busca(?:r)?\s+(?:en\s+(?:internet|web)\s+)?(.+)/i);
          if (match) params.query = match[1];
        }

        if (detectedSkill.id === 'clima') {
          const match = messageContent.match(/clima\s+(?:en\s+)?(\w+)/i);
          if (match) params.ciudad = match[1];
        }

        skillResult = await skillsService.execute(detectedSkill.id, params);
      }

      // Llamar a Claude con contexto del skill si aplica
      const contextEnhanced = skillResult
        ? `${messageContent}\n\n[SKILL EJECUTADO: ${detectedSkill?.name}]\n${skillResult.message}`
        : messageContent;

      const newHistory: ClaudeMessage[] = [...conversationHistory, { role: 'user', content: contextEnhanced }];
      const response = await claudeService.chat(newHistory);
      setConversationHistory([...newHistory, { role: 'assistant', content: response.content }]);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: skillResult ? `${skillResult.message}\n\n${response.content}` : response.content,
        timestamp: new Date(),
        artifacts: response.artifacts || (skillResult?.artifacts as Artifact[] | undefined),
        suggestions: response.suggestions || skillResult?.suggestions,
        skillUsed: detectedSkill?.name || response.skillUsed,
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage));
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${error instanceof Error ? error.message : 'Error desconocido. Intenta de nuevo.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'buscar_web') {
      setInputValue(action.prompt);
      inputRef.current?.focus();
    } else {
      handleSendMessage(action.prompt);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============================================
  // HANDLERS DE TABS
  // ============================================

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    tabsService.setActiveTab(tabId);
  };

  const handleCreateTab = (type: Tab['type']) => {
    let newTab: Tab;

    if (type === 'dashboard') {
      newTab = tabsService.createDashboard(`Dashboard ${tabs.filter(t => t.type === 'dashboard').length + 1}`);
    } else if (type === 'report') {
      newTab = tabsService.createReport(`Reporte ${tabs.filter(t => t.type === 'report').length + 1}`, 'daily');
    } else {
      newTab = tabsService.createTab({ name: 'Nueva Tab', type: 'chat' });
    }

    setTabs(tabsService.getSortedTabs());
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabsService.deleteTab(tabId)) {
      setTabs(tabsService.getSortedTabs());
      if (activeTabId === tabId) {
        setActiveTabId(tabs[0]?.id || 'main-chat');
      }
    }
  };

  const handleRenameTab = (tabId: string) => {
    if (newTabName.trim()) {
      tabsService.renameTab(tabId, newTabName.trim());
      setTabs(tabsService.getSortedTabs());
    }
    setEditingTabId(null);
    setNewTabName('');
  };

  const handleTogglePin = (tabId: string) => {
    tabsService.togglePin(tabId);
    setTabs(tabsService.getSortedTabs());
  };

  // ============================================
  // HANDLERS DE AUTOMATIZACIONES
  // ============================================

  const handleToggleAutomation = (ruleId: string) => {
    automationEngineService.toggleRule(ruleId);
    setAutomationRules(automationEngineService.getRules());
    setAutomationStats({
      totalRules: automationEngineService.getRules().length,
      enabledRules: automationEngineService.getRules().filter(r => r.enabled).length,
    });
  };

  const handleRunAutomation = async (ruleId: string) => {
    await automationEngineService.executeRule(ruleId, {});
    // Refrescar datos
    fetchData();
  };

  // ============================================
  // UTILIDADES
  // ============================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  const getWeatherIcon = (condicion: string) => {
    const lower = condicion.toLowerCase();
    if (lower.includes('lluvia') || lower.includes('chubasc')) return CloudRain;
    if (lower.includes('nublado')) return Cloud;
    return Sun;
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ============================================ */}
      {/* SIDEBAR IZQUIERDO */}
      {/* ============================================ */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-slate-900/50 border-r border-slate-800 flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">LITPER</h1>
              <p className="text-xs text-slate-400">Command Center PRO</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
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

        {/* Skills */}
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Skills IA</p>
          <div className="grid grid-cols-3 gap-2">
            {SKILLS_REGISTRY.slice(0, 9).map(skill => (
              <button
                key={skill.id}
                onClick={() => handleSendMessage(`Ejecuta el skill de ${skill.name}`)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                title={skill.description}
              >
                <span className="text-xl">{skill.icon}</span>
                <span className="text-xs text-slate-400">{skill.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Tabs</p>
            <div className="flex gap-1">
              <button
                onClick={() => handleCreateTab('chat')}
                className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white"
                title="Nueva conversación"
              >
                <MessageSquare className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleCreateTab('dashboard')}
                className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white"
                title="Nuevo dashboard"
              >
                <Layout className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {tabs.map(tab => {
              const TabIcon = TAB_ICONS[tab.type] || Layers;
              return (
                <div
                  key={tab.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTabId === tab.id
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {editingTabId === tab.id ? (
                    <input
                      type="text"
                      value={newTabName}
                      onChange={e => setNewTabName(e.target.value)}
                      onBlur={() => handleRenameTab(tab.id)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameTab(tab.id)}
                      className="flex-1 bg-slate-800 rounded px-2 py-1 text-sm text-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => handleTabChange(tab.id)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <span>{tab.icon}</span>
                        <span className="text-sm truncate">{tab.name}</span>
                        {tab.isPinned && <Pin className="w-3 h-3 text-violet-400" />}
                      </button>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTabId(tab.id);
                            setNewTabName(tab.name);
                          }}
                          className="p-1 hover:bg-slate-700 rounded"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleTogglePin(tab.id)}
                          className="p-1 hover:bg-slate-700 rounded"
                        >
                          {tab.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                        {tab.isCloseable && (
                          <button
                            onClick={() => handleCloseTab(tab.id)}
                            className="p-1 hover:bg-slate-700 rounded text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-slate-400">{isConnected ? 'Conectado' : 'Offline'}</span>
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg">
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Mini clima */}
          {weather.length > 0 && (
            <div className="space-y-1">
              {weather.map(w => {
                const WeatherIcon = getWeatherIcon(w.condicion);
                return (
                  <div key={w.ciudad} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{w.ciudad}</span>
                    <div className="flex items-center gap-1">
                      <WeatherIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300">{w.temp}°C</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ============================================ */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ============================================ */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-slate-400" />
              ) : (
                <PanelLeft className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-white">LITPER AI</span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs rounded-full">
                PRO
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 hover:bg-slate-800 rounded-lg"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg"
            >
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                onSuggestionClick={handleSendMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Panel Derecho */}
          {rightPanelOpen && (
            <div className="w-80 border-l border-slate-800 flex flex-col">
              {/* Tabs del panel */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setRightPanelTab('actions')}
                  className={`flex-1 py-3 text-xs font-medium ${
                    rightPanelTab === 'actions' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400'
                  }`}
                >
                  Acciones
                </button>
                <button
                  onClick={() => setRightPanelTab('skills')}
                  className={`flex-1 py-3 text-xs font-medium ${
                    rightPanelTab === 'skills' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400'
                  }`}
                >
                  Skills
                </button>
                <button
                  onClick={() => setRightPanelTab('automations')}
                  className={`flex-1 py-3 text-xs font-medium ${
                    rightPanelTab === 'automations' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400'
                  }`}
                >
                  Auto
                </button>
              </div>

              {/* Contenido del panel */}
              <div className="flex-1 overflow-y-auto p-4">
                {rightPanelTab === 'actions' && (
                  <div className="space-y-2">
                    {QUICK_ACTIONS.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          disabled={isLoading}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all group disabled:opacity-50"
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-slate-300 group-hover:text-white flex-1 text-left">
                            {action.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {rightPanelTab === 'skills' && (
                  <div className="space-y-3">
                    {SKILLS_REGISTRY.map(skill => (
                      <div
                        key={skill.id}
                        className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => handleSendMessage(`Usa el skill de ${skill.name}`)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{skill.icon}</span>
                          <span className="font-medium text-white">{skill.name}</span>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                            {skill.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{skill.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {rightPanelTab === 'automations' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-slate-400">
                        {automationStats.enabledRules}/{automationStats.totalRules} activas
                      </p>
                    </div>
                    {automationRules.map(rule => (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          rule.enabled
                            ? 'bg-slate-800/50 border-slate-700'
                            : 'bg-slate-900/50 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white text-sm">{rule.name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRunAutomation(rule.id)}
                              className="p-1 hover:bg-slate-700 rounded"
                              title="Ejecutar ahora"
                            >
                              <Play className="w-3 h-3 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => handleToggleAutomation(rule.id)}
                              className={`p-1 rounded ${rule.enabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}
                            >
                              {rule.enabled ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Pause className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{rule.description}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{rule.executionCount} ejecuciones</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="p-4 border-t border-slate-800">
                <div className="p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-white">Tip Pro</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Sube archivos Excel para importar guías automáticamente. La IA detectará las columnas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 p-4">
          {/* Archivos adjuntos */}
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">{file.name}</span>
                  <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)}KB)</span>
                  <button
                    onClick={() => removeAttachedFile(index)}
                    className="p-0.5 hover:bg-slate-700 rounded"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept=".xlsx,.xls,.csv,.pdf,.txt,.json"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                title="Subir archivo"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSendMessage('Buscar en internet: ')}
                className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                title="Buscar en web"
              >
                <Globe className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje o pregunta..."
                rows={1}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
              className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl text-white disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface MessageBubbleProps {
  message: Message;
  onSuggestionClick: (text: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSuggestionClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
            : 'bg-gradient-to-br from-violet-500 to-purple-600'
        }`}
      >
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
            <span className="text-sm text-slate-400">Procesando...</span>
          </div>
        ) : (
          <>
            <div
              className={`inline-block px-4 py-3 rounded-2xl ${
                isUser ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'bg-slate-800 text-slate-200'
              }`}
            >
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {message.attachments.map((att, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs">
                      📎 {att.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                {message.content}
              </div>
              {message.skillUsed && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <span className="text-xs text-violet-400">✨ Skill: {message.skillUsed}</span>
                </div>
              )}
            </div>
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {message.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick(s)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {!isUser && (
              <div className="mt-2 flex items-center gap-1">
                <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-400">
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400">
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
        <p className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default LitperCommandCenterPro;
