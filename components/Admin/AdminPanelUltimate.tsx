// ============================================
// LITPER PRO - ADMIN PANEL ULTIMATE
// Panel de administración unificado TOP MUNDIAL
// ============================================

import React, { useState, useEffect } from 'react';
import { AdminLayout, type AdminSection } from './AdminLayout';
import { CommandCenter } from './CommandCenter';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { IACopilot } from './IACopilot';
import { SemaforoInteligente } from './SemaforoInteligente';
import { ReportsStudio } from './ReportsStudio';
import { RulesEngine } from './RulesEngine';
import { FinanceDashboard } from './FinanceCenter';
import { SecurityDashboard } from './SecurityCenter';
import { CRMDashboard } from './CRMCenter';
import { AIConfigDashboard } from './AIConfigCenter';
import { isAuthenticated, getCurrentUser, logout } from '../../services/authService';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Zap,
  Loader2,
} from 'lucide-react';

// ============================================
// COMPONENTE DE LOGIN
// ============================================

interface LoginProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Importar el login del authService
      const { login } = await import('../../services/authService');
      const result = await login({ email, password });

      if (result.success) {
        onLogin();
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl shadow-2xl shadow-orange-500/30 mb-4">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">
            LITPER <span className="text-orange-500">PRO</span>
          </h1>
          <p className="text-slate-400 mt-1">Enterprise Admin Suite</p>
        </div>

        {/* Login Form */}
        <div className="bg-navy-800/50 backdrop-blur-xl rounded-3xl border border-navy-700 p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-navy-700/50 border border-navy-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-navy-700/50 border border-navy-600 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-navy-700">
            <p className="text-sm text-slate-400 text-center">
              ¿Olvidaste tu contraseña?{' '}
              <button className="text-orange-400 hover:text-orange-300 font-medium">
                Recuperar
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Litper Pro v2.0 • Enterprise Edition
        </p>
      </div>
    </div>
  );
};

// ============================================
// PLACEHOLDER COMPONENTS
// ============================================

const PlaceholderSection: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex items-center justify-center h-96 bg-navy-800/30 rounded-2xl border border-navy-700">
    <div className="text-center">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AdminPanelUltimate: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('command-center');
  const [isInitializing, setIsInitializing] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      setIsInitializing(false);
    };

    checkAuth();
  }, []);

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-white font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  // Main admin panel
  const renderContent = () => {
    switch (activeSection) {
      case 'command-center':
        return <CommandCenter />;
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'semaforo':
        return <SemaforoInteligente />;
      case 'finanzas':
        return <FinanceDashboard />;
      case 'reportes':
        return <ReportsStudio />;
      case 'ia-copilot':
        return <IACopilot />;
      case 'ia-config':
        return <AIConfigDashboard />;
      case 'seguridad':
        return <SecurityDashboard />;
      case 'crm':
        return <CRMDashboard />;
      case 'cargas':
        return <PlaceholderSection title="Gestión de Cargas" description="Administra tus cargas y guías" />;
      case 'guias':
        return <PlaceholderSection title="Gestión de Guías" description="Consulta y gestiona todas las guías" />;
      case 'marketing':
        return <PlaceholderSection title="Marketing Center" description="Gestiona tus campañas publicitarias" />;
      case 'soporte':
        return <PlaceholderSection title="Centro de Soporte" description="Gestiona tickets y atención al cliente" />;
      case 'integraciones':
        return <RulesEngine />;
      case 'usuarios':
        return <SecurityDashboard />;
      case 'configuracion':
        return <PlaceholderSection title="Configuración" description="Configura tu panel de administración" />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanelUltimate;
