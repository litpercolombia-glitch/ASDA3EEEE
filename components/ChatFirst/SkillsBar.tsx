// components/ChatFirst/SkillsBar.tsx
// Barra de Skills - Las 5 habilidades core del producto
import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  FileText,
  Brain,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type SkillId = 'seguimiento' | 'alertas' | 'reportes' | 'predicciones' | 'automatizaciones';

export interface Skill {
  id: SkillId;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  examples: string[];
}

export const CORE_SKILLS: Skill[] = [
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    description: 'Se exactamente donde esta cada envio',
    icon: Package,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    examples: [
      'Donde esta la guia 123456?',
      'Muestrame envios a Bogota',
      'Cuales estan retrasados?',
    ],
  },
  {
    id: 'alertas',
    label: 'Alertas',
    description: 'Nunca me pierdo un problema critico',
    icon: AlertTriangle,
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    examples: [
      'Que ciudades estan criticas?',
      'Pausar alertas de Cali',
      'Envia alerta al equipo',
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    description: 'Informacion lista para decidir',
    icon: FileText,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-indigo-600',
    examples: [
      'Dame el reporte de hoy',
      'Compara esta semana vs anterior',
      'Como va Coordinadora?',
    ],
  },
  {
    id: 'predicciones',
    label: 'Predicciones',
    description: 'Se que va a pasar antes de que pase',
    icon: Brain,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-violet-600',
    examples: [
      'Que envios van a fallar?',
      'Predice manana',
      'Que patrones ves esta semana?',
    ],
  },
  {
    id: 'automatizaciones',
    label: 'Automatizar',
    description: 'El sistema trabaja por mi',
    icon: Zap,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-600',
    examples: [
      'Carga este Excel',
      'Crea regla: si retraso > 3 dias, alerta',
      'Automatiza mensaje a cliente',
    ],
  },
];

interface SkillsBarProps {
  onSkillClick: (skill: Skill) => void;
  activeSkill?: SkillId | null;
  showExamples?: boolean;
}

interface SkillButtonProps {
  skill: Skill;
  isActive: boolean;
  onClick: () => void;
  showHint?: boolean;
}

const SkillButton: React.FC<SkillButtonProps> = ({ skill, isActive, onClick, showHint }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl
          transition-all duration-300 min-w-[100px]
          ${isActive
            ? `bg-gradient-to-br ${skill.gradient} text-white shadow-lg shadow-${skill.color}/30`
            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
          }
        `}
      >
        <div className={`
          p-2.5 rounded-xl transition-all duration-300
          ${isActive
            ? 'bg-white/20'
            : 'bg-white/5 group-hover:bg-white/10'
          }
        `}>
          <skill.icon className={`w-5 h-5 ${isActive ? 'text-white' : skill.color}`} />
        </div>
        <span className="text-sm font-semibold">{skill.label}</span>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-8 h-1 bg-white/50 rounded-full" />
          </div>
        )}
      </button>

      {/* Tooltip with examples */}
      {showHint && isHovered && !isActive && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50 pointer-events-none">
          <div className="bg-navy-900 border border-white/20 rounded-xl p-3 shadow-2xl min-w-[220px]">
            <p className="text-xs text-slate-400 mb-2">{skill.description}</p>
            <div className="space-y-1.5">
              {skill.examples.slice(0, 2).map((example, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <Sparkles className="w-3 h-3 text-accent-400" />
                  <span>"{example}"</span>
                </div>
              ))}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-3 h-3 bg-navy-900 border-r border-b border-white/20 rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SkillsBar: React.FC<SkillsBarProps> = ({
  onSkillClick,
  activeSkill,
  showExamples = true,
}) => {
  return (
    <div className="bg-gradient-to-r from-navy-900/95 via-navy-800/95 to-navy-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-400" />
          <h3 className="text-sm font-bold text-white">Skills</h3>
          <span className="text-xs text-slate-500">(Acceso Rapido)</span>
        </div>
        {activeSkill && (
          <button
            onClick={() => onSkillClick(CORE_SKILLS.find(s => s.id === activeSkill)!)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>Ver mas</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Skills Grid */}
      <div className="flex flex-wrap justify-center gap-3">
        {CORE_SKILLS.map((skill) => (
          <SkillButton
            key={skill.id}
            skill={skill}
            isActive={activeSkill === skill.id}
            onClick={() => onSkillClick(skill)}
            showHint={showExamples}
          />
        ))}
      </div>

      {/* Active Skill Examples */}
      {activeSkill && (
        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400 mb-2">Prueba decir:</p>
          <div className="flex flex-wrap gap-2">
            {CORE_SKILLS.find(s => s.id === activeSkill)?.examples.map((example, i) => (
              <button
                key={i}
                onClick={() => {
                  // This will trigger the chat to use this example
                  const event = new CustomEvent('skill-example-click', { detail: example });
                  window.dispatchEvent(event);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsBar;
