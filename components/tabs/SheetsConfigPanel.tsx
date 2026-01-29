// components/tabs/SheetsConfigPanel.tsx
// Panel de configuración avanzada para Google Sheets

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Shield,
  Clock,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Upload,
  FileText,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import googleSheetsService from '../../services/googleSheetsService';
import { GoogleSheetsConfig } from '../../types/googleSheets.types';

interface SheetsConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: GoogleSheetsConfig) => void;
}

const SheetsConfigPanel: React.FC<SheetsConfigPanelProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  // Estados
  const [config, setConfig] = useState<Partial<GoogleSheetsConfig>>({
    autoSync: false,
    syncInterval: 30,
  });
  const [credentialsJson, setCredentialsJson] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connection' | 'sync' | 'advanced'>('connection');

  // Cargar configuración existente
  useEffect(() => {
    const savedConfig = googleSheetsService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Guardar configuración localmente
      localStorage.setItem('litper_google_sheets_config', JSON.stringify(config));

      if (onConfigSaved && config as GoogleSheetsConfig) {
        onConfigSaved(config as GoogleSheetsConfig);
      }

      onClose();
    } catch (err) {
      setError(`Error al guardar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.spreadsheetId) {
      setTestResult({
        success: false,
        message: 'Ingresa un ID de spreadsheet primero',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const isConnected = await googleSheetsService.testConnection();
      setTestResult({
        success: isConnected,
        message: isConnected
          ? 'Conexión exitosa al spreadsheet'
          : 'No se pudo conectar. Verifica el ID y los permisos.',
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCredentialsJson(content);

      try {
        const parsed = JSON.parse(content);
        if (parsed.project_id) {
          setError(null);
        }
      } catch {
        setError('El archivo no es un JSON válido');
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderConnectionTab = () => (
    <div className="space-y-6">
      {/* Spreadsheet ID */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          ID del Spreadsheet
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={config.spreadsheetId || ''}
            onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Probar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Encuentra el ID en la URL de tu Google Sheet
        </p>
      </div>

      {/* Resultado del test */}
      {testResult && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            testResult.success
              ? 'bg-green-500/20 border border-green-500/50'
              : 'bg-red-500/20 border border-red-500/50'
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
            {testResult.message}
          </span>
        </div>
      )}

      {/* Credenciales */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Credenciales de Servicio (Opcional)
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="px-4 py-3 bg-gray-700 border border-gray-600 border-dashed rounded-lg text-center hover:bg-gray-650 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <span className="text-sm text-gray-400">
                  Subir archivo credentials.json
                </span>
              </div>
            </label>
          </div>

          {credentialsJson && (
            <div className="relative">
              <textarea
                value={showCredentials ? credentialsJson : '••••••••••••••••••••'}
                readOnly
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 font-mono text-xs h-24 resize-none"
              />
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="absolute top-2 right-2 p-1 hover:bg-gray-600 rounded"
              >
                {showCredentials ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <strong>¿Cómo obtener credenciales?</strong>
              <ol className="mt-2 space-y-1 text-blue-400/80">
                <li>1. Ve a Google Cloud Console</li>
                <li>2. Crea un proyecto o selecciona uno existente</li>
                <li>3. Habilita la API de Google Sheets</li>
                <li>4. Crea una cuenta de servicio</li>
                <li>5. Descarga el archivo JSON de credenciales</li>
                <li>6. Comparte tu spreadsheet con el email de la cuenta de servicio</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSyncTab = () => (
    <div className="space-y-6">
      {/* Auto-sync */}
      <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-400" />
          <div>
            <span className="font-medium text-white">Sincronización Automática</span>
            <p className="text-sm text-gray-400">
              Sincroniza automáticamente los datos
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.autoSync || false}
            onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Intervalo de sync */}
      {config.autoSync && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Intervalo de Sincronización
          </label>
          <select
            value={config.syncInterval || 30}
            onChange={(e) =>
              setConfig({ ...config, syncInterval: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value={5}>Cada 5 minutos</option>
            <option value={15}>Cada 15 minutos</option>
            <option value={30}>Cada 30 minutos</option>
            <option value={60}>Cada hora</option>
            <option value={120}>Cada 2 horas</option>
          </select>
        </div>
      )}

      {/* Datos a sincronizar */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Datos a Sincronizar
        </label>
        <div className="space-y-2">
          {[
            { id: 'envios', label: 'Envíos', description: 'Lista completa de guías' },
            { id: 'dashboard', label: 'Dashboard', description: 'Métricas y KPIs' },
            { id: 'ciudades', label: 'Ciudades', description: 'Estadísticas por ciudad' },
            { id: 'alertas', label: 'Alertas', description: 'Alertas activas' },
            { id: 'finanzas', label: 'Finanzas', description: 'Datos financieros' },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <div>
                <span className="font-medium text-white">{item.label}</span>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.id === 'envios' || item.id === 'dashboard'}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {/* Nombre del spreadsheet */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nombre del Spreadsheet
        </label>
        <input
          type="text"
          value={config.spreadsheetName || ''}
          onChange={(e) => setConfig({ ...config, spreadsheetName: e.target.value })}
          placeholder="Litper Pro - Datos"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* URL del Spreadsheet */}
      {config.spreadsheetId && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL del Spreadsheet
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`}
              readOnly
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 font-mono text-sm"
            />
            <button
              onClick={() =>
                copyToClipboard(
                  `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`
                )
              }
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            <a
              href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>
      )}

      {/* Información de última sync */}
      {config.lastSync && (
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Última Sincronización
          </h4>
          <p className="text-white">
            {new Date(config.lastSync).toLocaleString()}
          </p>
        </div>
      )}

      {/* Acciones peligrosas */}
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Zona de Peligro
        </h4>
        <div className="space-y-3">
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de limpiar el historial?')) {
                googleSheetsService.clearSyncHistory();
              }
            }}
            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            Limpiar Historial de Sincronización
          </button>
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de desconectar?')) {
                googleSheetsService.disconnect();
                onClose();
              }
            }}
            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            Desconectar Spreadsheet
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              Configuración de Google Sheets
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-gray-400 text-xl">&times;</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-700 flex gap-4">
          {[
            { id: 'connection', icon: Key, label: 'Conexión' },
            { id: 'sync', icon: RefreshCw, label: 'Sincronización' },
            { id: 'advanced', icon: Shield, label: 'Avanzado' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {activeTab === 'connection' && renderConnectionTab()}
          {activeTab === 'sync' && renderSyncTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SheetsConfigPanel;
