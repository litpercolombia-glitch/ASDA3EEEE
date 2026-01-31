// components/auth/AuthCallback.tsx
// Página de callback para OAuth (Google, Microsoft, Apple)
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Package } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

type OAuthProvider = 'google' | 'microsoft' | 'apple';

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

interface UserInfo {
  email: string;
  name: string;
  picture?: string;
  provider: OAuthProvider;
}

export const AuthCallback: React.FC = () => {
  const { login } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');
  const [provider, setProvider] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state') as OAuthProvider;
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Error de autenticación: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Parámetros de autenticación inválidos');
        }

        setProvider(state);
        setMessage(`Conectando con ${state.charAt(0).toUpperCase() + state.slice(1)}...`);

        // Intercambiar código por token
        const tokenData = await exchangeCodeForToken(code, state);

        setMessage('Obteniendo información del usuario...');

        // Obtener información del usuario
        const userInfo = await getUserInfo(tokenData, state);

        setMessage('Iniciando sesión...');

        // Iniciar sesión en la app
        await login({
          email: userInfo.email,
          password: 'oauth_authenticated',
          provider: state,
          oauthData: {
            name: userInfo.name,
            picture: userInfo.picture,
            accessToken: tokenData.access_token,
          }
        });

        setStatus('success');
        setMessage(`¡Bienvenido, ${userInfo.name}!`);

        // Redirigir al dashboard después de 1.5 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Error de autenticación');

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleCallback();
  }, [login]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
      {/* Aurora background simplificado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
            <Package className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">LITPER PRO</span>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 w-full max-w-md">
          {/* Icon */}
          <div className="mb-6">
            {status === 'loading' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center animate-shake">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            )}
          </div>

          {/* Provider logo */}
          {provider && (
            <div className="mb-4 flex justify-center">
              {provider === 'google' && (
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {provider === 'microsoft' && (
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                  <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
              )}
              {provider === 'apple' && (
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
            </div>
          )}

          {/* Message */}
          <h2 className={`text-xl font-semibold mb-2 ${
            status === 'success' ? 'text-emerald-400' :
            status === 'error' ? 'text-red-400' : 'text-white'
          }`}>
            {status === 'loading' && 'Autenticando...'}
            {status === 'success' && '¡Autenticación exitosa!'}
            {status === 'error' && 'Error de autenticación'}
          </h2>

          <p className="text-white/50">{message}</p>

          {/* Progress bar para loading */}
          {status === 'loading' && (
            <div className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full animate-progress" />
            </div>
          )}

          {/* Botón de retry para error */}
          {status === 'error' && (
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-colors"
            >
              Volver al inicio de sesión
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-white/30 text-sm">
          Redirigiendo automáticamente...
        </p>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// Función para intercambiar código por token
async function exchangeCodeForToken(code: string, provider: OAuthProvider): Promise<OAuthTokenResponse> {
  // IMPORTANTE: En producción, esto debe hacerse desde el backend por seguridad
  // El client_secret NUNCA debe estar en el frontend
  // Esta es una implementación simplificada para demostración

  const response = await fetch('/api/auth/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      provider,
      redirect_uri: `${window.location.origin}/auth/callback`,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener token de acceso');
  }

  return response.json();
}

// Función para obtener información del usuario
async function getUserInfo(tokenData: OAuthTokenResponse, provider: OAuthProvider): Promise<UserInfo> {
  const userInfoEndpoints = {
    google: 'https://www.googleapis.com/oauth2/v2/userinfo',
    microsoft: 'https://graph.microsoft.com/v1.0/me',
    apple: null, // Apple envía la info en el id_token
  };

  if (provider === 'apple' && tokenData.id_token) {
    // Decodificar JWT de Apple
    const payload = JSON.parse(atob(tokenData.id_token.split('.')[1]));
    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      provider: 'apple',
    };
  }

  const endpoint = userInfoEndpoints[provider];
  if (!endpoint) {
    throw new Error('Proveedor no soportado');
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener información del usuario');
  }

  const data = await response.json();

  // Normalizar respuesta según proveedor
  if (provider === 'google') {
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      provider: 'google',
    };
  }

  if (provider === 'microsoft') {
    return {
      email: data.mail || data.userPrincipalName,
      name: data.displayName,
      provider: 'microsoft',
    };
  }

  throw new Error('Proveedor no soportado');
}

export default AuthCallback;
