// components/skills/SkillsHub.tsx
// Hub de Skills - Centro de gestión de automatizaciones

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit,
  Copy,
} from 'lucide-react';
import { skillsEngine, Skill, SkillExecution } from '../../services/skills/SkillsEngine';

interface SkillsHubProps {
  onSkillSelect?: (skill: Skill) => void;
}

export const SkillsHub: React.FC<SkillsHubProps> = ({ onSkillSelect }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [executions, setExecutions] = useState<SkillExecution[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [stats, setStats] = useState(skillsEngine.getStats());

  useEffect(() => {
    loadData();

    // Suscribirse a ejecuciones
    const unsubscribe = skillsEngine.onExecution((execution) => {
      setExecutions((prev) => [execution, ...prev.slice(0, 19)]);
      loadData();
    });

    return () => unsubscribe();
  }, []);

  const loadData = () => {
    setSkills(skillsEngine.getAllSkills());
    setExecutions(skillsEngine.getRecentExecutions(20));
    setStats(skillsEngine.getStats());
  };

  const handleToggleSkill = (skillId: string) => {
    skillsEngine.toggleSkill(skillId);
    loadData();
  };

  const handleExecuteSkill = async (skillId: string) => {
    await skillsEngine.executeSkill(skillId);
    loadData();
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'Todos', icon: '📋' },
    { id: 'ventas', label: 'Ventas', icon: '💰' },
    { id: 'logistica', label: 'Logística', icon: '📦' },
    { id: 'hibrido', label: 'Híbrido', icon: '🔄' },
    { id: 'analisis', label: 'Análisis', icon: '📊' },
  ];

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500';
  };

  const getExecutionStatusIcon = (status: SkillExecution['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Skills Hub
            </h2>
            <p className="text-sm text-slate-500">
              Automatizaciones y acciones configurables
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Skill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-slate-500">Total Skills</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {stats.totalSkills}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-slate-500">Activos</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {stats.activeSkills}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-slate-500">Ejecuciones Hoy</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {stats.todayExecutions}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-slate-500">Tasa Éxito</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {stats.successRate}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar skills..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg"
          />
        </div>

        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Skills List */}
        <div className="col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white">
            Skills ({filteredSkills.length})
          </h3>

          <div className="space-y-3">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden"
              >
                {/* Skill Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{skill.icon}</span>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white">
                          {skill.name}
                        </h4>
                        <p className="text-sm text-slate-500">{skill.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSkill(skill.id);
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          skill.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            skill.enabled ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>

                      {/* Execute */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteSkill(skill.id);
                        }}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg"
                      >
                        <Play className="w-4 h-4" />
                      </button>

                      <ChevronRight
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedSkill === skill.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {skill.stats.totalExecutions} ejecuciones
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {skill.stats.successCount} exitosas
                    </span>
                    {skill.stats.lastExecution && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Última: {new Date(skill.stats.lastExecution).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSkill === skill.id && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-navy-800">
                    <div className="pt-4 space-y-4">
                      {/* Trigger */}
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Trigger
                        </h5>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {skill.trigger.type}
                          </span>
                          {skill.trigger.event && (
                            <span className="text-slate-600">{skill.trigger.event}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Acciones ({skill.actions.length})
                        </h5>
                        <div className="space-y-1">
                          {skill.actions.map((action, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm text-slate-600"
                            >
                              <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs">
                                {i + 1}
                              </span>
                              {action.type}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Settings */}
                      {skill.settings.schedule && (
                        <div>
                          <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Horario
                          </h5>
                          <p className="text-sm text-slate-600">
                            {skill.settings.schedule.start} - {skill.settings.schedule.end}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">
                          <Settings className="w-4 h-4" />
                          Configurar
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">
                          <Copy className="w-4 h-4" />
                          Duplicar
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm">
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Executions */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white">
            Ejecuciones Recientes
          </h3>

          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 divide-y divide-slate-100 dark:divide-navy-800">
            {executions.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                No hay ejecuciones recientes
              </div>
            ) : (
              executions.slice(0, 10).map((execution) => (
                <div key={execution.id} className="p-3">
                  <div className="flex items-start gap-2">
                    {getExecutionStatusIcon(execution.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                        {execution.skillName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {execution.trigger} • {new Date(execution.startedAt).toLocaleTimeString()}
                      </p>
                      {execution.result && (
                        <p className="text-xs text-emerald-600 mt-1 truncate">
                          {execution.result}
                        </p>
                      )}
                      {execution.error && (
                        <p className="text-xs text-red-600 mt-1 truncate">
                          {execution.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsHub;
