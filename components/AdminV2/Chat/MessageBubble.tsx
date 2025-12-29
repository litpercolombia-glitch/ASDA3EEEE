/**
 * MessageBubble - Burbuja de mensaje profesional
 * Con avatar, timestamp, estados y artifacts
 */

import React, { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';
import { Avatar, AssistantAvatar } from '../UI/Avatar';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Message, Artifact, SuggestedAction } from '../skills/types';

// ============================================
// TYPES
// ============================================

interface MessageBubbleProps {
  message: Message;
  onActionClick?: (action: SuggestedAction) => void;
  onRetry?: () => void;
  onCopy?: (content: string) => void;
}

// ============================================
// UTILS
// ============================================

const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;

  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================
// COMPONENT
// ============================================

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onActionClick,
  onRetry,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isPending = message.status === 'pending';

  // Copy handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy?.(message.content);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    flexDirection: isUser ? 'row-reverse' : 'row',
    opacity: isPending ? 0.7 : 1,
  };

  const bubbleContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: isUser ? 'flex-end' : 'flex-start',
    maxWidth: '75%',
    position: 'relative',
  };

  const bubbleStyles: React.CSSProperties = {
    padding: '0.875rem 1rem',
    borderRadius: radius.xl,
    backgroundColor: isUser
      ? colors.brand.primary
      : isError
        ? colors.error.light
        : colors.bg.tertiary,
    border: isError ? `1px solid ${colors.error.default}40` : 'none',
    borderTopLeftRadius: isUser ? radius.xl : radius.sm,
    borderTopRightRadius: isUser ? radius.sm : radius.xl,
    boxShadow: isUser ? shadows.md : 'none',
    transition: `all ${transitions.normal}`,
    ...(isHovered && !isUser && {
      backgroundColor: colors.bg.elevated,
    }),
  };

  const contentStyles: React.CSSProperties = {
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    color: isUser ? '#FFFFFF' : isError ? colors.error.default : colors.text.primary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const metaStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: isUser ? 'rgba(255,255,255,0.7)' : colors.text.tertiary,
  };

  const actionsBarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '0.5rem',
    opacity: isHovered ? 1 : 0,
    transition: `opacity ${transitions.fast}`,
  };

  const actionButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.375rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: radius.md,
    color: colors.text.tertiary,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
  };

  const suggestedActionsStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.75rem',
  };

  const suggestionButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: colors.bg.elevated,
    border: `1px solid ${colors.border.default}`,
    borderRadius: radius.full,
    fontSize: '0.8125rem',
    color: colors.text.secondary,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  };

  return (
    <div
      style={containerStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar type="user" name="Tu" size="md" />
      ) : (
        <AssistantAvatar size="md" />
      )}

      {/* Bubble Content */}
      <div style={bubbleContainerStyles}>
        <div style={bubbleStyles}>
          {/* Main content */}
          <div style={contentStyles}>{message.content}</div>

          {/* Skill badge */}
          {message.skillId && !isUser && (
            <div style={{ marginTop: '0.75rem' }}>
              <Badge variant="secondary" size="xs" icon={Sparkles}>
                {message.skillId}
              </Badge>
            </div>
          )}

          {/* Artifact preview */}
          {message.artifact && (
            <div style={{ marginTop: '0.75rem' }}>
              <ArtifactPreview artifact={message.artifact} />
            </div>
          )}

          {/* Suggested actions */}
          {message.suggestedActions && message.suggestedActions.length > 0 && (
            <div style={suggestedActionsStyles}>
              {message.suggestedActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onActionClick?.(action)}
                  style={suggestionButtonStyles}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.color = colors.brand.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.elevated;
                    e.currentTarget.style.borderColor = colors.border.default;
                    e.currentTarget.style.color = colors.text.secondary;
                  }}
                >
                  <ChevronRight size={14} />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Meta info */}
          <div style={metaStyles}>
            {isPending && <Clock size={12} />}
            {isError && <AlertCircle size={12} />}
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>

        {/* Action bar (copy, retry, etc) */}
        {!isUser && !isPending && (
          <div style={actionsBarStyles}>
            <button
              onClick={handleCopy}
              style={actionButtonStyles}
              title="Copiar"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.tertiary;
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {isError && onRetry && (
              <button
                onClick={onRetry}
                style={actionButtonStyles}
                title="Reintentar"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.text.tertiary;
                }}
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ARTIFACT PREVIEW (simple version)
// ============================================

interface ArtifactPreviewProps {
  artifact: Artifact;
}

const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact }) => {
  const previewStyles: React.CSSProperties = {
    padding: '0.75rem',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border.default}`,
  };

  const titleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: colors.text.primary,
    marginBottom: '0.5rem',
  };

  if (artifact.type === 'table' && artifact.content) {
    const { columns, rows } = artifact.content;
    const displayRows = rows?.slice(0, 3) || [];

    return (
      <div style={previewStyles}>
        <div style={titleStyles}>
          <span style={{ color: colors.brand.primary }}>📊</span>
          {artifact.title || 'Tabla de datos'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns?.slice(0, 4).map((col: any, idx: number) => (
                  <th
                    key={idx}
                    style={{
                      padding: '0.375rem',
                      textAlign: 'left',
                      color: colors.text.tertiary,
                      borderBottom: `1px solid ${colors.border.default}`,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row: any, idx: number) => (
                <tr key={idx}>
                  {columns?.slice(0, 4).map((col: any, colIdx: number) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: '0.375rem',
                        color: colors.text.secondary,
                      }}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows && rows.length > 3 && (
            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: colors.text.tertiary,
              }}
            >
              ... y {rows.length - 3} filas mas
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={previewStyles}>
      <div style={titleStyles}>
        {artifact.title || `Artifact: ${artifact.type}`}
      </div>
      <div style={{ fontSize: '0.75rem', color: colors.text.tertiary }}>
        Tipo: {artifact.type}
      </div>
    </div>
  );
};

export default MessageBubble;
