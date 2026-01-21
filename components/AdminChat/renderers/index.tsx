// ============================================
// RENDERIZADORES DE RESULTADOS - ADMIN CHAT
// ============================================

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight
} from 'lucide-react';
import { SkillResult, ActionButton, CardData, AlertData } from '../types';

// ============================================
// COMPONENTE PRINCIPAL DE RENDERIZADO
// ============================================

interface ResultRendererProps {
  result: SkillResult;
  onAction: (action: string, params?: Record<string, any>) => void;
}

export const ResultRenderer: React.FC<ResultRendererProps> = ({ result, onAction }) => {
  switch (result.type) {
    case 'text':
      return <TextRenderer content={result.content || ''} />;
    case 'card':
      return <CardRenderer data={result.data} title={result.title} actions={result.actions} onAction={onAction} />;
    case 'table':
      return <TableRenderer data={result.data} title={result.title} actions={result.actions} onAction={onAction} />;
    case 'report':
      return <ReportRenderer data={result.data} title={result.title} actions={result.actions} onAction={onAction} />;
    case 'list':
      return <ListRenderer data={result.data} title={result.title} actions={result.actions} onAction={onAction} />;
    case 'alert':
      return <AlertRenderer data={result.data} />;
    case 'chart':
      return <ChartRenderer data={result.data} title={result.title} />;
    default:
      return <TextRenderer content={JSON.stringify(result.data, null, 2)} />;
  }
};

// ============================================
// TEXTO SIMPLE
// ============================================

const TextRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Convertir markdown básico
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div
      className="text-slate-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
};

// ============================================
// TARJETA INDIVIDUAL
// ============================================

interface CardRendererProps {
  data: any;
  title?: string;
  actions?: ActionButton[];
  onAction: (action: string, params?: Record<string, any>) => void;
}

const CardRenderer: React.FC<CardRendererProps> = ({ data, title, actions, onAction }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30">
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Cards de métricas si existen */}
        {data.cards && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.cards.map((card: CardData, idx: number) => (
              <MetricCard key={idx} {...card} />
            ))}
          </div>
        )}

        {/* Contenido general */}
        {data.mensaje && <p className="text-slate-300">{data.mensaje}</p>}

        {/* Predicción si existe */}
        {data.prediccion && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Predicción ML</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {Math.round((data.prediccion.probabilidad_retraso || 0) * 100)}%
                </div>
                <div className="text-xs text-slate-500">Prob. Retraso</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${getRiskColor(data.prediccion.nivel_riesgo)}`}>
                  {data.prediccion.nivel_riesgo || 'N/A'}
                </div>
                <div className="text-xs text-slate-500">Nivel Riesgo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {data.prediccion.dias_estimados || data.prediccion.fecha_estimada || '-'}
                </div>
                <div className="text-xs text-slate-500">Días Est.</div>
              </div>
            </div>
          </div>
        )}

        {/* Factores de riesgo */}
        {data.factores && data.factores.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Factores de Riesgo</h4>
            <ul className="space-y-1">
              {data.factores.map((factor: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Acciones recomendadas */}
        {data.acciones && data.acciones.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Acciones Recomendadas</h4>
            <ul className="space-y-1">
              {data.acciones.map((accion: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-500" />
                  {accion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <ActionButtonComponent key={idx} action={action} onClick={onAction} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// MÉTRICA INDIVIDUAL
// ============================================

const MetricCard: React.FC<CardData> = ({ title, value, change, icon, color }) => {
  const colorClasses: Record<string, string> = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400'
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{title}</span>
        {icon && <span>{icon}</span>}
      </div>
      <div className={`text-xl font-bold ${colorClasses[color || 'blue']}`}>
        {value}
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-xs ${
          change.type === 'increase' ? 'text-green-400' :
          change.type === 'decrease' ? 'text-red-400' : 'text-slate-400'
        }`}>
          {change.type === 'increase' ? <TrendingUp className="w-3 h-3" /> :
           change.type === 'decrease' ? <TrendingDown className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          {change.value}%
        </div>
      )}
    </div>
  );
};

// ============================================
// TABLA
// ============================================

