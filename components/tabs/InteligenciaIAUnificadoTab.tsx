// components/tabs/InteligenciaIAUnificadoTab.tsx
// Tab unificado que combina: Asistente IA + Sistema ML + Ciudad IA + Predicciones + Priorización IA
import React, { useState, useMemo, useCallback } from 'react';
import {
  Brain,
  Bot,
  Globe,
  Target,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Cpu,
  Network,
  Lightbulb,
  Zap,
  BarChart3,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Settings,
  BookOpen,
  Activity,
  ListOrdered,
} from 'lucide-react';
import { Shipment } from '../../types';

// Importar componentes existentes
import AsistenteIAUnificado from './AsistenteIAUnificado';
import MLSystemTab from './MLSystemTab';
import CiudadAgentesTab from './CiudadAgentesTab';
import PrediccionesTab from './PrediccionesTab';
import { SmartPrioritizationPanel, AILearningPanel } from '../intelligence';

// =====================================
// TIPOS
// =====================================
type SubView = 'asistente' | 'prioridad' | 'predicciones' | 'ml' | 'aprendizaje' | 'agentes';

interface InteligenciaIAUnificadoTabProps {
  shipments: Shipment[];
  selectedCountry?: string;
}

// =====================================
// SUB-NAVEGACIÓN
// =====================================
const subNavItems: { id: SubView; label: string; icon: React.ElementType; description: string; gradient: string }[] = [
  {
    id: 'asistente',
    label: 'Asistente IA',
    icon: Bot,
    description: 'Chat inteligente',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    id: 'prioridad',
    label: 'Priorización',
    icon: ListOrdered,
    description: 'Guías prioritarias IA',
    gradient: 'from-red-500 to-rose-500'
  },
  {
    id: 'predicciones',
    label: 'Predicciones',
    icon: Target,
    description: 'Análisis predictivo',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'ml',
    label: 'Sistema ML',
    icon: Brain,
    description: 'Machine Learning',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'aprendizaje',
    label: 'Aprendizaje',
    icon: Sparkles,
    description: 'Entrenar modelo',
    gradient: 'from-pink-500 to-purple-500'
  },
  {
    id: 'agentes',
    label: 'Agentes IA',
    icon: Globe,
    description: 'IA por ciudad',
    gradient: 'from-emerald-500 to-teal-500'
  },
];

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const InteligenciaIAUnificadoTab: React.FC<InteligenciaIAUnificadoTabProps> = ({
  shipments,
  selectedCountry = 'CO',
}) => {
  const [activeView, setActiveView] = useState<SubView>('asistente');

  // Métricas de IA
  const aiMetrics = useMemo(() => {
    const total = shipments.length;
    const conNovedad = shipments.filter(s => s.status === 'issue').length;
    const enOficina = shipments.filter(s => s.status === 'in_office').length;
    const entregados = shipments.filter(s => s.status === 'delivered').length;

    // Predicción simple basada en patrones
    const tasaProblemas = total > 0 ? ((conNovedad + enOficina) / total) * 100 : 0;
    const prediccionRiesgo = tasaProblemas > 15 ? 'Alto' : tasaProblemas > 8 ? 'Medio' : 'Bajo';

    // Guías que la IA recomienda gestionar
    const recomendadasIA = conNovedad + enOficina;

    return {
      total,
      conNovedad,
      enOficina,
      entregados,
      tasaProblemas: Math.round(tasaProblemas * 10) / 10,
      prediccionRiesgo,
      recomendadasIA,
      tasaExito: total > 0 ? Math.round((entregados / total) * 100) : 0,
    };
  }, [shipments]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ====================================== */}
      {/* HEADER CON MÉTRICAS IA */}
      {/* ====================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-purple-500/20 overflow-hidden">
        {/* Título con efecto */}
        <div className="px-6 py-5 relative overflow-hidden">
          {/* Background animado */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Centro de Inteligencia IA
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                </h2>
                <p className="text-purple-200 text-sm">
                  Asistente inteligente, predicciones y aprendizaje automático
                </p>
              </div>
            </div>

            {/* Métricas IA */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Predicción de riesgo */}
              <div className={`px-4 py-2 rounded-xl backdrop-blur-sm ${
                aiMetrics.prediccionRiesgo === 'Alto'
                  ? 'bg-red-500/20 border border-red-500/30'
                  : aiMetrics.prediccionRiesgo === 'Medio'
                  ? 'bg-amber-500/20 border border-amber-500/30'
                  : 'bg-emerald-500/20 border border-emerald-500/30'
              }`}>
                <p className="text-xs text-white/60">Riesgo IA</p>
                <p className={`text-lg font-bold ${
                  aiMetrics.prediccionRiesgo === 'Alto' ? 'text-red-400' :
                  aiMetrics.prediccionRiesgo === 'Medio' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {aiMetrics.prediccionRiesgo}
                </p>
              </div>

              {/* Guías recomendadas */}
              {aiMetrics.recomendadasIA > 0 && (
                <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <p className="text-xs text-white/60">IA Recomienda</p>
                  <p className="text-lg font-bold text-purple-300">
                    {aiMetrics.recomendadasIA} guías
                  </p>
                </div>
              )}

              {/* Tasa éxito */}
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                <p className="text-xs text-white/60">Tasa Éxito</p>
                <p className="text-lg font-bold text-white">{aiMetrics.tasaExito}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-navegación con gradientes */}
        <div className="px-4 py-3 bg-black/30 border-t border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {subNavItems.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                    transition-all duration-300 whitespace-nowrap
                    ${isActive
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id === 'asistente' && aiMetrics.recomendadasIA > 0 && !isActive && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                      {aiMetrics.recomendadasIA}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* PANEL DE RECOMENDACIONES IA (Siempre visible) */}
      {/* ====================================== */}
      {aiMetrics.recomendadasIA > 0 && activeView !== 'asistente' && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Recomendación IA</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Hay <span className="font-bold text-amber-600">{aiMetrics.recomendadasIA} guías</span> que necesitan atención.
                  Usa el Asistente IA para gestionarlas eficientemente.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('asistente')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              <Bot className="w-4 h-4" />
              Ir al Asistente
            </button>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* CONTENIDO DINÁMICO */}
      {/* ====================================== */}
      <div className="min-h-[500px]">
        {activeView === 'asistente' && (
          <div className="animate-fade-in">
            <AsistenteIAUnificado shipments={shipments} />
          </div>
        )}

        {activeView === 'prioridad' && (
          <div className="animate-fade-in">
            <SmartPrioritizationPanel
              shipments={shipments}
              onCallGuide={(shipment) => {
                const phone = shipment.recipientPhone || shipment.senderPhone;
                if (phone) {
                  window.open(`tel:${phone}`, '_blank');
                }
              }}
              onWhatsAppGuide={(shipment) => {
                const phone = shipment.recipientPhone || shipment.senderPhone;
                if (phone) {
                  const message = encodeURIComponent(`Hola, le contactamos por su envío ${shipment.trackingNumber}`);
                  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                }
              }}
            />
          </div>
        )}

        {activeView === 'predicciones' && (
          <div className="animate-fade-in">
            <PrediccionesTab shipments={shipments} />
          </div>
        )}

        {activeView === 'ml' && (
          <div className="animate-fade-in">
            <MLSystemTab />
          </div>
        )}

        {activeView === 'aprendizaje' && (
          <div className="animate-fade-in">
            <AILearningPanel shipments={shipments} />
          </div>
        )}

        {activeView === 'agentes' && (
          <div className="animate-fade-in">
            <CiudadAgentesTab selectedCountry={selectedCountry} />
          </div>
        )}
      </div>

      {/* ====================================== */}
      {/* FOOTER CON CAPACIDADES IA */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-500" />
          Capacidades de IA Activas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: MessageCircle, label: 'Chat Inteligente', status: 'Activo', color: 'emerald' },
            { icon: Target, label: 'Predicción de Riesgo', status: 'Activo', color: 'emerald' },
            { icon: Brain, label: 'Aprendizaje ML', status: 'Entrenando', color: 'amber' },
            { icon: Network, label: 'Análisis de Patrones', status: 'Activo', color: 'emerald' },
          ].map((cap, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-navy-800 rounded-xl">
              <div className={`p-2 bg-${cap.color}-100 dark:bg-${cap.color}-900/30 rounded-lg`}>
                <cap.icon className={`w-4 h-4 text-${cap.color}-600 dark:text-${cap.color}-400`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{cap.label}</p>
                <p className={`text-xs text-${cap.color}-600 dark:text-${cap.color}-400`}>{cap.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteligenciaIAUnificadoTab;
