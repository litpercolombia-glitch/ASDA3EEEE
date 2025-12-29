/**
 * Avatar - Componente de avatar profesional
 * Para usuarios y asistente IA
 */

import React from 'react';
import { Bot, User } from 'lucide-react';
import { colors, radius } from '../../../styles/theme';

// ============================================
// TYPES
// ============================================

export interface AvatarProps {
  type?: 'user' | 'assistant' | 'system';
  name?: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'busy';
}

// ============================================
// STYLES
// ============================================

const sizeConfig = {
  sm: { size: '2rem', fontSize: '0.75rem', iconSize: 14 },
  md: { size: '2.5rem', fontSize: '0.875rem', iconSize: 18 },
  lg: { size: '3rem', fontSize: '1rem', iconSize: 22 },
};

const typeStyles = {
  user: {
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
    color: '#FFFFFF',
  },
  assistant: {
    background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, #EC4899 100%)`,
    color: '#FFFFFF',
  },
  system: {
    background: colors.bg.elevated,
    color: colors.text.secondary,
  },
};

const statusColors = {
  online: colors.success.default,
  offline: colors.text.muted,
  busy: colors.warning.default,
};

// ============================================
// COMPONENT
// ============================================

export const Avatar: React.FC<AvatarProps> = ({
  type = 'user',
  name,
  image,
  size = 'md',
  showStatus = false,
  status = 'online',
}) => {
  const config = sizeConfig[size];
  const typeStyle = typeStyles[type];

  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const avatarStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: config.size,
    height: config.size,
    borderRadius: radius.full,
    background: typeStyle.background,
    color: typeStyle.color,
    fontSize: config.fontSize,
    fontWeight: 600,
    flexShrink: 0,
    overflow: 'hidden',
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const statusStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: size === 'sm' ? '0.5rem' : '0.625rem',
    height: size === 'sm' ? '0.5rem' : '0.625rem',
    borderRadius: radius.full,
    backgroundColor: statusColors[status],
    border: `2px solid ${colors.bg.primary}`,
  };

  const renderContent = () => {
    if (image) {
      return <img src={image} alt={name || 'Avatar'} style={imageStyles} />;
    }

    if (name) {
      return getInitials(name);
    }

    if (type === 'assistant') {
      return <Bot size={config.iconSize} />;
    }

    return <User size={config.iconSize} />;
  };

  return (
    <div style={avatarStyles}>
      {renderContent()}
      {showStatus && <span style={statusStyles} />}
    </div>
  );
};

// ============================================
// ASSISTANT AVATAR (Special styling)
// ============================================

export const AssistantAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const config = sizeConfig[size];

  const avatarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: config.size,
    height: config.size,
    borderRadius: radius.lg,
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
    color: '#FFFFFF',
    flexShrink: 0,
    boxShadow: `0 0 20px ${colors.brand.primary}40`,
  };

  return (
    <div style={avatarStyles}>
      <Bot size={config.iconSize} />
    </div>
  );
};

export default Avatar;
