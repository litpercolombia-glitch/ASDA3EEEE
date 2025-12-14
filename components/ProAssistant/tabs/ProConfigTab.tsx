// components/ProAssistant/tabs/ProConfigTab.tsx
// Tab de Configuracion del Asistente PRO
import React from 'react';
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
} from 'lucide-react';
import { useProAssistantStore } from '../../../stores/proAssistantStore';

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
}> = ({ title, icon, children }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-amber-400">{icon}</div>
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
// COMPONENTE PRINCIPAL
// ============================================
const ProConfigTab: React.FC = () => {
  const {
    config,
    updateConfig,
    updateNotificationSettings,
    updatePermissions,
    knowledge,
    messages,
    clearMessages,
    tasks,
  } = useProAssistantStore();

  // Calcular estadisticas
  const knowledgeSize = knowledge.reduce((acc, k) => acc + (k.content?.length || 0), 0);
  const messageCount = messages.length;
  const taskCount = tasks.length;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
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

        <ConfigItem label="Cada nueva guia" description="Notificar al crear guias">
          <Toggle
            enabled={config.notifications.newGuides}
            onChange={(v) => updateNotificationSettings({ newGuides: v })}
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

        <ConfigItem label="Modificar ordenes Dropi" description="Cambios en plataforma externa">
          <div className="flex items-center gap-2">
            {!config.permissions.canModifyOrders && (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <Toggle
              enabled={config.permissions.canModifyOrders}
              onChange={(v) => updatePermissions({ canModifyOrders: v })}
            />
          </div>
        </ConfigItem>
      </Section>

      {/* ============================================ */}
      {/* BASE DE CONOCIMIENTO */}
      {/* ============================================ */}
      <Section title="Base de Conocimiento" icon={<Brain className="w-4 h-4" />}>
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-amber-400">{knowledge.length}</p>
              <p className="text-xs text-slate-500">Documentos</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-400">
                {Math.round(knowledgeSize / 1024)}
              </p>
              <p className="text-xs text-slate-500">KB Total</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-400">{messageCount}</p>
              <p className="text-xs text-slate-500">Mensajes</p>
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

          <button
            onClick={clearMessages}
            className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Historial de Chat
          </button>
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
              <p className="text-xs text-slate-400">Asistente IA v2.0</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-white">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Modelo IA</span>
              <span className="text-white">Claude + Local</span>
            </div>
            <div className="flex justify-between">
              <span>Capacidades</span>
              <span className="text-amber-400 font-medium">PRO</span>
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
