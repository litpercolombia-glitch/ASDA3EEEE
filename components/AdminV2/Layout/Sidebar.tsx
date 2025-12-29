/**
 * Sidebar - Barra lateral de navegacion
 * Con historial de conversaciones y acceso a modulos
 */

import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  MessageSquare,
  Plus,
  Settings,
  LogOut,
  Sparkles,
  History,
  LayoutDashboard,
  Package,
  DollarSign,
  BarChart3,
  Bell,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';
import { chatPersistence, ConversationSummary } from '../../../services/skillsV2/ChatPersistence';
import { Button } from '../UI/Button';

// ============================================
// TYPES
// ============================================

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onOpenSkillsStore: () => void;
  onLogout: () => void;
  currentConversationId?: string | null;
}

// ============================================
// COMPONENT
// ============================================

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onNewConversation,
  onSelectConversation,
  onOpenSkillsStore,
  onLogout,
  currentConversationId,
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const convos = await chatPersistence.getConversations(10);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
    setIsLoading(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await chatPersistence.deleteConversation(id);
    loadConversations();
    if (currentConversationId === id) {
      onNewConversation();
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} dias`;
    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  };

  // Styles
  const sidebarStyles: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: isOpen ? '280px' : '0',
    backgroundColor: colors.bg.secondary,
    borderRight: `1px solid ${colors.border.light}`,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 40,
    transition: `width ${transitions.slow}`,
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: `1px solid ${colors.border.light}`,
  };

  const logoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const logoIconStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: radius.lg,
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
  };

  const sectionStyles: React.CSSProperties = {
    padding: '0.75rem',
  };

  const sectionTitleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const conversationItemStyles = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    backgroundColor: isActive ? colors.brand.primary + '15' : 'transparent',
    border: `1px solid ${isActive ? colors.brand.primary + '30' : 'transparent'}`,
    borderRadius: radius.lg,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    marginBottom: '0.25rem',
  });

  const moduleItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: radius.lg,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    width: '100%',
    textAlign: 'left',
    color: colors.text.secondary,
  };

  const footerStyles: React.CSSProperties = {
    marginTop: 'auto',
    padding: '0.75rem',
    borderTop: `1px solid ${colors.border.light}`,
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          left: '1rem',
          top: '1rem',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem',
          backgroundColor: colors.bg.tertiary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radius.lg,
          color: colors.text.secondary,
          cursor: 'pointer',
          transition: `all ${transitions.fast}`,
        }}
      >
        <Menu size={20} />
      </button>
    );
  }

  return (
    <div style={sidebarStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={logoStyles}>
          <div style={logoIconStyles}>
            <Sparkles size={18} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text.primary }}>
              LitperPro
            </div>
            <div style={{ fontSize: '0.6875rem', color: colors.text.tertiary }}>
              Admin V2
            </div>
          </div>
        </div>
        <button
          onClick={onToggle}
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: radius.md,
            color: colors.text.tertiary,
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* New conversation button */}
      <div style={{ padding: '0.75rem' }}>
        <Button
          variant="primary"
          fullWidth
          icon={Plus}
          onClick={onNewConversation}
        >
          Nueva conversacion
        </Button>
      </div>

      {/* Conversations */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={sectionStyles}>
          <div style={sectionTitleStyles}>
            <History size={12} />
            Recientes
          </div>

          {isLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: colors.text.tertiary }}>
              Cargando...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: colors.text.tertiary, fontSize: '0.8125rem' }}>
              Sin conversaciones
            </div>
          ) : (
            conversations.map((convo) => (
              <div
                key={convo.id}
                style={conversationItemStyles(convo.id === currentConversationId)}
                onClick={() => onSelectConversation(convo.id)}
                onMouseEnter={(e) => {
                  if (convo.id !== currentConversationId) {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (convo.id !== currentConversationId) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <MessageSquare size={16} style={{ color: colors.text.tertiary, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: colors.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {convo.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: colors.text.tertiary,
                    }}
                  >
                    {formatDate(convo.updatedAt)} • {convo.messageCount} msgs
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, convo.id)}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: radius.sm,
                    color: colors.text.muted,
                    cursor: 'pointer',
                    opacity: 0,
                    transition: `opacity ${transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = colors.error.default;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modules */}
        <div style={sectionStyles}>
          <div style={sectionTitleStyles}>
            <LayoutDashboard size={12} />
            Modulos
          </div>

          <button
            style={moduleItemStyles}
            onClick={onOpenSkillsStore}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            <Sparkles size={16} style={{ color: colors.brand.secondary }} />
            <span style={{ fontSize: '0.8125rem' }}>Skills Store</span>
            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </button>

          <button
            style={moduleItemStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            <BarChart3 size={16} style={{ color: colors.skills.analytics.icon }} />
            <span style={{ fontSize: '0.8125rem' }}>Dashboard</span>
            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </button>

          <button
            style={moduleItemStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            <Package size={16} style={{ color: colors.skills.logistics.icon }} />
            <span style={{ fontSize: '0.8125rem' }}>Logistica</span>
            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </button>

          <button
            style={moduleItemStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            <DollarSign size={16} style={{ color: colors.skills.finance.icon }} />
            <span style={{ fontSize: '0.8125rem' }}>Finanzas</span>
            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyles}>
        <button
          style={{
            ...moduleItemStyles,
            marginBottom: '0.25rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Settings size={16} />
          <span style={{ fontSize: '0.8125rem' }}>Configuracion</span>
        </button>

        <button
          style={moduleItemStyles}
          onClick={onLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.error.light;
            e.currentTarget.style.color = colors.error.default;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.text.secondary;
          }}
        >
          <LogOut size={16} />
          <span style={{ fontSize: '0.8125rem' }}>Cerrar sesion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
