/**
 * TrackShipment Skill
 *
 * Rastrear el estado actual de una guia de envio
 */

import { Package, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skill, SkillResult, SkillContext } from '../types';
import SkillsRegistry from '../SkillsRegistry';

// ============================================
// SKILL DEFINITION
// ============================================

export const TrackShipmentSkill: Skill = {
  id: 'track-shipment',
  name: 'Rastrear Envio',
  description: 'Consulta el estado actual de una guia en cualquier transportadora',
  category: 'logistics',
  icon: Package,
  version: '1.0.0',

  // Parameters
  requiredParams: [
    {
      name: 'guideNumber',
      type: 'string',
      label: 'Numero de Guia',
      placeholder: 'Ej: 123456789',
      validation: {
        pattern: '^[A-Za-z0-9-]+$',
        message: 'Solo numeros, letras y guiones',
      },
    },
  ],

  optionalParams: [
    {
      name: 'carrier',
      type: 'select',
      label: 'Transportadora',
      options: [
        { value: 'auto', label: 'Detectar automaticamente' },
        { value: 'interrapidisimo', label: 'Interrapidisimo' },
        { value: 'coordinadora', label: 'Coordinadora' },
        { value: 'servientrega', label: 'Servientrega' },
        { value: 'envia', label: 'Envia' },
        { value: 'tcc', label: 'TCC' },
      ],
    },
  ],

  // Permissions
  roles: ['admin', 'operator', 'viewer'],

  // NLP matching
  keywords: [
    'rastrear',
    'tracking',
    'guia',
    'envio',
    'estado',
    'donde esta',
    'buscar',
    'consultar',
    'paquete',
    'pedido',
    'ubicacion',
    'seguimiento',
  ],

  examples: [
    'Rastrear guia 123456',
    'Donde esta el pedido 789?',
    'Estado de la guia ABC123',
    'Buscar envio 456789',
    'Tracking 123456',
    'Consultar guia COORD-789',
  ],

  // Execution
  async execute(params: Record<string, any>, context: SkillContext): Promise<SkillResult> {
    const { guideNumber, carrier = 'auto' } = params;

    if (!guideNumber) {
      return {
        success: false,
        message: 'Por favor proporciona el numero de guia',
        error: {
          code: 'MISSING_PARAM',
          details: 'El numero de guia es requerido',
        },
      };
    }

    try {
      // Simulated tracking result - in production this would call the actual tracking service
      const trackingResult = await simulateTracking(guideNumber, carrier);

      if (!trackingResult.found) {
        return {
          success: false,
          message: `No se encontro la guia ${guideNumber}`,
          suggestedActions: [
            {
              label: 'Buscar en todas las transportadoras',
              skillId: 'search-all-carriers',
              params: { guideNumber },
            },
            {
              label: 'Crear ticket de soporte',
              skillId: 'create-ticket',
              params: { guideNumber, reason: 'Guia no encontrada' },
            },
          ],
        };
      }

      // Build response with artifact
      return {
        success: true,
        message: `Guia ${guideNumber} encontrada - Estado: ${trackingResult.status}`,
        data: trackingResult,
        artifact: {
          type: 'table',
          title: `Tracking: ${guideNumber}`,
          content: {
            columns: [
              { key: 'field', label: 'Campo', width: '40%' },
              { key: 'value', label: 'Valor', width: '60%' },
            ],
            rows: [
              { field: 'Numero de Guia', value: guideNumber },
              { field: 'Estado', value: trackingResult.status },
              { field: 'Transportadora', value: trackingResult.carrier },
              { field: 'Ubicacion Actual', value: trackingResult.location },
              { field: 'Ultima Actualizacion', value: trackingResult.lastUpdate },
              { field: 'Destino', value: trackingResult.destination },
              { field: 'Dias en Transito', value: `${trackingResult.daysInTransit} dias` },
              {
                field: 'Riesgo de Retraso',
                value:
                  trackingResult.riskLevel === 'high'
                    ? 'Alto'
                    : trackingResult.riskLevel === 'medium'
                      ? 'Medio'
                      : 'Bajo',
              },
            ],
            summary: {
              totalEvents: trackingResult.events?.length || 0,
              estimatedDelivery: trackingResult.estimatedDelivery,
            },
          },
        },
        suggestedActions: [
          {
            label: 'Ver historial completo',
            skillId: 'shipment-history',
            params: { guideNumber },
            icon: Clock,
          },
          {
            label: 'Crear ticket si hay problema',
            skillId: 'create-ticket',
            params: { guideNumber },
            icon: AlertTriangle,
          },
          {
            label: 'Enviar WhatsApp al cliente',
            skillId: 'send-whatsapp',
            params: { guideNumber },
          },
          {
            label: 'Ver en mapa',
            skillId: 'show-on-map',
            params: { guideNumber, location: trackingResult.location },
            icon: MapPin,
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al consultar la guia',
        error: {
          code: 'TRACKING_ERROR',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
      };
    }
  },

  artifactType: 'table',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

interface TrackingResult {
  found: boolean;
  guideNumber: string;
  status: string;
  carrier: string;
  location: string;
  destination: string;
  lastUpdate: string;
  daysInTransit: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedDelivery?: string;
  events?: {
    date: string;
    status: string;
    location: string;
  }[];
}

/**
 * Simulate tracking - replace with actual service call in production
 */
async function simulateTracking(guideNumber: string, carrier: string): Promise<TrackingResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // For demo purposes, generate mock data based on guide number
  const hash = guideNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const statuses = [
    'En transito',
    'En bodega destino',
    'En reparto',
    'Entregado',
    'Novedad',
    'Devolucion',
  ];

  const carriers = ['Interrapidisimo', 'Coordinadora', 'Servientrega', 'Envia', 'TCC'];

  const cities = [
    'Bogota',
    'Medellin',
    'Cali',
    'Barranquilla',
    'Cartagena',
    'Bucaramanga',
    'Pereira',
  ];

  const status = statuses[hash % statuses.length];
  const selectedCarrier = carrier === 'auto' ? carriers[hash % carriers.length] : carrier;
  const daysInTransit = (hash % 7) + 1;

  // 10% chance of not found
  if (hash % 10 === 0) {
    return { found: false } as TrackingResult;
  }

  const today = new Date();
  const lastUpdateDate = new Date(today.getTime() - (hash % 24) * 60 * 60 * 1000);

  return {
    found: true,
    guideNumber,
    status,
    carrier: selectedCarrier,
    location: cities[hash % cities.length],
    destination: cities[(hash + 3) % cities.length],
    lastUpdate: lastUpdateDate.toLocaleString('es-CO'),
    daysInTransit,
    riskLevel: daysInTransit > 5 ? 'high' : daysInTransit > 3 ? 'medium' : 'low',
    estimatedDelivery: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(
      'es-CO'
    ),
    events: [
      {
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO'),
        status: 'Recogido',
        location: cities[(hash + 1) % cities.length],
      },
      {
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO'),
        status: 'En transito',
        location: 'Centro de distribucion',
      },
      {
        date: lastUpdateDate.toLocaleDateString('es-CO'),
        status,
        location: cities[hash % cities.length],
      },
    ],
  };
}

// ============================================
// REGISTER SKILL
// ============================================

SkillsRegistry.register(TrackShipmentSkill);

export default TrackShipmentSkill;
