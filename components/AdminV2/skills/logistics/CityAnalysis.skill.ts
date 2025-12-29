/**
 * CityAnalysis Skill - Analisis de ciudades
 * Muestra estadisticas de entregas por ciudad
 */

import { MapPin } from 'lucide-react';
import SkillsRegistry from '../SkillsRegistry';
import { Skill, SkillResult } from '../types';

// Mock data - en produccion conectar con Supabase
const getCityStats = async () => {
  return [
    { ciudad: 'Bogota', departamento: 'Cundinamarca', total: 1250, entregadas: 1100, tasa: 88, status: 'verde' },
    { ciudad: 'Medellin', departamento: 'Antioquia', total: 890, entregadas: 756, tasa: 85, status: 'verde' },
    { ciudad: 'Cali', departamento: 'Valle', total: 650, entregadas: 520, tasa: 80, status: 'amarillo' },
    { ciudad: 'Barranquilla', departamento: 'Atlantico', total: 420, entregadas: 315, tasa: 75, status: 'amarillo' },
    { ciudad: 'Cartagena', departamento: 'Bolivar', total: 380, entregadas: 266, tasa: 70, status: 'naranja' },
    { ciudad: 'Bucaramanga', departamento: 'Santander', total: 310, entregadas: 248, tasa: 80, status: 'amarillo' },
    { ciudad: 'Cucuta', departamento: 'N. Santander', total: 180, entregadas: 108, tasa: 60, status: 'rojo' },
    { ciudad: 'Pereira', departamento: 'Risaralda', total: 220, entregadas: 187, tasa: 85, status: 'verde' },
    { ciudad: 'Santa Marta', departamento: 'Magdalena', total: 150, entregadas: 97, tasa: 65, status: 'rojo' },
    { ciudad: 'Ibague', departamento: 'Tolima', total: 190, entregadas: 161, tasa: 85, status: 'verde' },
  ];
};

const CityAnalysisSkill: Skill = {
  id: 'city-analysis',
  name: 'Analisis de Ciudades',
  description: 'Muestra estadisticas de entregas por ciudad, identifica ciudades problematicas',
  category: 'analytics',
  icon: MapPin,
  keywords: [
    'ciudad', 'ciudades', 'regional', 'zona', 'departamento',
    'problemas', 'entregas', 'estadisticas', 'tasa', 'semaforo'
  ],
  examples: [
    'Cuales ciudades tienen problemas?',
    'Analiza las entregas por ciudad',
    'Muestra el semaforo de ciudades',
    'Que ciudades estan en rojo?',
  ],
  requiredParams: [],
  optionalParams: [
    {
      name: 'status',
      type: 'select',
      label: 'Filtrar por estado',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'verde', label: 'Verde (>80%)' },
        { value: 'amarillo', label: 'Amarillo (70-80%)' },
        { value: 'naranja', label: 'Naranja (60-70%)' },
        { value: 'rojo', label: 'Rojo (<60%)' },
      ],
    },
  ],
  roles: ['admin', 'operator'],

  async execute(params): Promise<SkillResult> {
    try {
      const cities = await getCityStats();

      // Filter by status if provided
      let filteredCities = cities;
      if (params.status && params.status !== 'all') {
        filteredCities = cities.filter(c => c.status === params.status);
      }

      // Sort by tasa (ascending for problems first)
      filteredCities.sort((a, b) => a.tasa - b.tasa);

      // Calculate totals
      const totalGuias = filteredCities.reduce((sum, c) => sum + c.total, 0);
      const totalEntregadas = filteredCities.reduce((sum, c) => sum + c.entregadas, 0);
      const tasaGeneral = totalGuias > 0 ? (totalEntregadas / totalGuias * 100).toFixed(1) : '0';

      // Count by status
      const statusCount = {
        verde: filteredCities.filter(c => c.status === 'verde').length,
        amarillo: filteredCities.filter(c => c.status === 'amarillo').length,
        naranja: filteredCities.filter(c => c.status === 'naranja').length,
        rojo: filteredCities.filter(c => c.status === 'rojo').length,
      };

      // Problem cities (red + orange)
      const problemCities = filteredCities.filter(c =>
        c.status === 'rojo' || c.status === 'naranja'
      );

      let message = `📊 **Analisis de Ciudades**\n\n`;
      message += `• Total guias: ${totalGuias.toLocaleString()}\n`;
      message += `• Entregadas: ${totalEntregadas.toLocaleString()}\n`;
      message += `• Tasa general: ${tasaGeneral}%\n\n`;

      message += `**Semaforo:**\n`;
      message += `🟢 Verde: ${statusCount.verde} ciudades\n`;
      message += `🟡 Amarillo: ${statusCount.amarillo} ciudades\n`;
      message += `🟠 Naranja: ${statusCount.naranja} ciudades\n`;
      message += `🔴 Rojo: ${statusCount.rojo} ciudades\n`;

      if (problemCities.length > 0) {
        message += `\n⚠️ **Ciudades con problemas:**\n`;
        problemCities.forEach(c => {
          message += `• ${c.ciudad}: ${c.tasa}% (${c.total - c.entregadas} pendientes)\n`;
        });
      }

      return {
        success: true,
        message,
        data: { cities: filteredCities, statusCount, problemCities },
        artifact: {
          type: 'table',
          title: 'Estadisticas por Ciudad',
          content: {
            columns: [
              { key: 'ciudad', label: 'Ciudad' },
              { key: 'departamento', label: 'Departamento' },
              { key: 'total', label: 'Total Guias' },
              { key: 'entregadas', label: 'Entregadas' },
              { key: 'tasa', label: 'Tasa %' },
              { key: 'status', label: 'Estado' },
            ],
            rows: filteredCities.map(c => ({
              ...c,
              tasa: `${c.tasa}%`,
              status: c.status === 'verde' ? '🟢 Verde' :
                      c.status === 'amarillo' ? '🟡 Amarillo' :
                      c.status === 'naranja' ? '🟠 Naranja' : '🔴 Rojo',
            })),
          },
        },
        suggestedActions: [
          { skillId: 'problems-detection', label: 'Ver guias con problemas' },
          { skillId: 'generate-report', label: 'Generar reporte' },
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error al analizar ciudades: ${error.message}`,
        error: error.message,
      };
    }
  },
};

// Auto-register
SkillsRegistry.register(CityAnalysisSkill);

export default CityAnalysisSkill;
