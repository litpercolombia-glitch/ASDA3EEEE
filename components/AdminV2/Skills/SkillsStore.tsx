/**
 * SkillsStore - Tienda visual de skills
 * Grid de skills con filtros, busqueda y preview
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Package,
  DollarSign,
  BarChart3,
  Zap,
  MessageCircle,
  Play,
  Star,
  ChevronRight,
} from 'lucide-react';
import { colors, radius, shadows, transitions, zIndex } from '../../../styles/theme';
import { Skill, SkillCategory, SKILL_CATEGORIES } from '../skills/types';
import SkillsRegistry from '../skills/SkillsRegistry';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge, SkillBadge } from '../UI/Badge';

// ============================================
// TYPES
// ============================================

interface SkillsStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: Skill, example?: string) => void;
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
// SKILL CARD
// ============================================

interface SkillCardProps {
  skill: Skill;
  onTry: (example?: string) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onTry }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const categoryColor = colors.skills[skill.category];

  const cardStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    backgroundColor: colors.bg.tertiary,
    border: `1px solid ${isHovered ? categoryColor.border : colors.border.light}`,
    borderRadius: radius.xl,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    transform: isHovered ? 'translateY(-2px)' : 'none',
    boxShadow: isHovered ? shadows.md : 'none',
  };

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '3rem',
    height: '3rem',
    borderRadius: radius.lg,
    backgroundColor: categoryColor.bg,
    marginBottom: '0.75rem',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: colors.text.primary,
    marginBottom: '0.25rem',
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.8125rem',
    color: colors.text.secondary,
    lineHeight: 1.4,
    marginBottom: '0.75rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  };

  const examplesStyles: React.CSSProperties = {
    display: showExamples ? 'block' : 'none',
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
  };

  return (
    <div
      style={cardStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={iconContainerStyles}>
        <skill.icon size={24} style={{ color: categoryColor.icon }} />
      </div>

      <div style={titleStyles}>{skill.name}</div>
      <div style={descriptionStyles}>{skill.description}</div>

      <div style={footerStyles}>
        <SkillBadge category={skill.category} size="xs" />

        <Button
          variant="primary"
          size="xs"
          icon={Play}
          onClick={(e) => {
            e.stopPropagation();
            if (skill.examples?.length > 0) {
              setShowExamples(!showExamples);
            } else {
              onTry();
            }
          }}
        >
          Probar
        </Button>
      </div>

      {/* Examples dropdown */}
      <div style={examplesStyles}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: colors.text.tertiary,
            marginBottom: '0.5rem',
          }}
        >
          EJEMPLOS:
        </div>
        {skill.examples?.slice(0, 3).map((example, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onTry(example);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              width: '100%',
              padding: '0.5rem',
              marginBottom: '0.25rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: radius.md,
              fontSize: '0.8125rem',
              color: colors.text.secondary,
              textAlign: 'left',
              cursor: 'pointer',
              transition: `all ${transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            <ChevronRight size={12} />
            {example}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SkillsStore: React.FC<SkillsStoreProps> = ({
  isOpen,
  onClose,
  onSelectSkill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');

  const allSkills = SkillsRegistry.getAll();

  // Filter skills
  const filteredSkills = useMemo(() => {
    return allSkills.filter((skill) => {
      const matchesSearch =
        searchQuery === '' ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.keywords.some((k) => k.includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || skill.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allSkills, searchQuery, selectedCategory]);

  // Group by category
  const skillsByCategory = useMemo(() => {
    const grouped: Record<SkillCategory, Skill[]> = {
      logistics: [],
      finance: [],
      analytics: [],
      automation: [],
      communication: [],
    };

    filteredSkills.forEach((skill) => {
      grouped[skill.category].push(skill);
    });

    return grouped;
  }, [filteredSkills]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: allSkills.length,
      logistics: allSkills.filter((s) => s.category === 'logistics').length,
      finance: allSkills.filter((s) => s.category === 'finance').length,
      analytics: allSkills.filter((s) => s.category === 'analytics').length,
      automation: allSkills.filter((s) => s.category === 'automation').length,
      communication: allSkills.filter((s) => s.category === 'communication').length,
    };
  }, [allSkills]);

  if (!isOpen) return null;

  // Styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: zIndex.modalBackdrop,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  };

  const modalStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '900px',
    maxHeight: '85vh',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border.default}`,
    boxShadow: shadows['2xl'],
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem',
    borderBottom: `1px solid ${colors.border.light}`,
  };

  const titleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.text.primary,
  };

  const filtersStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderBottom: `1px solid ${colors.border.light}`,
    flexWrap: 'wrap',
  };

  const categoryButtonStyles = (isSelected: boolean, category: SkillCategory | 'all'): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    backgroundColor: isSelected ? colors.brand.primary + '20' : colors.bg.tertiary,
    border: `1px solid ${isSelected ? colors.brand.primary : colors.border.default}`,
    borderRadius: radius.full,
    color: isSelected ? colors.brand.primary : colors.text.secondary,
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
  });

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '1.25rem',
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  };

  const sectionTitleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.text.secondary,
    marginBottom: '1rem',
    marginTop: '1.5rem',
  };

  const categories: (SkillCategory | 'all')[] = [
    'all',
    'logistics',
    'finance',
    'analytics',
    'automation',
    'communication',
  ];

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={titleStyles}>
            <Sparkles size={24} style={{ color: colors.brand.secondary }} />
            Skills Store
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: radius.lg,
              color: colors.text.tertiary,
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div style={filtersStyles}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              placeholder="Buscar skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              size="sm"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const Icon = cat === 'all' ? Star : categoryIcons[cat];
              const label =
                cat === 'all' ? 'Todas' : SKILL_CATEGORIES[cat].label;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={categoryButtonStyles(selectedCategory === cat, cat)}
                >
                  <Icon size={14} />
                  {label} ({categoryCounts[cat]})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={contentStyles}>
          {filteredSkills.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem',
                color: colors.text.tertiary,
              }}
            >
              <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1rem' }}>No se encontraron skills</p>
              <p style={{ fontSize: '0.875rem' }}>
                Intenta con otros terminos de busqueda
              </p>
            </div>
          ) : selectedCategory === 'all' ? (
            // Show by category
            Object.entries(skillsByCategory).map(([category, skills]) => {
              if (skills.length === 0) return null;
              const Icon = categoryIcons[category as SkillCategory];
              const categoryInfo = SKILL_CATEGORIES[category as SkillCategory];

              return (
                <div key={category}>
                  <div style={sectionTitleStyles}>
                    <Icon size={16} style={{ color: categoryInfo.color }} />
                    {categoryInfo.label} ({skills.length})
                  </div>
                  <div style={gridStyles}>
                    {skills.map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        onTry={(example) => onSelectSkill(skill, example)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Show filtered
            <div style={gridStyles}>
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onTry={(example) => onSelectSkill(skill, example)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsStore;
