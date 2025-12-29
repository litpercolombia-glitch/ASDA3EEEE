/**
 * ProblemsDetection Skill - Detectar problemas y novedades
 * Muestra guias con novedades que requieren atencion
 */

import { AlertTriangle } from 'lucide-react';
import SkillsRegistry from '../SkillsRegistry';
import { Skill, SkillResult } from '../types';

// Mock data - en produccion conectar con Supabase
const getProblematicGuides = async () => {
  return [
    {
      guia: 'WDG123456',
      cliente: 'Juan Perez',
      ciudad: 'Cucuta',
      transportadora: 'Servientrega',
      novedad: 'Direccion incorrecta',
      dias: 5,
      valor: 125000,
      prioridad: 'alta'
    },
    {
      guia: 'WDG123457',
      cliente: 'Maria Garcia',
      ciudad: 'Santa Marta',
      transportadora: 'Coordinadora',
      novedad: 'Cliente ausente',
      dias: 3,
      valor: 89000,
      prioridad: 'media'
    },
    {
      guia: 'WDG123458',
      cliente: 'Carlos Lopez',
      ciudad: 'Cartagena',
      transportadora: 'Interrapidisimo',
      novedad: 'Rechazo por empaque',
      dias: 4,
      valor: 156000,
      prioridad: 'alta'
    },
    {
      guia: 'WDG123459',
      cliente: 'Ana Rodriguez',
      ciudad: 'Barranquilla',
      transportadora: 'TCC',
      novedad: 'Telefono no contesta',
      dias: 2,
      valor: 67000,
      prioridad: 'baja'
    },
    {
      guia: 'WDG123460',
      cliente: 'Pedro Sanchez',
      ciudad: 'Bogota',
      transportadora: 'Envia',
      novedad: 'Zona de dificil acceso',
      dias: 6,
      valor: 234000,
      prioridad: 'alta'
    },
  ];
};

const ProblemsDetectionSkill: Skill = {
  id: 'problems-detection',
  name: 'Detectar Problemas',
  description: 'Identifica guias con novedades que requieren atencion inmediata',
  category: 'logistics',
  icon: AlertTriangle,
  keywords: [
    'problema', 'problemas', 'novedad', 'novedades', 'alerta',
    'alertas', 'pendiente', 'urgente', 'critico', 'atencion'
  ],
  examples: [
    'Cuales guias tienen problemas?',
    'Muestra las novedades pendientes',
    'Hay alertas urgentes?',
    'Guias con novedades',
  ],
  requiredParams: [],
  optionalParams: [
    {
      name: 'prioridad',
      type: 'select',
      label: 'Filtrar por prioridad',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Media' },
        { value: 'baja', label: 'Baja' },
      ],
    },
  ],
  roles: ['admin', 'operator'],

  async execute(params): Promise<SkillResult> {
    try {
      const problems = await getProblematicGuides();

      // Filter by priority if provided
      let filtered = problems;
      if (params.prioridad && params.prioridad !== 'all') {
        filtered = problems.filter(p => p.prioridad === params.prioridad);
      }

      // Sort by priority and days
      const priorityOrder = { alta: 0, media: 1, baja: 2 };
      filtered.sort((a, b) => {
        const pDiff = priorityOrder[a.prioridad as keyof typeof priorityOrder] -
                      priorityOrder[b.prioridad as keyof typeof priorityOrder];
        if (pDiff !== 0) return pDiff;
        return b.dias - a.dias;
      });

      // Calculate totals
      const totalValor = filtered.reduce((sum, p) => sum + p.valor, 0);
      const altaPrioridad = filtered.filter(p => p.prioridad === 'alta').length;
      const mediaPrioridad = filtered.filter(p => p.prioridad === 'media').length;

      // Group by type of problem
      const novedadCount: Record<string, number> = {};
      filtered.forEach(p => {
        novedadCount[p.novedad] = (novedadCount[p.novedad] || 0) + 1;
      });

      let message = `⚠️ **Guias con Problemas**\n\n`;
      message += `• Total: ${filtered.length} guias\n`;
      message += `• Valor en riesgo: $${totalValor.toLocaleString()}\n`;
      message += `• Prioridad alta: ${altaPrioridad}\n`;
      message += `• Prioridad media: ${mediaPrioridad}\n\n`;

      message += `**Tipos de novedad:**\n`;
      Object.entries(novedadCount).forEach(([novedad, count]) => {
        message += `• ${novedad}: ${count}\n`;
      });

      if (altaPrioridad > 0) {
        message += `\n🚨 **Atencion inmediata requerida:**\n`;
        filtered.filter(p => p.prioridad === 'alta').forEach(p => {
          message += `• ${p.guia} - ${p.cliente} (${p.ciudad})\n  ${p.novedad} - ${p.dias} dias\n`;
        });
      }

      return {
        success: true,
        message,
        data: { problems: filtered, novedadCount, totalValor },
        artifact: {
          type: 'table',
          title: 'Guias con Novedades',
          content: {
            columns: [
              { key: 'guia', label: 'Guia' },
              { key: 'cliente', label: 'Cliente' },
              { key: 'ciudad', label: 'Ciudad' },
              { key: 'transportadora', label: 'Transportadora' },
              { key: 'novedad', label: 'Novedad' },
              { key: 'dias', label: 'Dias' },
              { key: 'valor', label: 'Valor' },
              { key: 'prioridad', label: 'Prioridad' },
            ],
            rows: filtered.map(p => ({
              ...p,
              valor: `$${p.valor.toLocaleString()}`,
              prioridad: p.prioridad === 'alta' ? '🔴 Alta' :
                        p.prioridad === 'media' ? '🟡 Media' : '🟢 Baja',
            })),
          },
        },
        suggestedActions: [
          { skillId: 'send-whatsapp', label: 'Notificar clientes' },
          { skillId: 'create-ticket', label: 'Crear tickets' },
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error al detectar problemas: ${error.message}`,
        error: error.message,
      };
    }
  },
};

// Auto-register
SkillsRegistry.register(ProblemsDetectionSkill);

export default ProblemsDetectionSkill;
