// components/intelligence/SessionComparisonPanel.tsx
// Panel de Comparación de Sesiones - Muestra cambios entre días
import React, { useMemo, useState } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  MapPin,
  Truck,
  Phone,
  RefreshCw,
  Save,
  FolderOpen,
  Trash2,
  BarChart3,
  Activity,
} from 'lucide-react';
import {
  SessionComparison,
  LogisticsSession,
  StuckGuide,
  StatusChange,
  ResolvedGuide,
  SessionGuide,
  loadAllSessions,
  compareSessiones,
  getSessionInsights,
  getComparisonInsights,
  deleteSession,
} from '../../services/sessionComparisonService';

// ============================================
// INTERFACES
// ============================================

interface SessionComparisonPanelProps {
  currentSession?: LogisticsSession;
  onSelectSession?: (session: LogisticsSession) => void;
  onCompare?: (comparison: SessionComparison) => void;
}

// ============================================
// SUB-COMPONENTES
// ============================================

// Card de estadística
const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'amber' | 'blue' | 'purple';
  trend?: number;
  subtitle?: string;
}> = ({ label, value, icon, color, trend, subtitle }) => {
  const colors = {
    green: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-400',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color].split(' ').slice(0, 2).join(' ')} border ${colors[color].split(' ')[2]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-xl font-bold ${colors[color].split(' ')[3]}`}>{value}</span>
        {trend !== undefined && (
          <span className={`text-xs flex items-center ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};

// Lista de guías estancadas
const StuckGuidesList: React.FC<{ guides: StuckGuide[] }> = ({ guides }) => {
  const [expanded, setExpanded] = useState(false);
  const displayGuides = expanded ? guides : guides.slice(0, 3);

  const riskColors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="space-y-2">
      {displayGuides.map((stuck, i) => (
        <div key={i} className={`p-2 rounded-lg border ${riskColors[stuck.riskLevel]}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-sm text-white">{stuck.guide.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskColors[stuck.riskLevel]}`}>
              {stuck.riskLevel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{stuck.daysStuck} días sin cambio</span>
            <span>|</span>
            <span>{stuck.currentStatus}</span>
          </div>
        </div>
      ))}
      {guides.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Ver menos' : `Ver ${guides.length - 3} más`}
        </button>
      )}
    </div>
  );
};

