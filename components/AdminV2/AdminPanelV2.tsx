/**
 * AdminPanelV2 - Chat-first Admin Panel
 *
 * Nueva version del panel de administracion con interfaz de chat
 * como metodo principal de interaccion.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  MessageSquare,
  Package,
  DollarSign,
  BarChart3,
  Zap,
  MessageCircle,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronRight,
  Loader2,
  Search,
  Star,
} from 'lucide-react';
import { ChatInterface } from './chat/ChatInterface';
import SkillsRegistry from './skills/SkillsRegistry';
import { Skill, SkillCategory, SKILL_CATEGORIES } from './skills/types';

// Import skills to register them
import './skills/logistics/TrackShipment.skill';

// ============================================
// STYLES
// ============================================

const COLORS = {
  primary: '#F97316',
  secondary: '#6366F1',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

// ============================================
// AUTHENTICATION COMPONENT
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

    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // TODO: Replace with proper JWT authentication
    if (password === 'litperpro2024') {
      localStorage.setItem('admin_v2_token', 'authenticated');
      onAuthenticate();
    } else {
      setError('Contrasena incorrecta');
    }

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.background }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary + '20' }}
          >
            <Shield className="w-8 h-8" style={{ color: COLORS.primary }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Panel V2</h1>
          <p style={{ color: COLORS.textMuted }}>
            Interfaz de administracion con IA
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm mb-2" style={{ color: COLORS.textMuted }}>
              Contrasena
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: COLORS.textMuted }}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800 text-white outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ingresa la contrasena"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-center text-sm"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: COLORS.error }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Unlock className="w-5 h-5" />
                Acceder
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================
// SKILLS SIDEBAR
// ============================================

interface SkillsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSkillClick: (skill: Skill) => void;
}

const SkillsSidebar: React.FC<SkillsSidebarProps> = ({ isOpen, onToggle, onSkillClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');

  const allSkills = SkillsRegistry.getAll();

  const filteredSkills = allSkills.filter(skill => {
    const matchesSearch =
      searchQuery === '' ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.keywords.some(k => k.includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || skill.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories: (SkillCategory | 'all')[] = [
    'all',
    'logistics',
    'finance',
    'analytics',
    'automation',
    'communication',
  ];

  const getCategoryIcon = (category: SkillCategory | 'all') => {
    switch (category) {
      case 'logistics':
        return <Package className="w-4 h-4" />;
      case 'finance':
        return <DollarSign className="w-4 h-4" />;
      case 'analytics':
        return <BarChart3 className="w-4 h-4" />;
      case 'automation':
        return <Zap className="w-4 h-4" />;
      case 'communication':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-20 z-50 p-3 rounded-lg transition-colors hover:bg-slate-700"
        style={{ backgroundColor: COLORS.surface }}
      >
        <Menu className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div
      className="w-72 h-full flex flex-col border-r"
      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.surfaceLight }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: COLORS.surfaceLight }}
      >
        <h3 className="font-semibold text-white">Skills</h3>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-700"
        >
          <X className="w-5 h-5" style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: COLORS.surfaceLight }}
        >
          <Search className="w-4 h-4" style={{ color: COLORS.textMuted }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar skills..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {getCategoryIcon(cat)}
            {cat === 'all' ? 'Todas' : SKILL_CATEGORIES[cat].label}
          </button>
        ))}
      </div>

      {/* Skills list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredSkills.length === 0 ? (
          <div className="text-center py-8" style={{ color: COLORS.textMuted }}>
            <p className="text-sm">No se encontraron skills</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSkills.map(skill => (
              <button
                key={skill.id}
                onClick={() => onSkillClick(skill)}
                className="w-full p-3 rounded-lg text-left transition-colors hover:bg-slate-600/50"
                style={{ backgroundColor: COLORS.surfaceLight }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded"
                    style={{
                      backgroundColor:
                        SKILL_CATEGORIES[skill.category].color + '20',
                    }}
                  >
                    <skill.icon
                      className="w-4 h-4"
                      style={{ color: SKILL_CATEGORIES[skill.category].color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-white truncate">
                      {skill.name}
                    </div>
                    <div
                      className="text-xs truncate"
                      style={{ color: COLORS.textMuted }}
                    >
                      {skill.description}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: COLORS.textMuted }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        className="p-4 border-t"
        style={{ borderColor: COLORS.surfaceLight }}
      >
        <div className="flex justify-between text-xs" style={{ color: COLORS.textMuted }}>
          <span>{allSkills.length} skills disponibles</span>
          <span>v2.0.0</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AdminPanelV2: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Check for existing auth
  useEffect(() => {
    const token = localStorage.getItem('admin_v2_token');
    if (token === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_v2_token');
    setIsAuthenticated(false);
  };

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
    // Could open a form dialog or add to chat input
    console.log('Selected skill:', skill.id);
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Skills Sidebar */}
      <SkillsSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSkillClick={handleSkillClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: COLORS.surfaceLight }}
        >
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-700"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            )}
            <h1 className="text-lg font-bold text-white">
              LITPER PRO <span style={{ color: COLORS.primary }}>Admin V2</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-700">
              <Settings className="w-5 h-5" style={{ color: COLORS.textMuted }} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              <span className="text-sm" style={{ color: COLORS.textMuted }}>
                Salir
              </span>
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface userId="admin" />
        </div>
      </div>
    </div>
  );
};

export default AdminPanelV2;
