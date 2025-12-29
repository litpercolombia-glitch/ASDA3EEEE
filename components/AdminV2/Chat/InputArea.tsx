/**
 * InputArea - Area de input profesional
 * Con textarea expandible, shortcuts, y botones de acción
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Command,
  Sparkles,
  X,
  Image,
  FileText,
} from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';
import { Button } from '../UI/Button';
import { Tooltip } from '../UI/Tooltip';

// ============================================
// TYPES
// ============================================

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCommandPalette?: () => void;
  onAttach?: (file: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  onCommandPalette,
  onAttach,
  isLoading = false,
  placeholder = 'Escribe un mensaje o usa / para comandos...',
  maxLength = 4000,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [value]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Send on Enter (without shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !isLoading && !disabled) {
          onSend();
        }
        return;
      }

      // Command palette on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onCommandPalette?.();
        return;
      }

      // Quick skill access on /
      if (e.key === '/' && value === '' && onCommandPalette) {
        e.preventDefault();
        onCommandPalette();
        return;
      }
    },
    [value, isLoading, disabled, onSend, onCommandPalette]
  );

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttach) {
      onAttach(file);
    }
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    padding: '1rem',
    borderTop: `1px solid ${colors.border.light}`,
    backgroundColor: colors.bg.secondary,
  };

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    border: `1px solid ${isFocused ? colors.brand.primary : colors.border.default}`,
    boxShadow: isFocused ? `0 0 0 3px ${colors.brand.primary}20` : 'none',
    transition: `all ${transitions.normal}`,
  };

  const textareaStyles: React.CSSProperties = {
    flex: 1,
    minHeight: '1.5rem',
    maxHeight: '200px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    color: colors.text.primary,
    fontFamily: 'inherit',
  };

  const actionButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: radius.lg,
    color: colors.text.tertiary,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
  };

  const sendButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.625rem',
    backgroundColor: value.trim() ? colors.brand.primary : colors.bg.elevated,
    border: 'none',
    borderRadius: radius.lg,
    color: value.trim() ? '#FFFFFF' : colors.text.muted,
    cursor: value.trim() && !isLoading && !disabled ? 'pointer' : 'default',
    transition: `all ${transitions.normal}`,
    boxShadow: value.trim() ? shadows.md : 'none',
  };

  const hintStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: colors.text.muted,
  };

  const shortcutStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.125rem 0.375rem',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.sm,
    fontSize: '0.6875rem',
    fontFamily: 'monospace',
  };

  const attachMenuStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: '0.5rem',
    padding: '0.5rem',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    boxShadow: shadows.lg,
    border: `1px solid ${colors.border.default}`,
    display: showAttachMenu ? 'flex' : 'none',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: '150px',
  };

  const attachOptionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: radius.md,
    color: colors.text.secondary,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    textAlign: 'left',
  };

  return (
    <div style={containerStyles}>
      <div style={inputContainerStyles}>
        {/* Attach button */}
        <div style={{ position: 'relative' }}>
          <Tooltip content="Adjuntar archivo">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              style={actionButtonStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.tertiary;
              }}
            >
              <Paperclip size={18} />
            </button>
          </Tooltip>

          {/* Attach menu */}
          <div style={attachMenuStyles}>
            <button
              style={attachOptionStyles}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Image size={16} />
              Imagen
            </button>
            <button
              style={attachOptionStyles}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FileText size={16} />
              Documento
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.xlsx,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Main textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled || isLoading}
          style={textareaStyles}
          rows={1}
        />

        {/* Skills button */}
        <Tooltip content="Skills (/)">
          <button
            onClick={onCommandPalette}
            style={actionButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.color = colors.brand.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.tertiary;
            }}
          >
            <Sparkles size={18} />
          </button>
        </Tooltip>

        {/* Send button */}
        <button
          onClick={() => {
            if (value.trim() && !isLoading && !disabled) {
              onSend();
            }
          }}
          disabled={!value.trim() || isLoading || disabled}
          style={sendButtonStyles}
          onMouseEnter={(e) => {
            if (value.trim()) {
              e.currentTarget.style.backgroundColor = colors.brand.primaryHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (value.trim()) {
              e.currentTarget.style.backgroundColor = colors.brand.primary;
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          <Send size={18} />
        </button>
      </div>

      {/* Hints */}
      <div style={hintStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={shortcutStyles}>
            <span>Enter</span>
            <span style={{ opacity: 0.5 }}>enviar</span>
          </span>
          <span style={shortcutStyles}>
            <span>Shift+Enter</span>
            <span style={{ opacity: 0.5 }}>nueva linea</span>
          </span>
          <span style={shortcutStyles}>
            <Command size={10} />
            <span>K</span>
            <span style={{ opacity: 0.5 }}>skills</span>
          </span>
        </div>
        {maxLength && (
          <span style={{ color: value.length > maxLength * 0.9 ? colors.warning.default : colors.text.muted }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputArea;