// Lista de cambios de estado
const StatusChangesList: React.FC<{ changes: StatusChange[] }> = ({ changes }) => {
  const [expanded, setExpanded] = useState(false);
  const displayChanges = expanded ? changes : changes.slice(0, 5);

  return (
    <div className="space-y-2">
      {displayChanges.map((change, i) => (
        <div
          key={i}
          className={`p-2 rounded-lg border ${
            change.isPositive
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-slate-700/30 border-slate-600/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-sm text-white">{change.guide.id}</span>
            {change.isPositive ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-slate-500">{change.previousStatus}</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={change.isPositive ? 'text-emerald-400' : 'text-slate-300'}>
              {change.currentStatus}
            </span>
          </div>
        </div>
      ))}
      {changes.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Ver menos' : `Ver ${changes.length - 5} más`}
        </button>
      )}
    </div>
  );
};

// Lista de guías resueltas
const ResolvedGuidesList: React.FC<{ guides: ResolvedGuide[] }> = ({ guides }) => {
  const [expanded, setExpanded] = useState(false);
  const displayGuides = expanded ? guides : guides.slice(0, 3);

  const resolutionIcons = {
    DELIVERED: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    RETURNED: <XCircle className="w-4 h-4 text-red-400" />,
    OTHER: <Package className="w-4 h-4 text-slate-400" />,
  };

  return (
    <div className="space-y-2">
      {displayGuides.map((resolved, i) => (
        <div key={i} className="p-2 rounded-lg bg-slate-700/30 border border-slate-600/30">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-sm text-white">{resolved.guide.id}</span>
            {resolutionIcons[resolved.resolution]}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{resolved.previousStatus}</span>
            <ArrowRight className="w-3 h-3" />
            <span className={resolved.resolution === 'DELIVERED' ? 'text-emerald-400' : 'text-red-400'}>
              {resolved.resolution === 'DELIVERED' ? 'Entregado' : 'Devuelto'}
            </span>
            <span>|</span>
            <span>{resolved.daysToResolve}d</span>
          </div>
        </div>
      ))}
      {guides.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Ver menos' : `Ver ${guides.length - 3} más`}
        </button>
      )}
    </div>
  );
};

// Selector de sesión
const SessionSelector: React.FC<{
  sessions: LogisticsSession[];
  selectedId?: string;
  onSelect: (session: LogisticsSession) => void;
  onDelete: (sessionId: string) => void;
}> = ({ sessions, selectedId, onSelect, onDelete }) => {
  const [showAll, setShowAll] = useState(false);
  const displaySessions = showAll ? sessions : sessions.slice(0, 5);

  // Agrupar por fecha
  const groupedSessions = useMemo(() => {
    const grouped: Record<string, LogisticsSession[]> = {};
    displaySessions.forEach(s => {
      const dateKey = new Date(s.date).toLocaleDateString('es-CO');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(s);
    });
    return grouped;
  }, [displaySessions]);

  return (
    <div className="space-y-3">
      {Object.entries(groupedSessions).map(([date, dateSessions]) => (
        <div key={date}>
          <p className="text-[10px] text-slate-500 mb-1 px-1">{date}</p>
          <div className="space-y-1">
            {dateSessions.map(session => (
              <div
                key={session.id}
                className={`
                  p-2 rounded-lg cursor-pointer transition-all
                  ${selectedId === session.id
                    ? 'bg-amber-500/20 border border-amber-500/30'
                    : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                  }
                `}
                onClick={() => onSelect(session)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-white">{session.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">{session.stats.total} guías</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {session.stats.deliveryRate.toFixed(0)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {session.stats.withNovelty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sessions.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {showAll ? 'Ver menos' : `Ver todas (${sessions.length})`}
        </button>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-4 text-slate-500 text-xs">
          No hay sesiones guardadas
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const SessionComparisonPanel: React.FC<SessionComparisonPanelProps> = ({
  currentSession,
  onSelectSession,
  onCompare,
}) => {
  const [sessions, setSessions] = useState<LogisticsSession[]>(() => loadAllSessions());
  const [selectedPreviousSession, setSelectedPreviousSession] = useState<LogisticsSession | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'comparison'>('sessions');

  // Comparación entre sesiones
  const comparison = useMemo<SessionComparison | null>(() => {
    if (!currentSession || !selectedPreviousSession) return null;
    return compareSessiones(selectedPreviousSession, currentSession);
  }, [currentSession, selectedPreviousSession]);

  // Insights
  const currentInsights = useMemo(() => {
    if (!currentSession) return [];
    return getSessionInsights(currentSession);
  }, [currentSession]);

  const comparisonInsights = useMemo(() => {
    if (!comparison) return [];
    return getComparisonInsights(comparison);
  }, [comparison]);

  // Handlers
  const handleSelectPrevious = (session: LogisticsSession) => {
    setSelectedPreviousSession(session);
    setActiveTab('comparison');
    onCompare?.(compareSessiones(session, currentSession!));
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setSessions(loadAllSessions());
    if (selectedPreviousSession?.id === sessionId) {
      setSelectedPreviousSession(null);
    }
  };

  const handleRefreshSessions = () => {
    setSessions(loadAllSessions());
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Comparación de Sesiones</h3>
              <p className="text-xs text-slate-400">Analiza cambios entre días</p>
            </div>
          </div>
          <button
            onClick={handleRefreshSessions}
            className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats actuales */}
        {currentSession && (
          <div className="grid grid-cols-4 gap-2">
            <StatCard
              label="Total"
              value={currentSession.stats.total}
              icon={<Package className="w-3 h-3" />}
              color="blue"
            />
            <StatCard
              label="Entrega"
              value={`${currentSession.stats.deliveryRate.toFixed(0)}%`}
              icon={<CheckCircle className="w-3 h-3" />}
              color="green"
            />
            <StatCard
              label="Novedades"
              value={currentSession.stats.withNovelty}
              icon={<AlertTriangle className="w-3 h-3" />}
              color="amber"
            />
            <StatCard
              label="Oficina"
              value={currentSession.stats.inOffice}
              icon={<MapPin className="w-3 h-3" />}
              color="purple"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'sessions'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-3 h-3 inline mr-1" />
          Sesiones
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          disabled={!comparison}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
              : 'text-slate-400 hover:text-white disabled:opacity-50'
          }`}
        >
          <BarChart3 className="w-3 h-3 inline mr-1" />
          Comparación
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Selecciona una sesión anterior para comparar con la actual:
            </p>
            <SessionSelector
              sessions={sessions}
              selectedId={selectedPreviousSession?.id}
              onSelect={handleSelectPrevious}
              onDelete={handleDeleteSession}
            />
          </div>
        )}

        {activeTab === 'comparison' && comparison && (
          <div className="space-y-4">
            {/* Resumen de comparación */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-400" />
                Resumen de Cambios
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
                  <p className="text-lg font-bold text-emerald-400">+{comparison.summary.resolvedGuides}</p>
                  <p className="text-[10px] text-slate-400">Resueltas</p>
                </div>
                <div className="text-center p-2 bg-amber-500/10 rounded-lg">
                  <p className="text-lg font-bold text-amber-400">{comparison.summary.stuckGuides}</p>
                  <p className="text-[10px] text-slate-400">Estancadas</p>
                </div>
                <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                  <p className="text-lg font-bold text-blue-400">+{comparison.summary.newGuides}</p>
                  <p className="text-[10px] text-slate-400">Nuevas</p>
                </div>
              </div>
            </div>

            {/* Insights */}
            {comparisonInsights.length > 0 && (
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
                <h4 className="text-xs font-bold text-purple-400 mb-2">Insights</h4>
                <ul className="space-y-1">
                  {comparisonInsights.map((insight, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Guías estancadas */}
            {comparison.details.stuckGuides.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Guías Estancadas ({comparison.details.stuckGuides.length})
                </h4>
                <StuckGuidesList guides={comparison.details.stuckGuides} />
              </div>
            )}

            {/* Cambios de estado */}
            {comparison.details.statusChanges.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" />
                  Cambios de Estado ({comparison.details.statusChanges.length})
                </h4>
                <StatusChangesList changes={comparison.details.statusChanges} />
              </div>
            )}

            {/* Guías resueltas */}
            {comparison.details.resolvedGuides.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Resueltas ({comparison.details.resolvedGuides.length})
                </h4>
                <ResolvedGuidesList guides={comparison.details.resolvedGuides} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'comparison' && !comparison && (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecciona una sesión anterior para comparar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionComparisonPanel;
