// components/auth/AuthCallback.tsx
// Callback OAuth real usando Supabase Auth — maneja el retorno de Google OAuth
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Package } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { handleSupabaseAuthCallback, isSupabaseConfigured } from '../../services/supabaseService';

export const AuthCallback: React.FC = () => {
  const { loginWithGoogle } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación con Google...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase no está configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en las variables de entorno de Vercel.');
        }

        setMessage('Verificando sesión con Google...');

        // Supabase lee el hash/code de la URL y resuelve la sesión automáticamente
        const userData = await handleSupabaseAuthCallback();

        if (!userData) {
          throw new Error('No se pudo obtener la sesión. Intenta iniciar sesión nuevamente.');
        }

        setMessage(`Bienvenido, ${userData.nombre}...`);

        await loginWithGoogle({
          email: userData.email,
          nombre: userData.nombre,
          avatar: userData.avatar,
        });

        setStatus('success');
        setMessage(`¡Bienvenido, ${userData.nombre}!`);

        setTimeout(() => {
          window.history.replaceState(null, '', '/');
          window.location.href = '/';
        }, 1500);
      } catch (err) {
        console.error('[AuthCallback] Error OAuth:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Error de autenticación con Google.');

        setTimeout(() => {
          window.history.replaceState(null, '', '/');
          window.location.href = '/';
        }, 4000);
      }
    };

    handleCallback();
  }, [loginWithGoogle]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
            <Package className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold text-white">LITPER PRO</span>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 w-full max-w-md">
          <div className="mb-6" aria-live="polite">
            {status === 'loading' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" aria-hidden="true" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" aria-hidden="true" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="mb-4 flex justify-center" aria-hidden="true">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>

          <h2 className={`text-xl font-semibold mb-2 ${
            status === 'success' ? 'text-emerald-400' :
            status === 'error' ? 'text-red-400' : 'text-white'
          }`}>
            {status === 'loading' && 'Autenticando con Google...'}
            {status === 'success' && '¡Autenticación exitosa!'}
            {status === 'error' && 'Error de autenticación'}
          </h2>

          <p className="text-white/50 text-sm">{message}</p>

          {status === 'loading' && (
            <div className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-label="Procesando...">
              <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          )}

          {status === 'error' && (
            <button
              onClick={() => { window.history.replaceState(null, '', '/'); window.location.href = '/'; }}
              className="mt-6 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-colors"
            >
              Volver al inicio de sesión
            </button>
          )}
        </div>

        <p className="mt-6 text-white/30 text-sm">
          {status === 'loading' ? 'Procesando...' : 'Redirigiendo automáticamente...'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
