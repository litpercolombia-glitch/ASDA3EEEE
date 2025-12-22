// components/ProAssistant/tabs/ProConfigTab.tsx
// Tab de Configuracion del Asistente PRO con IA y Chatea Pro
import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Volume2,
  Globe,
  Palette,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  Brain,
  Database,
  Sparkles,
  Cpu,
  Webhook,
  Key,
  Link,
  Zap,
  TestTube,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useProAssistantStore, AIModel } from '../../../stores/proAssistantStore';

// ============================================
// COMPONENTE TOGGLE
// ============================================
const Toggle: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}> = ({ enabled, onChange, disabled }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative w-11 h-6 rounded-full transition-all duration-200
        ${enabled ? 'bg-amber-500' : 'bg-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div
        className={`
          absolute top-1 w-4 h-4 rounded-full bg-white shadow-md
          transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

// ============================================
// COMPONENTE DE SECCION
// ============================================
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}> = ({ title, icon, children, color = 'amber' }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={`text-${color}-400`}>{icon}</div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

// ============================================
// COMPONENTE DE ITEM DE CONFIG
// ============================================
const ConfigItem: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
};

// ============================================
// SELECTOR DE MODELO IA
// ============================================
const AIModelCard: React.FC<{
  model: AIModel;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ model, name, description, icon, color, selected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 rounded-xl border-2 transition-all duration-200
        ${selected
          ? `bg-${color}-500/20 border-${color}-500/50`
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-white">{name}</p>
          <p className="text-[10px] text-slate-500">{description}</p>
        </div>
        {selected && (
          <CheckCircle className={`w-5 h-5 text-${color}-400`} />
        )}
      </div>
    </button>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ProConfigTab: React.FC = () => {
  const {
    config,
    updateConfig,
    updateNotificationSettings,
    updatePermissions,
    setAIModel,
    updateAISettings,
    updateChateaProConfig,
    knowledge,
    messages,
    litperMessages,
    chateaProMessages,
    clearMessages,
    clearLitperMessages,
    clearChateaProMessages,
    tasks,
  } = useProAssistantStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Calcular estadisticas
  const knowledgeSize = knowledge.reduce((acc, k) => acc + (k.content?.length || 0), 0);
  const totalMessages = litperMessages.length + chateaProMessages.length;
  const taskCount = tasks.length;

  // Test de conexión Chatea Pro
  const testChateaProConnection = async () => {
    setTestingConnection(true);
    await new Promise(r => setTimeout(r, 1500));
    setTestingConnection(false);
    // En producción, hacer una llamada real al API
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {/* ============================================ */}
      {/* MODELO DE IA */}
      {/* ============================================ */}
      <Section title="Modelo de IA" icon={<Cpu className="w-4 h-4" />} color="purple">
        <div className="space-y-3">
          <AIModelCard
            model="claude"
            name="Claude (Anthropic)"
            description="Razonamiento avanzado, contexto largo"
            icon={<Brain className="w-5 h-5 text-amber-400" />}
            color="amber"
            selected={config.aiModel === 'claude'}
            onSelect={() => setAIModel('claude')}
          />
          <AIModelCard
            model="gemini"
            name="Gemini (Google)"
            description="Vision, busqueda, multimodal"
            icon={<Sparkles className="w-5 h-5 text-blue-400" />}
            color="blue"
            selected={config.aiModel === 'gemini'}
            onSelect={() => setAIModel('gemini')}
          />
          <AIModelCard
            model="openai"
            name="GPT-4 (OpenAI)"
            description="Uso general, estable"
            icon={<Zap className="w-5 h-5 text-emerald-400" />}
            color="emerald"
            selected={config.aiModel === 'openai'}
            onSelect={() => setAIModel('openai')}
          />
        </div>

        {/* Configuración del modelo seleccionado */}
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-400 mb-3">Configuración de {config.aiModel === 'claude' ? 'Claude' : config.aiModel === 'gemini' ? 'Gemini' : 'GPT-4'}</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Temperature (creatividad)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.aiSettings[config.aiModel].temperature}
                onChange={(e) => updateAISettings(config.aiModel, { temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Preciso</span>
                <span>{config.aiSettings[config.aiModel].temperature}</span>
                <span>Creativo</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Max Tokens</label>
              <select
                value={config.aiSettings[config.aiModel].maxTokens}
                onChange={(e) => updateAISettings(config.aiModel, { maxTokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="1024">1,024 (rapido)</option>
                <option value="2048">2,048 (balanceado)</option>
                <option value="4096">4,096 (detallado)</option>
                <option value="8192">8,192 (extenso)</option>
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* CHATEA PRO - INTEGRACION */}
      {/* ============================================ */}
      <Section title="Chatea Pro" icon={<Webhook className="w-4 h-4" />} color="cyan">
        <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-white">Integracion API</span>
            </div>
            <Toggle
              enabled={config.chateaPro.enabled}
              onChange={(v) => updateChateaProConfig({ enabled: v })}
            />
          </div>

          <div className="space-y-3">
            {/* API Key */}
            <div>
              <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Key className="w-3 h-3" />
                API Key
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.chateaPro.apiKey}
                    onChange={(e) => updateChateaProConfig({ apiKey: e.target.value })}
                    placeholder="sk_live_..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Link className="w-3 h-3" />
                Webhook URL
              </label>
              <input
                type="url"
                value={config.chateaPro.webhookUrl}
                onChange={(e) => updateChateaProConfig({ webhookUrl: e.target.value })}
                placeholder="https://tu-servidor.com/webhook"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Auto-sync */}
            <ConfigItem label="Auto-sincronizacion" description="Sincronizar datos automaticamente">
              <Toggle
                enabled={config.chateaPro.autoSync}
                onChange={(v) => updateChateaProConfig({ autoSync: v })}
              />
            </ConfigItem>

            {/* Test Connection */}
            <button
              onClick={testChateaProConnection}
              disabled={testingConnection || !config.chateaPro.apiKey}
              className={`
                w-full py-2.5 rounded-lg text-sm font-medium
                flex items-center justify-center gap-2
                transition-all duration-200
                ${config.chateaPro.apiKey
                  ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700'
                }
              `}
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Probando conexion...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Probar Conexion
                </>
              )}
            </button>
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* PERSONALIZACION */}
      {/* ============================================ */}
      <Section title="Personalizacion" icon={<User className="w-4 h-4" />}>
        <ConfigItem label="Nombre del asistente" description="Como quieres que se llame">
          <input
            type="text"
            value={config.assistantName}
            onChange={(e) => updateConfig({ assistantName: e.target.value })}
            className="w-32 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </ConfigItem>

        <ConfigItem label="Voz del asistente" description="Para respuestas de audio">
          <select
            value={config.voice}
            onChange={(e) => updateConfig({ voice: e.target.value as any })}
            className="w-32 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="sofia">Sofia (Femenina)</option>
            <option value="carlos">Carlos (Masculina)</option>
            <option value="lucia">Lucia (Femenina)</option>
          </select>
        </ConfigItem>

        <ConfigItem label="Idioma" description="Idioma de las respuestas">
          <select
            value={config.language}
            onChange={(e) => updateConfig({ language: e.target.value as any })}
            className="w-40 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="es-CO">Espanol (Colombia)</option>
            <option value="es-CL">Espanol (Chile)</option>
            <option value="es-EC">Espanol (Ecuador)</option>
          </select>
        </ConfigItem>
      </Section>

      {/* ============================================ */}
      {/* NOTIFICACIONES */}
      {/* ============================================ */}
      <Section title="Notificaciones" icon={<Bell className="w-4 h-4" />}>
        <ConfigItem label="Alertas criticas" description="Guias con problemas urgentes">
          <Toggle
            enabled={config.notifications.criticalAlerts}
            onChange={(v) => updateNotificationSettings({ criticalAlerts: v })}
          />
        </ConfigItem>

        <ConfigItem label="Novedades sin resolver" description="Guias con +24h sin gestion">
          <Toggle
            enabled={config.notifications.unresolvedNovelties}
            onChange={(v) => updateNotificationSettings({ unresolvedNovelties: v })}
          />
        </ConfigItem>

        <ConfigItem label="Reclamo en oficina" description="Guias con +3 dias en reclamo">
          <Toggle
            enabled={config.notifications.officeReclaims}
            onChange={(v) => updateNotificationSettings({ officeReclaims: v })}
          />
        </ConfigItem>

        <ConfigItem label="Reportes automaticos" description="Resumen diario y semanal">
          <Toggle
            enabled={config.notifications.autoReports}
            onChange={(v) => updateNotificationSettings({ autoReports: v })}
          />
        </ConfigItem>
      </Section>

      {/* ============================================ */}
      {/* PERMISOS DE EJECUCION */}
      {/* ============================================ */}
      <Section title="Permisos de Ejecucion" icon={<Shield className="w-4 h-4" />}>
        <ConfigItem label="Ejecutar reportes" description="Generar informes automaticos">
          <Toggle
            enabled={config.permissions.canExecuteReports}
            onChange={(v) => updatePermissions({ canExecuteReports: v })}
          />
        </ConfigItem>

        <ConfigItem label="Filtrar y buscar guias" description="Consultar datos de envios">
          <Toggle
            enabled={config.permissions.canFilterGuides}
            onChange={(v) => updatePermissions({ canFilterGuides: v })}
          />
        </ConfigItem>

        <ConfigItem label="Programar llamadas" description="Llamadas automaticas a clientes">
          <Toggle
            enabled={config.permissions.canScheduleCalls}
            onChange={(v) => updatePermissions({ canScheduleCalls: v })}
          />
        </ConfigItem>

        <ConfigItem label="Enviar WhatsApp masivo" description="Requiere confirmacion">
          <div className="flex items-center gap-2">
            {!config.permissions.canSendWhatsApp && (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <Toggle
              enabled={config.permissions.canSendWhatsApp}
              onChange={(v) => updatePermissions({ canSendWhatsApp: v })}
            />
          </div>
        </ConfigItem>
      </Section>

      {/* ============================================ */}
      {/* BASE DE CONOCIMIENTO */}
      {/* ============================================ */}
      <Section title="Datos y Memoria" icon={<Database className="w-4 h-4" />}>
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-400">{litperMessages.length}</p>
              <p className="text-xs text-slate-500">Litper Chat</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-cyan-400">{chateaProMessages.length}</p>
              <p className="text-xs text-slate-500">Chatea Pro</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-amber-400">{knowledge.length}</p>
              <p className="text-xs text-slate-500">Documentos</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Importar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearLitperMessages}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar Litper
            </button>
            <button
              onClick={clearChateaProMessages}
              className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar Chatea
            </button>
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* INFORMACION DEL SISTEMA */}
      {/* ============================================ */}
      <Section title="Informacion" icon={<Info className="w-4 h-4" />}>
        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">LITPER PRO</h4>
              <p className="text-xs text-slate-400">Asistente IA v3.0</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-white">3.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Modelo IA Activo</span>
              <span className="text-white">{config.aiModel === 'claude' ? 'Claude' : config.aiModel === 'gemini' ? 'Gemini' : 'GPT-4'}</span>
            </div>
            <div className="flex justify-between">
              <span>Chatea Pro</span>
              <span className={config.chateaPro.enabled ? 'text-emerald-400' : 'text-slate-500'}>
                {config.chateaPro.enabled ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Capacidades</span>
              <span className="text-amber-400 font-medium">PRO+</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Sistema operativo correctamente</span>
          </div>
        </div>
      </Section>

      {/* Spacer */}
      <div className="h-4" />
    </div>
  );
};

export default ProConfigTab;
