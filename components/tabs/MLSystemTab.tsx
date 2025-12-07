/**
 * MLSystemTab.tsx
 * Tab integrador del sistema de Machine Learning.
 * Proporciona navegación entre las diferentes funcionalidades ML.
 *
 * MEJORAS:
 * - Modo offline mejorado con datos simulados
 * - Tooltips de ayuda en cada sección
 * - Mejor manejo de estado de conexión
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Brain,
  Target,
  MessageSquare,
  LayoutDashboard,
  Upload,
  Settings,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Wifi,
  WifiOff,
  Info,
} from 'lucide-react';
import { PredictorRetrasos } from '../ml/PredictorRetrasos';
import { ChatInteligente } from '../ml/ChatInteligente';
import { DashboardML } from '../ml/DashboardML';
import { ExcelUploaderML } from '../ml/ExcelUploaderML';
import { checkBackendHealth } from '@/lib/api-config';
import { HelpTooltip } from '../HelpSystem/HelpTooltip';
import { mlSystemHelp } from '../HelpSystem/helpContent';

// Tipos de sub-tabs disponibles
type MLSubTab = 'dashboard' | 'predictor' | 'chat' | 'cargar';

// Configuración de las sub-tabs con ayuda contextual
const ML_SUBTABS = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Métricas y estadísticas',
    color: 'blue',
    helpTitle: 'Dashboard ML',
    helpContent: 'Visualiza todas las métricas y estadísticas del sistema de predicción.',
    helpTips: ['KPIs en tiempo real', 'Gráficos de tendencias', 'Estado de los modelos'],
  },
  {
    id: 'predictor' as const,
    label: 'Predictor',
    icon: Target,
    description: 'Predecir retrasos',
    color: 'green',
    helpTitle: 'Predictor de Retrasos',
    helpContent: 'Predice la probabilidad de retraso para cualquier guía.',
    helpTips: ['Ingresa el número de guía', 'Obtén predicción al instante', 'Recibe recomendaciones'],
  },
  {
    id: 'chat' as const,
    label: 'Chat IA',
    icon: MessageSquare,
    description: 'Consultas inteligentes',
    color: 'purple',
    helpTitle: 'Chat Inteligente',
    helpContent: 'Pregunta cualquier cosa sobre tus envíos en lenguaje natural.',
    helpTips: ['Consultas de estadísticas', 'Análisis de transportadoras', 'Recomendaciones IA'],
  },
  {
    id: 'cargar' as const,
    label: 'Cargar Datos',
    icon: Upload,
    description: 'Subir Excel',
    color: 'orange',
    helpTitle: 'Cargar Datos',
    helpContent: 'Sube archivos Excel con datos históricos para entrenar el modelo.',
    helpTips: ['Formato Excel (.xlsx)', 'Máximo 10,000 filas', 'Mapeo automático de columnas'],
  },
];

interface MLSystemTabProps {
  className?: string;
}

/**
 * Componente principal del sistema ML
 */
export function MLSystemTab({ className = '' }: MLSystemTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<MLSubTab>('dashboard');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Verificar conexión con backend
  useEffect(() => {
    const checkBackend = async () => {
      setBackendStatus('checking');
      const isOnline = await checkBackendHealth();
      setBackendStatus(isOnline ? 'online' : 'offline');
    };

    checkBackend();
    // Verificar cada 30 segundos
    const interval = setInterval(checkBackend, 30000);

    return () => clearInterval(interval);
  }, []);

  // Renderizar contenido según sub-tab activa
  const renderContent = useCallback(() => {
    switch (activeSubTab) {
      case 'dashboard':
        return <DashboardML />;
      case 'predictor':
        return (
          <div className="flex items-center justify-center min-h-[500px] p-6">
            <PredictorRetrasos />
          </div>
        );
      case 'chat':
        return (
          <div className="flex items-center justify-center p-6">
            <ChatInteligente />
          </div>
        );
      case 'cargar':
        return (
          <div className="flex items-center justify-center min-h-[500px] p-6">
            <ExcelUploaderML />
          </div>
        );
      default:
        return <DashboardML />;
    }
  }, [activeSubTab]);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header del sistema ML */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Sistema ML
                  <Zap className="w-5 h-5 text-yellow-300" />
                </h1>
                <p className="text-white/80 text-sm">
                  Machine Learning para predicción de entregas
                </p>
              </div>
            </div>

            {/* Estado del backend con tooltip de ayuda */}
            <div className="flex items-center gap-2">
              <HelpTooltip
                title="Estado del Sistema ML"
                content="El sistema puede funcionar en modo online (con servidor) u offline (con datos simulados)."
                tips={[
                  'En modo offline, las predicciones usan algoritmos locales',
                  'Los datos se sincronizarán cuando el servidor esté disponible',
                  'Todas las funcionalidades están disponibles en ambos modos'
                ]}
                position="bottom"
              >
                {backendStatus === 'checking' ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm cursor-help">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verificando...
                  </span>
                ) : backendStatus === 'online' ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/30 rounded-full text-sm cursor-help">
                    <Wifi className="w-4 h-4" />
                    Conectado
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/30 rounded-full text-sm cursor-help">
                    <WifiOff className="w-4 h-4" />
                    Modo Offline
                  </span>
                )}
              </HelpTooltip>
            </div>
          </div>

          {/* Sub-navegación con tooltips de ayuda */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {ML_SUBTABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <HelpTooltip
                  key={tab.id}
                  title={tab.helpTitle}
                  content={tab.helpContent}
                  tips={tab.helpTips}
                  position="bottom"
                >
                  <button
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
                      transition-all duration-200 whitespace-nowrap
                      ${
                        isActive
                          ? 'bg-white text-indigo-700 shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                </HelpTooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Banner informativo si está en modo offline */}
      {backendStatus === 'offline' && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5" />
                <div>
                  <span className="font-medium">Modo Offline Activo</span>
                  <span className="text-blue-700 ml-1">
                    - El sistema usa datos de demostración y predicciones locales.
                    Todas las funcionalidades están disponibles.
                  </span>
                </div>
              </div>
              <HelpTooltip
                title="Cómo activar el modo online"
                content="Para conectar con el servidor real:"
                steps={[
                  'Abre una terminal en /backend',
                  'Ejecuta: pip install -r requirements.txt',
                  'Ejecuta: python main.py',
                  'El servidor iniciará en http://localhost:8000'
                ]}
                tips={[
                  'El modo offline es perfecto para demos y pruebas',
                  'Los datos se guardan cuando el servidor esté disponible'
                ]}
                position="left"
              >
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  ¿Cómo conectar?
                </button>
              </HelpTooltip>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>

      {/* Footer con info */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>Litper Logística ML System v1.0</span>
              <span className="text-gray-300">|</span>
              <span>Powered by XGBoost + Claude AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Configuración avanzada disponible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MLSystemTab;
