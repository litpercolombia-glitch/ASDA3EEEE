// components/auth/AuthWrapper.tsx
// Componente wrapper que maneja el flujo de autenticación
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { Loader2 } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isChecking, setIsChecking] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
    // Pequeño delay para evitar flash de contenido
    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [checkAuth]);

  // Mostrar loading mientras verifica
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login o registro
  if (!isAuthenticated) {
    if (authView === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
  }

  // Si está autenticado, mostrar la aplicación
  return <>{children}</>;
};

export default AuthWrapper;
