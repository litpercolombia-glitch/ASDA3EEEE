// services/automationService.ts
// Sistema de Automatización Inteligente para gestión de guías
import { Shipment } from '../types';

// =====================================
// TIPOS
// =====================================

export type TriggerType =
  | 'status_change'      // Cuando cambia el estado
  | 'time_threshold'     // Cuando pasa cierto tiempo
  | 'risk_level'         // Según nivel de riesgo IA
  | 'multiple_attempts'  // Múltiples intentos fallidos
  | 'geographic'         // Por zona geográfica
  | 'carrier_delay'      // Retraso de transportadora
  | 'schedule';          // Programado (hora específica)

export type ActionType =
  | 'send_whatsapp'      // Enviar WhatsApp automático
  | 'send_sms'           // Enviar SMS
  | 'create_alert'       // Crear alerta
  | 'escalate'           // Escalar a supervisor
  | 'tag_priority'       // Etiquetar como prioritario
  | 'schedule_call'      // Programar llamada
  | 'notify_team'        // Notificar al equipo
  | 'auto_retry';        // Reintentar acción

export interface AutomationRule {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  trigger: {
    tipo: TriggerType;
    condiciones: Record<string, any>;
  };
  acciones: {
    tipo: ActionType;
    parametros: Record<string, any>;
  }[];
  prioridad: number;
  createdAt: string;
  ejecutados: number;
  ultimaEjecucion?: string;
}

export interface SmartAlert {
  id: string;
  tipo: 'critico' | 'urgente' | 'informativo' | 'exito';
  titulo: string;
  mensaje: string;
  guiasAfectadas: string[];
  timestamp: string;
  leido: boolean;
  accionRecomendada?: string;
  reglaOrigen?: string;
}

export interface WorkflowExecution {
  id: string;
  reglaId: string;
  nombreRegla: string;
  guiaId: string;
  accionesEjecutadas: string[];
  resultado: 'exito' | 'parcial' | 'fallido';
  timestamp: string;
  detalles?: string;
}

// =====================================
// REGLAS PREDEFINIDAS
// =====================================

export const reglasAutomaticasPredefinidas: Omit<AutomationRule, 'id' | 'createdAt' | 'ejecutados'>[] = [
  {
    nombre: 'Alerta Guía Crítica',
    descripcion: 'Notifica cuando una guía lleva más de 48h sin movimiento',
    activo: true,
    trigger: {
      tipo: 'time_threshold',
      condiciones: {
        horasSinMovimiento: 48,
        estados: ['in_transit', 'issue']
      }
    },
    acciones: [
      {
        tipo: 'create_alert',
        parametros: {
          tipo: 'critico',
          mensaje: 'Guía sin movimiento por más de 48 horas'
        }
      },
      {
        tipo: 'tag_priority',
        parametros: { nivel: 'CRITICO' }
      }
    ],
    prioridad: 1
  },
  {
    nombre: 'WhatsApp Automático - En Oficina',
    descripcion: 'Envía mensaje WhatsApp cuando la guía llega a oficina destino',
    activo: true,
    trigger: {
      tipo: 'status_change',
      condiciones: {
        nuevoEstado: 'in_office',
        tiempoEspera: 2 // horas en oficina
      }
    },
    acciones: [
      {
        tipo: 'send_whatsapp',
        parametros: {
          plantilla: 'oficina_destino',
          mensaje: 'Su paquete está listo para recoger en nuestra oficina.'
        }
      }
    ],
    prioridad: 2
  },
  {
    nombre: 'Escalamiento Múltiples Intentos',
    descripcion: 'Escala a supervisor después de 3 intentos de entrega fallidos',
    activo: true,
    trigger: {
      tipo: 'multiple_attempts',
      condiciones: {
        intentosFallidos: 3
      }
    },
    acciones: [
      {
        tipo: 'escalate',
        parametros: {
          nivel: 'supervisor',
          razon: 'Múltiples intentos de entrega fallidos'
        }
      },
      {
        tipo: 'create_alert',
        parametros: {
          tipo: 'urgente',
          mensaje: 'Guía requiere atención especial - múltiples intentos fallidos'
        }
      }
    ],
    prioridad: 1
  },
  {
    nombre: 'Notificación Riesgo Alto',
    descripcion: 'Notifica al equipo cuando IA detecta riesgo alto de devolución',
    activo: true,
    trigger: {
      tipo: 'risk_level',
      condiciones: {
        nivelMinimo: 'ALTO',
        probabilidadDevolucion: 60
      }
    },
    acciones: [
      {
        tipo: 'notify_team',
        parametros: {
          canal: 'urgentes',
          incluirRecomendaciones: true
        }
      }
    ],
    prioridad: 2
  },
  {
    nombre: 'Recordatorio Matutino',
    descripcion: 'Envía resumen de guías pendientes cada mañana',
    activo: true,
    trigger: {
      tipo: 'schedule',
      condiciones: {
        hora: '08:00',
        diasSemana: [1, 2, 3, 4, 5] // Lun-Vie
      }
    },
    acciones: [
      {
        tipo: 'create_alert',
        parametros: {
          tipo: 'informativo',
          mensaje: 'Resumen diario de guías pendientes'
        }
      }
    ],
    prioridad: 3
  },
  {
    nombre: 'Contacto Proactivo Novedad',
    descripcion: 'Programa llamada automática para guías con novedad',
    activo: false,
    trigger: {
      tipo: 'status_change',
      condiciones: {
        nuevoEstado: 'issue',
        tipoNovedad: ['direccion_incorrecta', 'destinatario_ausente']
      }
    },
    acciones: [
      {
        tipo: 'schedule_call',
        parametros: {
          prioridad: 'alta',
          intentosMaximos: 3
        }
      },
      {
        tipo: 'send_whatsapp',
        parametros: {
          plantilla: 'novedad_entrega',
          mensaje: 'Tuvimos un inconveniente con su entrega. Por favor contáctenos.'
        }
      }
    ],
    prioridad: 1
  }
];