const TableRenderer: React.FC<CardRendererProps> = ({ data, title, actions, onAction }) => {
  const { headers, rows, cantidad, mensaje } = data;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30">
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
      )}

      <div className="p-4">
        {mensaje && <p className="text-slate-300 mb-4">{mensaje}</p>}

        {headers && rows ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {headers.map((header: string, idx: number) => (
                    <th key={idx} className="px-3 py-2 text-left text-slate-400 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row: any[], idx: number) => (
                  <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-2 text-slate-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <p className="text-center text-slate-500 text-sm mt-2">
                Mostrando 10 de {rows.length} registros
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            {cantidad !== undefined ? (
              <p className="text-lg">{cantidad} registros encontrados</p>
            ) : (
              <p>No hay datos para mostrar</p>
            )}
          </div>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <ActionButtonComponent key={idx} action={action} onClick={onAction} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// REPORTE
// ============================================

const ReportRenderer: React.FC<CardRendererProps> = ({ data, title, actions, onAction }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-orange-500/20 to-transparent">
          <h3 className="font-semibold text-white text-lg">{title}</h3>
          {data.periodo && (
            <p className="text-sm text-slate-400">Período: {data.periodo}</p>
          )}
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Cards de métricas */}
        {data.cards && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.cards.map((card: CardData, idx: number) => (
              <MetricCard key={idx} {...card} />
            ))}
          </div>
        )}

        {/* Resumen si existe */}
        {data.resumen && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-700/30 rounded-lg">
            <div>
              <div className="text-xs text-slate-500">Total Guías</div>
              <div className="text-xl font-bold text-white">{data.resumen.total_guias?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Entregadas</div>
              <div className="text-xl font-bold text-green-400">{data.resumen.entregadas?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Tasa Entrega</div>
              <div className="text-xl font-bold text-blue-400">{data.resumen.tasa_entrega || 0}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">En Retraso</div>
              <div className="text-xl font-bold text-orange-400">{data.resumen.en_retraso?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Con Novedad</div>
              <div className="text-xl font-bold text-yellow-400">{data.resumen.con_novedad?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Tasa Retraso</div>
              <div className="text-xl font-bold text-red-400">{data.resumen.tasa_retraso || 0}%</div>
            </div>
          </div>
        )}

        {/* KPIs si existen */}
        {data.kpis && (
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="text-sm font-medium text-slate-400 mb-3">KPIs Avanzados</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.kpis.otif !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{data.kpis.otif}%</div>
                  <div className="text-xs text-slate-500">OTIF Score</div>
                </div>
              )}
              {data.kpis.nps !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{data.kpis.nps}</div>
                  <div className="text-xs text-slate-500">NPS Logístico</div>
                </div>
              )}
              {data.kpis.eficiencia !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{data.kpis.eficiencia}%</div>
                  <div className="text-xs text-slate-500">Eficiencia Ruta</div>
                </div>
              )}
              {data.kpis.primera_entrega !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{data.kpis.primera_entrega}%</div>
                  <div className="text-xs text-slate-500">Primera Entrega</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transportadoras */}
        {data.transportadoras && data.transportadoras.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-3">Rendimiento por Transportadora</h4>
            <div className="space-y-2">
              {data.transportadoras.slice(0, 5).map((t: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                  <span className="text-white font-medium">{t.nombre}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">{t.total_guias || 0} guías</span>
                    <span className={`font-medium ${
                      (t.tasa_retraso || 0) < 10 ? 'text-green-400' :
                      (t.tasa_retraso || 0) < 20 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {t.tasa_retraso || 0}% retraso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Análisis IA */}
        {data.analisisIA && (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
            <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
              <span>🤖</span> Análisis IA
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">{data.analisisIA}</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <ActionButtonComponent key={idx} action={action} onClick={onAction} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// LISTA
// ============================================

const ListRenderer: React.FC<CardRendererProps> = ({ data, title, actions, onAction }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30">
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
      )}

      <div className="p-4">
        {/* Skills por categoría */}
        {data.categories && (
          <div className="space-y-4">
            {Object.entries(data.categories).map(([category, skills]: [string, any]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-slate-400 mb-2 capitalize">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {skills.map((skill: any) => (
                    <button
                      key={skill.name}
                      onClick={() => onAction('execute_skill', { skill: skill.name })}
                      className="flex items-center gap-3 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition text-left"
                    >
                      <span className="text-xl">{skill.icon}</span>
                      <div>
                        <div className="text-white font-medium">/{skill.name}</div>
                        <div className="text-xs text-slate-400">{skill.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alertas */}
        {data.alertas && (
          <div className="space-y-2">
            {data.alertas.map((alerta: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  alerta.severidad === 'CRITICA' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    alerta.severidad === 'CRITICA' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                  <span className="font-medium text-white">{alerta.titulo}</span>
                </div>
                {alerta.descripcion && (
                  <p className="text-sm text-slate-400 mt-1">{alerta.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Funcionalidades */}
        {data.funcionalidades && (
          <ul className="space-y-2">
            {data.funcionalidades.map((func: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {func}
              </li>
            ))}
          </ul>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <ActionButtonComponent key={idx} action={action} onClick={onAction} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// ALERTA
// ============================================

const AlertRenderer: React.FC<{ data: AlertData }> = ({ data }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const colors = {
    success: 'bg-green-500/10 border-green-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-blue-500/10 border-blue-500/30'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[data.type]}`}>
      <div className="flex items-start gap-3">
        {icons[data.type]}
        <div>
          <h4 className="font-medium text-white">{data.title}</h4>
          <p className="text-sm text-slate-300 mt-1">{data.message}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// GRÁFICO (Placeholder)
// ============================================

const ChartRenderer: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      {title && <h3 className="font-semibold text-white mb-4">{title}</h3>}
      <div className="h-48 flex items-center justify-center text-slate-500">
        📊 Gráfico disponible próximamente
      </div>
    </div>
  );
};

// ============================================
// BOTÓN DE ACCIÓN
// ============================================

interface ActionButtonProps {
  action: ActionButton;
  onClick: (action: string, params?: Record<string, any>) => void;
}

const ActionButtonComponent: React.FC<ActionButtonProps> = ({ action, onClick }) => {
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-slate-600 hover:bg-slate-500 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      onClick={() => onClick(action.action, action.params)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
        variants[action.variant || 'secondary']
      }`}
    >
      {action.label}
    </button>
  );
};

// ============================================
// UTILIDADES
// ============================================

function getRiskColor(level: string): string {
  switch (level?.toUpperCase()) {
    case 'BAJO': return 'text-green-400';
    case 'MEDIO': return 'text-yellow-400';
    case 'ALTO': return 'text-orange-400';
    case 'CRITICO': return 'text-red-400';
    default: return 'text-slate-400';
  }
}
