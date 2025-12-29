/**
 * CommandPalette - Paleta de comandos (Ctrl+K)
 * Acceso rapido a skills, navegacion y acciones
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Package,
  DollarSign,
  BarChart3,
  Zap,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Clock,
  Star,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import { colors, radius, shadows, transitions, zIndex } from '../../../styles/theme';
import { Skill, SkillCategory, SKILL_CATEGORIES } from '../skills/types';
import SkillsRegistry from '../skills/SkillsRegistry';

// ============================================
// TYPES
// ============================================

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: Skill, example?: string) => void;
  onNavigate?: (path: string) => void;
}

interface CommandItem {
  id: string;
  type: 'skill' | 'action' | 'navigation' | 'recent';
  title: string;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  category?: string;
  action: () => void;
}

// ============================================
// CATEGORY ICONS
// ============================================

const categoryIcons: Record<SkillCategory, React.ElementType> = {
  logistics: Package,
  finance: DollarSign,
  analytics: BarChart3,
  automation: Zap,
  communication: MessageCircle,
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSkill,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get all skills
  const allSkills = SkillsRegistry.getAll();

  // Get recent skills from localStorage
  const recentSkillIds = useMemo(() => {
    try {
      const stored = localStorage.getItem('litper_recent_skills');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  // Build command items
  const commandItems = useMemo(() => {
    const items: CommandItem[] = [];

    // Recent skills
    if (query === '' && recentSkillIds.length > 0) {
      recentSkillIds.slice(0, 3).forEach((skillId: string) => {
        const skill = SkillsRegistry.get(skillId);
        if (skill) {
          items.push({
            id: `recent-${skill.id}`,
            type: 'recent',
            title: skill.name,
            description: 'Usado recientemente',
            icon: Clock,
            iconColor: colors.text.tertiary,
            category: 'Recientes',
            action: () => {
              saveRecentSkill(skill.id);
              onSelectSkill(skill);
            },
          });
        }
      });
    }

    // Filter skills by query
    const filteredSkills = query
      ? allSkills.filter((skill) =>
          skill.name.toLowerCase().includes(query.toLowerCase()) ||
          skill.description.toLowerCase().includes(query.toLowerCase()) ||
          skill.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
        )
      : allSkills.slice(0, 8);

    // Add skill items
    filteredSkills.forEach((skill) => {
      const Icon = categoryIcons[skill.category] || Sparkles;
      const categoryInfo = SKILL_CATEGORIES[skill.category];

      items.push({
        id: `skill-${skill.id}`,
        type: 'skill',
        title: skill.name,
        description: skill.description,
        icon: Icon,
        iconColor: categoryInfo.color,
        category: categoryInfo.label,
        action: () => {
          saveRecentSkill(skill.id);
          onSelectSkill(skill, skill.examples?.[0]);
        },
      });
    });

    return items;
  }, [query, allSkills, recentSkillIds, onSelectSkill]);

  // Save recent skill
  const saveRecentSkill = (skillId: string) => {
    try {
      const recent = JSON.parse(localStorage.getItem('litper_recent_skills') || '[]');
      const updated = [skillId, ...recent.filter((id: string) => id !== skillId)].slice(0, 5);
      localStorage.setItem('litper_recent_skills', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < commandItems.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case 'Enter':
          e.preventDefault();
          if (commandItems[selectedIndex]) {
            commandItems[selectedIndex].action();
            onClose();
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [commandItems, selectedIndex, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: zIndex.commandPalette,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '15vh',
  };

  const containerStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '560px',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border.default}`,
    boxShadow: shadows['2xl'],
    overflow: 'hidden',
  };

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderBottom: `1px solid ${colors.border.light}`,
  };

  const inputStyles: React.CSSProperties = {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    color: colors.text.primary,
    fontFamily: 'inherit',
  };

  const listStyles: React.CSSProperties = {
    maxHeight: '320px',
    overflowY: 'auto',
    padding: '0.5rem',
  };

  const groupLabelStyles: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const itemStyles = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: isSelected ? colors.bg.hover : 'transparent',
    borderRadius: radius.lg,
    cursor: 'pointer',
    transition: `background-color ${transitions.fast}`,
  });

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderTop: `1px solid ${colors.border.light}`,
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

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};

    commandItems.forEach((item) => {
      const group = item.category || 'Acciones';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
    });

    return groups;
  }, [commandItems]);

  let globalIndex = 0;

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={containerStyles} onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div style={inputContainerStyles}>
          <Search size={20} style={{ color: colors.text.tertiary }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar skills, comandos..."
            style={inputStyles}
          />
          <div style={shortcutStyles}>ESC</div>
        </div>

        {/* Results list */}
        <div style={listStyles} ref={listRef}>
          {commandItems.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: colors.text.tertiary,
              }}
            >
              No se encontraron resultados para "{query}"
            </div>
          ) : (
            Object.entries(groupedItems).map(([group, items]) => (
              <div key={group}>
                <div style={groupLabelStyles}>{group}</div>
                {items.map((item) => {
                  const currentIndex = globalIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      style={itemStyles(isSelected)}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          borderRadius: radius.md,
                          backgroundColor: (item.iconColor || colors.brand.primary) + '20',
                        }}
                      >
                        <Icon
                          size={16}
                          style={{ color: item.iconColor || colors.brand.primary }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: colors.text.primary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </div>
                        {item.description && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: colors.text.tertiary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ArrowRight size={14} style={{ color: colors.text.muted }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={footerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={shortcutStyles}>↑↓</span> navegar
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={shortcutStyles}>↵</span> seleccionar
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={12} />
            {allSkills.length} skills disponibles
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