// =====================================
// FUNCIONES DEL SERVICIO
// =====================================

/**
 * Evalúa si una guía cumple las condiciones de una regla
 */
export const evaluarCondiciones = (
  shipment: Shipment,
  regla: AutomationRule,
  contexto?: { scoreRiesgo?: number; horasSinMovimiento?: number }
): boolean => {
  const { trigger } = regla;

  switch (trigger.tipo) {
    case 'status_change':
      return shipment.status === trigger.condiciones.nuevoEstado;

    case 'time_threshold':
      const horas = contexto?.horasSinMovimiento || 0;
      return horas >= trigger.condiciones.horasSinMovimiento &&
        trigger.condiciones.estados.includes(shipment.status);

    case 'risk_level':
      const score = contexto?.scoreRiesgo || 0;
      const nivelMap = { 'BAJO': 25, 'MEDIO': 50, 'ALTO': 70, 'CRITICO': 85 };
      const umbral = nivelMap[trigger.condiciones.nivelMinimo as keyof typeof nivelMap] || 50;
      return score >= umbral;

    case 'multiple_attempts':
      // Simular detección de intentos fallidos basado en historial
      const intentos = shipment.detailedInfo?.history?.filter(
        h => h.status?.toLowerCase().includes('intento') ||
             h.status?.toLowerCase().includes('fallido')
      ).length || 0;
      return intentos >= trigger.condiciones.intentosFallidos;

    case 'geographic':
      const ciudad = shipment.detailedInfo?.destination?.toLowerCase() || '';
      return trigger.condiciones.ciudades?.some(
        (c: string) => ciudad.includes(c.toLowerCase())
      ) || false;

    default:
      return false;
  }
};

/**
 * Ejecuta las acciones de una regla para una guía
 */
