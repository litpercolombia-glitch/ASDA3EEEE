/**
 * AdminPanelV2Pro - Panel de administracion profesional
 *
 * Nueva version del panel con:
 * - Interfaz de chat nivel Claude.ai
 * - Skills Store visual
 * - Command Palette (Ctrl+K)
 * - Persistencia en Supabase
 * - Integracion con IA (Claude/Gemini)
 * - Dark theme profesional azul/purpura
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Loader2,
  Command,
} from 'lucide-react';
import { colors, radius, transitions } from '../../styles/theme';

// Layout components
import { Sidebar } from './Layout/Sidebar';
import { CommandPalette } from './Layout/CommandPalette';

// Chat components
import { ChatInterfaceV2 } from './Chat/ChatInterfaceV2';

// Skills components
import { SkillsStore } from './Skills/SkillsStore';
import { Skill } from './skills/types';
import SkillsRegistry from './skills/SkillsRegistry';

// Services
import { chatPersistence } from '../../services/skillsV2/ChatPersistence';

// Import all skills to register them
import './skills/logistics/TrackShipment.skill';
import './skills/logistics/GenerateReport.skill';
import './skills/logistics/BulkStatusUpdate.skill';
import './skills/logistics/AnalyzeCarrier.skill';
import './skills/logistics/CreateTicket.skill';
import './skills/logistics/CityAnalysis.skill';
import './skills/logistics/ProblemsDetection.skill';
import './skills/finance/FinancialReport.skill';
import './skills/finance/ProfitAnalysis.skill';
import './skills/analytics/DashboardMetrics.skill';
import './skills/analytics/TrendAnalysis.skill';
import './skills/automation/ScheduleTask.skill';
import './skills/communication/SendWhatsApp.skill';

// ============================================
// AUTHENTICATION SCREEN
// ============================================

interface AuthScreenProps {
  onAuthenticate: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticate }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 500));

    // TODO: Replace with Supabase auth
    if (password === 'litperpro2024') {
      localStorage.setItem('admin_v2_token', 'authenticated');
      onAuthenticate();
    } else {
      setError('Contrasena incorrecta');
    }

    setIsLoading(false);
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: `linear-gradient(135deg, ${colors.bg.primary} 0%, ${colors.bg.secondary} 100%)`,
  };

  const cardStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius['2xl'],
    border: `1px solid ${colors.border.default}`,
  };

  const logoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '4rem',
    height: '4rem',
    margin: '0 auto 1.5rem',
    borderRadius: radius.xl,
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    backgroundColor: colors.bg.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: radius.lg,
    fontSize: '0.9375rem',
    color: colors.text.primary,
    outline: 'none',
    transition: `all ${transitions.normal}`,
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem',
    backgroundColor: colors.brand.primary,
    border: 'none',
    borderRadius: radius.lg,
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#FFFFFF',
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  };

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <div style={logoStyles}>
          <Shield size={32} style={{ color: '#FFFFFF' }} />
        </div>

        <h1
          style={{
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: colors.text.primary,
            marginBottom: '0.5rem',
          }}
        >
          Admin Panel V2
        </h1>
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: colors.text.secondary,
            marginBottom: '2rem',
          }}
        >
          Interfaz de administracion con IA
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Lock
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.text.tertiary,
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contrasena"
              style={inputStyles}
              autoFocus
            />
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                backgroundColor: colors.error.light,
                border: `1px solid ${colors.error.default}40`,
                borderRadius: radius.lg,
                fontSize: '0.875rem',
                color: colors.error.default,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            style={{
              ...buttonStyles,
              opacity: isLoading || !password ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Unlock size={18} />
                Acceder
              </span>
            )}
          </button>
        </form>

        <p
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: colors.text.muted,
          }}
        >
          Presiona <kbd style={{ padding: '0.125rem 0.375rem', backgroundColor: colors.bg.secondary, borderRadius: radius.sm }}>Ctrl+K</kbd> para acceso rapido
        </p>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AdminPanelV2Pro: React.FC = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [skillsStoreOpen, setSkillsStoreOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Chat state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0); // Force re-render chat

  // Check existing auth
  useEffect(() => {
    const token = localStorage.getItem('admin_v2_token');
    if (token === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (commandPaletteOpen) setCommandPaletteOpen(false);
        if (skillsStoreOpen) setSkillsStoreOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, skillsStoreOpen]);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('admin_v2_token');
    setIsAuthenticated(false);
  };

  const handleNewConversation = useCallback(async () => {
    const newConvo = await chatPersistence.createConversation();
    setCurrentConversationId(newConvo.id);
    setChatKey((prev) => prev + 1);
  }, []);

  const handleSelectConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id);
    setChatKey((prev) => prev + 1);
  }, []);

  const handleSelectSkill = useCallback((skill: Skill, example?: string) => {
    setSkillsStoreOpen(false);
    setCommandPaletteOpen(false);

    // TODO: Send to chat
    if (example) {
      // Would need to pass this to chat somehow
      console.log('Selected skill with example:', skill.id, example);
    }
  }, []);

  // Auth screen
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  // Main layout styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    backgroundColor: colors.bg.primary,
    overflow: 'hidden',
  };

  const mainStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginLeft: sidebarOpen ? '280px' : '0',
    transition: `margin-left ${transitions.slow}`,
    minWidth: 0,
  };

  return (
    <div style={containerStyles}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onOpenSkillsStore={() => setSkillsStoreOpen(true)}
        onLogout={handleLogout}
        currentConversationId={currentConversationId}
      />

      {/* Main content */}
      <div style={mainStyles}>
        {/* Chat Interface */}
        <ChatInterfaceV2
          key={chatKey}
          userId="admin"
          onOpenSkillsStore={() => setSkillsStoreOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
      </div>

      {/* Skills Store Modal */}
      <SkillsStore
        isOpen={skillsStoreOpen}
        onClose={() => setSkillsStoreOpen(false)}
        onSelectSkill={handleSelectSkill}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectSkill={handleSelectSkill}
      />

      {/* Keyboard hint */}
      {!commandPaletteOpen && !skillsStoreOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: colors.bg.tertiary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            fontSize: '0.75rem',
            color: colors.text.muted,
            zIndex: 10,
          }}
        >
          <Command size={12} />
          <span>K</span>
          <span style={{ color: colors.text.muted }}>para buscar</span>
        </div>
      )}
    </div>
  );
};

export default AdminPanelV2Pro;
