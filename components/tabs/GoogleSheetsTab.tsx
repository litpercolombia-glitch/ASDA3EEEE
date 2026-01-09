// components/tabs/GoogleSheetsTab.tsx
// Tab principal para integración con Google Sheets

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  Table2,
  RefreshCw,
  Link,
  Unlink,
  Upload,
  Download,
  Settings,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Zap,
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  MapPin,
  Bell,
  Copy,
  Play,
  History,
  Sparkles,
  BookOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import googleSheetsService, {
  SHEET_TEMPLATES,
  PREDEFINED_FORMULAS,
} from '../../services/googleSheetsService';
import {
  GoogleSheetsConfig,
  SyncResult,
  SyncHistory,
  SheetTemplate,
  PredefinedFormula,
  SpreadsheetInfo,
} from '../../types/googleSheets.types';
import { Shipment } from '../../types';
import { cargaService } from '../../services/cargaService';

// ==================== TIPOS LOCALES ====================

interface TabProps {
  shipments?: Shipment[];
  onRefresh?: () => void;
}

type ViewMode = 'dashboard' | 'sync' | 'templates' | 'formulas' | 'history';

// ==================== COMPONENTE PRINCIPAL ====================

const GoogleSheetsTab: React.FC<TabProps> = ({ shipments = [], onRefresh }) => {
  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SheetTemplate | null>(null);
  const [expandedFormulas, setExpandedFormulas] = useState<Set<string>>(new Set());

  // Cargar configuración inicial
  useEffect(() => {
    const savedConfig = googleSheetsService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      setIsConnected(savedConfig.isConnected);
      setSpreadsheetId(savedConfig.spreadsheetId);
    }
    setSyncHistory(googleSheetsService.getSyncHistory());
  }, []);

  // ==================== HANDLERS ====================

  const handleConnect = async () => {
    if (!spreadsheetId.trim()) {
      setError('Ingresa el ID del spreadsheet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await googleSheetsService.connect(spreadsheetId);
      setSpreadsheetInfo(info);
      setIsConnected(true);
      setConfig(googleSheetsService.getConfig());
    } catch (err) {
      setError(`Error al conectar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await googleSheetsService.disconnect();
    setIsConnected(false);
    setConfig(null);
    setSpreadsheetInfo(null);
    setSpreadsheetId('');
  };

  const handleSyncEnvios = async () => {
    if (!config?.spreadsheetId) return;

    setIsSyncing(true);
    setError(null);

    try {
      // Convertir shipments al formato de Google Sheets
      const enviosData = shipments.map(s => ({
        numeroGuia: s.id,
        transportadora: s.carrier,
        estado: s.status,
        ciudadDestino: s.detailedInfo?.destination || '',
        diasTransito: s.detailedInfo?.daysInTransit || 0,
        nombreCliente: '',
        telefono: s.phone || '',
        valorDeclarado: s.detailedInfo?.declaredValue || 0,
        tieneNovedad: s.status === 'Novedad',
        tipoNovedad: '',
        nivelRiesgo: s.riskAnalysis?.level || 'NORMAL',
        fechaCarga: s.dateKey,
        ultimaActualizacion: new Date().toISOString(),
      }));

      const result = await googleSheetsService.syncEnvios(enviosData);
      setLastSyncResult(result);
      setSyncHistory(googleSheetsService.getSyncHistory());

      if (!result.success) {
        setError('Algunos envíos no se sincronizaron correctamente');
      }
    } catch (err) {
      setError(`Error en sincronización: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncDashboard = async () => {
    if (!config?.spreadsheetId) return;

    setIsSyncing(true);
    setError(null);

    try {
      // Calcular métricas
      const total = shipments.length;
      const entregados = shipments.filter(s => s.status === 'Entregado').length;
      const enTransito = shipments.filter(s => ['En Reparto', 'En Tránsito', 'Pendiente'].includes(s.status)).length;
      const novedades = shipments.filter(s => s.status === 'Novedad').length;
      const devueltos = 0; // Ajustar según tu lógica

      const metrics = {
        totalEnvios: total,
        entregados,
        enTransito,
        novedades,
        devueltos,
        tasaExito: total > 0 ? (entregados / total) * 100 : 0,
        diasPromedioEntrega: 3.5, // Calcular según datos reales
        valorEnRiesgo: 0, // Calcular según datos reales
        topCiudadesProblematicas: [],
        rendimientoTransportadoras: [],
      };

      await googleSheetsService.updateDashboard(metrics);
      setLastSyncResult({
        success: true,
        direction: 'to_sheets',
        rowsProcessed: 1,
        rowsCreated: 1,
        rowsUpdated: 0,
        rowsSkipped: 0,
        errors: [],
        duration: 0,
        timestamp: new Date(),
      });
    } catch (err) {
      setError(`Error actualizando dashboard: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyTemplate = async (template: SheetTemplate) => {
    if (!config?.spreadsheetId) return;

    setIsLoading(true);
    setError(null);

    try {
      await googleSheetsService.createFromTemplate(template);
      setSelectedTemplate(null);
    } catch (err) {
      setError(`Error aplicando plantilla: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
  };

  const toggleFormulaExpand = (id: string) => {
    const newExpanded = new Set(expandedFormulas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFormulas(newExpanded);
  };

  const openSpreadsheet = () => {
    if (config?.spreadsheetUrl) {
      window.open(config.spreadsheetUrl, '_blank');
    }
  };

  // ==================== RENDERS ====================

  const renderConnectionPanel = () => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-500/20' : 'bg-gray-700'}`}>
            <Sheet className={`w-6 h-6 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Google Sheets</h3>
            <p className="text-sm text-gray-400">
              {isConnected ? config?.spreadsheetName : 'No conectado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <button
                onClick={openSpreadsheet}
                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                title="Abrir en Google Sheets"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                title="Desconectar"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">ID del Spreadsheet</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Encuentra el ID en la URL de tu Google Sheet
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading || !spreadsheetId.trim()}
            className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            Conectar
          </button>
        </div>
      )}

      {isConnected && spreadsheetInfo && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Hojas:</span>
              <span className="text-white ml-2">{spreadsheetInfo.sheets.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Última sync:</span>
              <span className="text-white ml-2">
                {config?.lastSync
                  ? new Date(config.lastSync).toLocaleTimeString()
                  : 'Nunca'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {spreadsheetInfo.sheets.map((sheet) => (
              <span
                key={sheet.sheetId}
                className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
              >
                {sheet.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );

  const renderSyncPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Sync Envíos */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">Sincronizar Envíos</h4>
            <p className="text-xs text-gray-400">{shipments.length} envíos disponibles</p>
          </div>
        </div>
        <button
          onClick={handleSyncEnvios}
          disabled={isSyncing || !isConnected || shipments.length === 0}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Sincronizar Envíos
        </button>
      </div>

      {/* Sync Dashboard */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">Actualizar Dashboard</h4>
            <p className="text-xs text-gray-400">Métricas y KPIs en tiempo real</p>
          </div>
        </div>
        <button
          onClick={handleSyncDashboard}
          disabled={isSyncing || !isConnected}
          className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          Actualizar Dashboard
        </button>
      </div>

      {/* Sync Ciudades */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <MapPin className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">Sincronizar Ciudades</h4>
            <p className="text-xs text-gray-400">Estadísticas por ciudad</p>
          </div>
        </div>
        <button
          disabled={isSyncing || !isConnected}
          className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Sincronizar Ciudades
        </button>
      </div>

      {/* Sync Alertas */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">Sincronizar Alertas</h4>
            <p className="text-xs text-gray-400">Alertas activas del sistema</p>
          </div>
        </div>
        <button
          disabled={isSyncing || !isConnected}
          className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Sincronizar Alertas
        </button>
      </div>
    </div>
  );

  const renderTemplatesPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Plantillas Disponibles</h3>
        <span className="text-sm text-gray-400">{SHEET_TEMPLATES.length} plantillas</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SHEET_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{template.name}</h4>
                <span className="text-xs text-gray-500 capitalize">{template.category}</span>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">{template.description}</p>

            <div className="flex flex-wrap gap-1 mb-4">
              {template.sheets.map((sheet) => (
                <span
                  key={sheet.name}
                  className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400"
                >
                  {sheet.name}
                </span>
              ))}
            </div>

            <button
              onClick={() => handleApplyTemplate(template)}
              disabled={!isConnected || isLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Aplicar Plantilla
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFormulasPanel = () => {
    const categories = [...new Set(PREDEFINED_FORMULAS.map(f => f.category))];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Fórmulas Predefinidas</h3>
          <span className="text-sm text-gray-400">{PREDEFINED_FORMULAS.length} fórmulas</span>
        </div>

        {categories.map((category) => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              {category}
            </h4>

            {PREDEFINED_FORMULAS.filter(f => f.category === category).map((formula) => (
              <div
                key={formula.id}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleFormulaExpand(formula.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium text-white">{formula.name}</span>
                  </div>
                  {expandedFormulas.has(formula.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {expandedFormulas.has(formula.id) && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-700">
                    <p className="text-sm text-gray-400 pt-3">{formula.description}</p>

                    <div className="bg-gray-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Fórmula</span>
                        <button
                          onClick={() => copyFormula(formula.formula)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Copiar fórmula"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                      <code className="text-sm text-green-400 font-mono break-all">
                        {formula.formula}
                      </code>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-3">
                      <span className="text-xs text-gray-500 block mb-2">Ejemplo</span>
                      <code className="text-sm text-blue-400 font-mono">{formula.example}</code>
                    </div>

                    {formula.parameters.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-2">Parámetros</span>
                        <div className="space-y-1">
                          {formula.parameters.map((param) => (
                            <div key={param.name} className="flex items-center gap-2 text-sm">
                              <code className="text-yellow-400">{`{${param.name}}`}</code>
                              <span className="text-gray-500">-</span>
                              <span className="text-gray-400">{param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderHistoryPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Historial de Sincronización</h3>
        {syncHistory.length > 0 && (
          <button
            onClick={() => {
              googleSheetsService.clearSyncHistory();
              setSyncHistory([]);
            }}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Limpiar historial
          </button>
        )}
      </div>

      {syncHistory.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay historial de sincronización</p>
        </div>
      ) : (
        <div className="space-y-2">
          {syncHistory.slice().reverse().map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {entry.result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <span className="font-medium text-white">{entry.sheetName}</span>
                  <div className="text-sm text-gray-400">
                    {entry.result.rowsCreated} filas • {entry.result.duration}ms
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <span className={`text-xs ${
                  entry.result.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {entry.result.success ? 'Exitoso' : 'Error'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLastSyncResult = () => {
    if (!lastSyncResult) return null;

    return (
      <div className={`p-4 rounded-lg mb-4 ${
        lastSyncResult.success
          ? 'bg-green-500/20 border border-green-500/50'
          : 'bg-red-500/20 border border-red-500/50'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {lastSyncResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={`font-medium ${
            lastSyncResult.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {lastSyncResult.success ? 'Sincronización exitosa' : 'Error en sincronización'}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {lastSyncResult.rowsCreated} filas creadas • {lastSyncResult.duration}ms
        </div>
      </div>
    );
  };

  // ==================== RENDER PRINCIPAL ====================

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sheet className="w-7 h-7 text-green-400" />
            Google Sheets
          </h1>
          <p className="text-gray-400 mt-1">
            Conecta y sincroniza tus datos con Google Sheets
          </p>
        </div>

        {isConnected && (
          <button
            onClick={openSpreadsheet}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Spreadsheet
          </button>
        )}
      </div>

      {/* Panel de conexión */}
      {renderConnectionPanel()}

      {/* Navegación de vistas */}
      {isConnected && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'sync', icon: RefreshCw, label: 'Sincronizar' },
              { id: 'templates', icon: FileSpreadsheet, label: 'Plantillas' },
              { id: 'formulas', icon: Sparkles, label: 'Fórmulas' },
              { id: 'history', icon: History, label: 'Historial' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  viewMode === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Resultado última sync */}
          {renderLastSyncResult()}

          {/* Contenido según vista */}
          {viewMode === 'dashboard' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Dashboard de Métricas</h3>
              <p className="text-gray-400 mb-4">
                Visualiza tus métricas directamente en Google Sheets con gráficos y fórmulas automáticas.
              </p>
              <button
                onClick={handleSyncDashboard}
                disabled={isSyncing}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Actualizar Dashboard
              </button>
            </div>
          )}
          {viewMode === 'sync' && renderSyncPanel()}
          {viewMode === 'templates' && renderTemplatesPanel()}
          {viewMode === 'formulas' && renderFormulasPanel()}
          {viewMode === 'history' && renderHistoryPanel()}
        </>
      )}

      {/* Guía de inicio si no está conectado */}
      {!isConnected && (
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Guía de Inicio Rápido</h3>
          </div>

          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <div>
                <strong>Crea un nuevo Google Spreadsheet</strong>
                <p className="text-sm text-gray-400">Ve a sheets.google.com y crea un nuevo documento</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <div>
                <strong>Copia el ID del spreadsheet</strong>
                <p className="text-sm text-gray-400">Está en la URL: docs.google.com/spreadsheets/d/<span className="text-yellow-400">[ID_AQUÍ]</span>/edit</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <div>
                <strong>Pega el ID arriba y conecta</strong>
                <p className="text-sm text-gray-400">Una vez conectado, podrás sincronizar tus envíos automáticamente</p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsTab;