export const ejecutarAcciones = (
  shipment: Shipment,
  regla: AutomationRule
): WorkflowExecution => {
  const accionesEjecutadas: string[] = [];
  let resultado: 'exito' | 'parcial' | 'fallido' = 'exito';

  for (const accion of regla.acciones) {
    try {
      switch (accion.tipo) {
        case 'send_whatsapp':
          // En producción, aquí se integraría con API de WhatsApp
          accionesEjecutadas.push(`WhatsApp: ${accion.parametros.mensaje?.substring(0, 50)}...`);
          break;

        case 'create_alert':
          accionesEjecutadas.push(`Alerta creada: ${accion.parametros.tipo}`);
          break;

        case 'tag_priority':
          accionesEjecutadas.push(`Etiquetado: ${accion.parametros.nivel}`);
          break;

        case 'escalate':
          accionesEjecutadas.push(`Escalado a: ${accion.parametros.nivel}`);
          break;

        case 'notify_team':
          accionesEjecutadas.push(`Notificación enviada a: ${accion.parametros.canal}`);
          break;

        case 'schedule_call':
          accionesEjecutadas.push(`Llamada programada con prioridad: ${accion.parametros.prioridad}`);
          break;

        default:
          accionesEjecutadas.push(`Acción: ${accion.tipo}`);
      }
    } catch (error) {
      resultado = 'parcial';
    }
  }

  if (accionesEjecutadas.length === 0) {
    resultado = 'fallido';
  }

  return {
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    reglaId: regla.id,
    nombreRegla: regla.nombre,
    guiaId: shipment.id,
    accionesEjecutadas,
    resultado,
    timestamp: new Date().toISOString(),
    detalles: `Procesado ${accionesEjecutadas.length} acciones`
  };
};

/**
 * Procesa todas las guías contra las reglas activas
 */
export const procesarAutomatizaciones = (
  shipments: Shipment[],
  reglas: AutomationRule[],
  contextos?: Map<string, { scoreRiesgo?: number; horasSinMovimiento?: number }>
): { ejecuciones: WorkflowExecution[]; alertas: SmartAlert[] } => {
  const ejecuciones: WorkflowExecution[] = [];
  const alertas: SmartAlert[] = [];

  const reglasActivas = reglas.filter(r => r.activo).sort((a, b) => a.prioridad - b.prioridad);

  for (const shipment of shipments) {
    const contexto = contextos?.get(shipment.id);

    for (const regla of reglasActivas) {
      if (evaluarCondiciones(shipment, regla, contexto)) {
        const ejecucion = ejecutarAcciones(shipment, regla);
        ejecuciones.push(ejecucion);

        // Generar alertas si corresponde
        const accionAlerta = regla.acciones.find(a => a.tipo === 'create_alert');
        if (accionAlerta) {
          alertas.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tipo: accionAlerta.parametros.tipo || 'informativo',
            titulo: regla.nombre,
            mensaje: accionAlerta.parametros.mensaje || 'Alerta automática',
            guiasAfectadas: [shipment.id],
            timestamp: new Date().toISOString(),
            leido: false,
            accionRecomendada: regla.acciones[0]?.tipo,
            reglaOrigen: regla.id
          });
        }
      }
    }
  }

  return { ejecuciones, alertas };
};

/**
 * Genera alertas inteligentes basadas en análisis de datos
 */
