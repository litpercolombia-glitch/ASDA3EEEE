/**
 * TypingIndicator - Indicador de escritura estilo Claude
 * Tres puntos animados con efecto de onda
 */

import React from 'react';
import { colors, radius } from '../../../styles/theme';
import { AssistantAvatar } from '../UI/Avatar';

// ============================================
// KEYFRAMES
// ============================================

const dotKeyframes = `
@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
`;

// ============================================
// COMPONENT
// ============================================

export const TypingIndicator: React.FC = () => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1rem',
  };

  const bubbleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '1rem 1.25rem',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    borderTopLeftRadius: radius.sm,
  };

  const dotStyles = (delay: number): React.CSSProperties => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: colors.brand.primary,
    animation: `typingDot 1.4s infinite ease-in-out`,
    animationDelay: `${delay}s`,
  });

  return (
    <>
      <style>{dotKeyframes}</style>
      <div style={containerStyles}>
        <AssistantAvatar size="md" />
        <div style={bubbleStyles}>
          <span style={dotStyles(0)} />
          <span style={dotStyles(0.2)} />
          <span style={dotStyles(0.4)} />
        </div>
      </div>
    </>
  );
};

// ============================================
// THINKING INDICATOR (más elaborado)
// ============================================

const pulseKeyframes = `
@keyframes thinkingPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}
`;

export const ThinkingIndicator: React.FC<{ text?: string }> = ({
  text = 'Pensando...',
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1rem',
  };

  const bubbleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    borderTopLeftRadius: radius.sm,
    animation: 'thinkingPulse 2s infinite ease-in-out',
  };

  const iconStyles: React.CSSProperties = {
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '50%',
    border: `2px solid ${colors.brand.primary}`,
    borderTopColor: 'transparent',
    animation: 'spin 1s linear infinite',
  };

  const textStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: colors.text.secondary,
    fontStyle: 'italic',
  };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={containerStyles}>
        <AssistantAvatar size="md" />
        <div style={bubbleStyles}>
          <div style={iconStyles} />
          <span style={textStyles}>{text}</span>
        </div>
      </div>
    </>
  );
};

export default TypingIndicator;
