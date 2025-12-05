/**
 * MLSystemTab.tsx
 * Tab integrador del sistema de Machine Learning.
 * Proporciona navegación entre las diferentes funcionalidades ML.
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
} from 'lucide-react';
import { PredictorRetrasos } from '../ml/PredictorRetrasos';
import { ChatInteligente } from '../ml/ChatInteligente';
import { DashboardML } from '../ml/DashboardML';
import { ExcelUploaderML } from '../ml/ExcelUploaderML';
import { checkBackendHealth } from '@/lib/api-config';

// Tipos de sub-tabs disponibles
type MLSubTab = 'dashboard' | 'predictor' | 'chat' | 'cargar';

// Configuración de las sub-tabs
const ML_SUBTABS = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Métricas y estadísticas',
    color: 'blue',
  },
  {
    id: 'predictor' as const,
    label: 'Predictor',
    icon: Target,
    description: 'Predecir retrasos',
    color: 'green',
  },
  {
    id: 'chat' as const,
    label: 'Chat IA',
    icon: MessageSquare,
    description: 'Consultas inteligentes',
    color: 'purple',
  },
  {
    id: 'cargar' as const,
    label: 'Cargar Datos',
    icon: Upload,
    description: 'Subir Excel',
    color: 'orange',
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

            {/* Estado del sistema - siempre positivo */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/30 rounded-full text-sm">
                <CheckCircle className="w-4 h-4" />
                Sistema Listo
              </span>
            </div>
          </div>

          {/* Sub-navegación */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {ML_SUBTABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
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
              );
            })}
          </div>
        </div>
      </div>


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