export const generarAlertasInteligentes = (shipments: Shipment[]): SmartAlert[] => {
  const alertas: SmartAlert[] = [];
  const now = new Date();

  // Guías críticas (más de 48h sin movimiento)
  const guiasCriticas = shipments.filter(s => {
    if (s.status === 'delivered') return false;
    const lastUpdate = s.detailedInfo?.history?.[0]?.date;
    if (!lastUpdate) return false;
    const horasSinUpdate = (now.getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);
    return horasSinUpdate > 48;
  });

  if (guiasCriticas.length > 0) {
    alertas.push({
      id: `alert_criticas_${Date.now()}`,
      tipo: 'critico',
      titulo: 'Guías sin movimiento crítico',
      mensaje: `${guiasCriticas.length} guías llevan más de 48 horas sin actualización`,
      guiasAfectadas: guiasCriticas.map(g => g.id),
      timestamp: now.toISOString(),
      leido: false,
      accionRecomendada: 'Contactar transportadora inmediatamente'
    });
  }

  // Guías en oficina por mucho tiempo
  const enOficina = shipments.filter(s => s.status === 'in_office');
  if (enOficina.length > 5) {
    alertas.push({
      id: `alert_oficina_${Date.now()}`,
      tipo: 'urgente',
      titulo: 'Acumulación en oficina',
      mensaje: `${enOficina.length} guías esperando en oficina destino`,
      guiasAfectadas: enOficina.map(g => g.id),
      timestamp: now.toISOString(),
      leido: false,
      accionRecomendada: 'Contactar clientes para retiro'
    });
  }

  // Alta tasa de novedades
  const conNovedad = shipments.filter(s => s.status === 'issue');
  const tasaNovedad = shipments.length > 0 ? (conNovedad.length / shipments.length) * 100 : 0;
  if (tasaNovedad > 15) {
    alertas.push({
      id: `alert_novedad_${Date.now()}`,
      tipo: 'urgente',
      titulo: 'Alta tasa de novedades',
      mensaje: `${Math.round(tasaNovedad)}% de guías con novedad - revisar causas`,
      guiasAfectadas: conNovedad.map(g => g.id),
      timestamp: now.toISOString(),
      leido: false,
      accionRecomendada: 'Analizar patrones de novedad'
    });
  }

  // Éxito en entregas
  const entregados = shipments.filter(s => s.status === 'delivered');
  const tasaEntrega = shipments.length > 0 ? (entregados.length / shipments.length) * 100 : 0;
  if (tasaEntrega > 90) {
    alertas.push({
      id: `alert_exito_${Date.now()}`,
      tipo: 'exito',
      titulo: 'Excelente tasa de entrega',
      mensaje: `${Math.round(tasaEntrega)}% de entregas exitosas hoy`,
      guiasAfectadas: [],
      timestamp: now.toISOString(),
      leido: false
    });
  }

  return alertas;
};

/**
 * Obtiene reglas guardadas o crea las predefinidas
 */
export const obtenerReglas = (): AutomationRule[] => {
  const saved = localStorage.getItem('litper_automation_rules');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing saved rules:', e);
    }
  }

  // Crear reglas predefinidas
  const reglas = reglasAutomaticasPredefinidas.map((r, idx) => ({
    ...r,
    id: `rule_${idx}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ejecutados: 0
  }));

  localStorage.setItem('litper_automation_rules', JSON.stringify(reglas));
  return reglas;
};

/**
 * Guarda reglas actualizadas
 */
export const guardarReglas = (reglas: AutomationRule[]): void => {
  localStorage.setItem('litper_automation_rules', JSON.stringify(reglas));
};

/**
 * Obtiene historial de ejecuciones
 */
export const obtenerHistorialEjecuciones = (): WorkflowExecution[] => {
  const saved = localStorage.getItem('litper_automation_history');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
};

/**
 * Guarda ejecución en historial
 */
export const guardarEjecucion = (ejecucion: WorkflowExecution): void => {
  const historial = obtenerHistorialEjecuciones();
  historial.unshift(ejecucion);
  // Mantener solo las últimas 100 ejecuciones
  const limitado = historial.slice(0, 100);
  localStorage.setItem('litper_automation_history', JSON.stringify(limitado));
};

/**
 * Obtiene alertas pendientes
 */
export const obtenerAlertas = (): SmartAlert[] => {
  const saved = localStorage.getItem('litper_smart_alerts');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
};

/**
 * Guarda alertas
 */
export const guardarAlertas = (alertas: SmartAlert[]): void => {
  localStorage.setItem('litper_smart_alerts', JSON.stringify(alertas));
};

/**
 * Marca alerta como leída
 */
export const marcarAlertaLeida = (alertaId: string): void => {
  const alertas = obtenerAlertas();
  const idx = alertas.findIndex(a => a.id === alertaId);
  if (idx >= 0) {
    alertas[idx].leido = true;
    guardarAlertas(alertas);
  }
};

export default {
  evaluarCondiciones,
  ejecutarAcciones,
  procesarAutomatizaciones,
  generarAlertasInteligentes,
  obtenerReglas,
  guardarReglas,
  obtenerHistorialEjecuciones,
  guardarEjecucion,
  obtenerAlertas,
  guardarAlertas,
  marcarAlertaLeida
};
