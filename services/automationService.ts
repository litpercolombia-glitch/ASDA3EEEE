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
// PLANTILLAS DE MENSAJES WHATSAPP
// =====================================

export interface MessageTemplate {
  id: string;
  nombre: string;
  categoria: 'entrega' | 'novedad' | 'oficina' | 'seguimiento' | 'personalizado';
  mensaje: string;
  variables: string[];
  descripcion: string;
}

export const PLANTILLAS_WHATSAPP: MessageTemplate[] = [
  {
    id: 'entrega_exitosa',
    nombre: 'Entrega Exitosa',
    categoria: 'entrega',
    mensaje: '¡Hola {nombre}! 🎉 Tu paquete con guía {guia} ha sido entregado exitosamente. Gracias por confiar en nosotros.',
    variables: ['nombre', 'guia'],
    descripcion: 'Confirmar entrega exitosa al cliente',
  },
  {
    id: 'en_camino',
    nombre: 'En Camino',
    categoria: 'seguimiento',
    mensaje: '¡Hola {nombre}! 🚚 Tu paquete con guía {guia} está en camino. Transportadora: {transportadora}. Tiempo estimado: {tiempo}.',
    variables: ['nombre', 'guia', 'transportadora', 'tiempo'],
    descripcion: 'Notificar que el paquete salió para entrega',
  },
  {
    id: 'en_oficina',
    nombre: 'Listo en Oficina',
    categoria: 'oficina',
    mensaje: '¡Hola {nombre}! 📦 Tu paquete con guía {guia} está listo para recoger en nuestra oficina ({direccion}). Horario: {horario}.',
    variables: ['nombre', 'guia', 'direccion', 'horario'],
    descripcion: 'Avisar que el paquete está en oficina para retiro',
  },
  {
    id: 'intento_fallido',
    nombre: 'Intento Fallido',
    categoria: 'novedad',
    mensaje: '¡Hola {nombre}! ⚠️ Intentamos entregar tu paquete (guía {guia}) pero no fue posible. Motivo: {motivo}. Reprogramamos para {fecha}.',
    variables: ['nombre', 'guia', 'motivo', 'fecha'],
    descripcion: 'Informar sobre intento de entrega fallido',
  },
  {
    id: 'novedad_direccion',
    nombre: 'Problema Dirección',
    categoria: 'novedad',
    mensaje: '¡Hola {nombre}! 📍 Necesitamos confirmar la dirección de entrega para tu paquete (guía {guia}). ¿Puedes verificar: {direccion}?',
    variables: ['nombre', 'guia', 'direccion'],
    descripcion: 'Solicitar confirmación de dirección',
  },
  {
    id: 'retraso',
    nombre: 'Aviso de Retraso',
    categoria: 'seguimiento',
    mensaje: '¡Hola {nombre}! ⏰ Tu paquete (guía {guia}) está presentando un retraso. Nueva fecha estimada: {fecha}. Disculpa los inconvenientes.',
    variables: ['nombre', 'guia', 'fecha'],
    descripcion: 'Notificar retraso en la entrega',
  },
  {
    id: 'seguimiento_proactivo',
    nombre: 'Seguimiento Proactivo',
    categoria: 'seguimiento',
    mensaje: '¡Hola {nombre}! 📊 Estado de tu envío (guía {guia}): {estado}. Última ubicación: {ubicacion}. ¿Necesitas ayuda?',
    variables: ['nombre', 'guia', 'estado', 'ubicacion'],
    descripcion: 'Enviar actualización proactiva del estado',
  },
  {
    id: 'confirmacion_recepcion',
    nombre: 'Confirmar Recepción',
    categoria: 'entrega',
    mensaje: '¡Hola {nombre}! ¿Recibiste tu paquete (guía {guia}) correctamente? Por favor confirma respondiendo SI o NO.',
    variables: ['nombre', 'guia'],
    descripcion: 'Solicitar confirmación de recepción',
  },
];

// Obtener plantilla por ID
export const obtenerPlantilla = (id: string): MessageTemplate | undefined => {
  return PLANTILLAS_WHATSAPP.find(p => p.id === id);
};

// Renderizar plantilla con variables
export const renderizarPlantilla = (
  plantilla: MessageTemplate,
  variables: Record<string, string>
): string => {
  let mensaje = plantilla.mensaje;
  Object.entries(variables).forEach(([key, value]) => {
    mensaje = mensaje.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return mensaje;
};

// Obtener plantillas por categoría
export const obtenerPlantillasPorCategoria = (categoria: MessageTemplate['categoria']): MessageTemplate[] => {
  return PLANTILLAS_WHATSAPP.filter(p => p.categoria === categoria);
};

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

// =====================================
// CREAR REGLAS PERSONALIZADAS
// =====================================

export interface CrearReglaParams {
  nombre: string;
  descripcion: string;
  triggerTipo: TriggerType;
  triggerCondiciones: Record<string, any>;
  acciones: { tipo: ActionType; parametros: Record<string, any> }[];
  prioridad?: number;
}

/**
 * Crea una nueva regla de automatización personalizada
 */
export const crearReglaPersonalizada = (params: CrearReglaParams): AutomationRule => {
  const nuevaRegla: AutomationRule = {
    id: `rule_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nombre: params.nombre,
    descripcion: params.descripcion,
    activo: true,
    trigger: {
      tipo: params.triggerTipo,
      condiciones: params.triggerCondiciones,
    },
    acciones: params.acciones,
    prioridad: params.prioridad || 2,
    createdAt: new Date().toISOString(),
    ejecutados: 0,
  };

  // Guardar en las reglas existentes
  const reglas = obtenerReglas();
  reglas.push(nuevaRegla);
  guardarReglas(reglas);

  return nuevaRegla;
};

/**
 * Eliminar una regla por ID
 */
export const eliminarRegla = (reglaId: string): boolean => {
  const reglas = obtenerReglas();
  const idx = reglas.findIndex(r => r.id === reglaId);
  if (idx >= 0) {
    reglas.splice(idx, 1);
    guardarReglas(reglas);
    return true;
  }
  return false;
};

/**
 * Actualizar una regla existente
 */
export const actualizarRegla = (reglaId: string, updates: Partial<AutomationRule>): AutomationRule | null => {
  const reglas = obtenerReglas();
  const idx = reglas.findIndex(r => r.id === reglaId);
  if (idx >= 0) {
    reglas[idx] = { ...reglas[idx], ...updates };
    guardarReglas(reglas);
    return reglas[idx];
  }
  return null;
};

/**
 * Reglas predefinidas rápidas para crear
 */
export const PLANTILLAS_REGLAS = [
  {
    id: 'retraso_3_dias',
    nombre: 'Alerta Retraso 3+ días',
    descripcion: 'Alerta cuando una guía lleva más de 3 días sin movimiento',
    config: {
      triggerTipo: 'time_threshold' as TriggerType,
      triggerCondiciones: { horasSinMovimiento: 72, estados: ['in_transit', 'issue'] },
      acciones: [{ tipo: 'create_alert' as ActionType, parametros: { tipo: 'urgente', mensaje: 'Guía sin movimiento por 3+ días' } }],
    },
  },
  {
    id: 'whatsapp_entregado',
    nombre: 'WhatsApp al Entregar',
    descripcion: 'Envía WhatsApp automático cuando se entrega',
    config: {
      triggerTipo: 'status_change' as TriggerType,
      triggerCondiciones: { nuevoEstado: 'delivered' },
      acciones: [{ tipo: 'send_whatsapp' as ActionType, parametros: { plantilla: 'entrega_exitosa', mensaje: 'Entrega confirmada' } }],
    },
  },
  {
    id: 'escalamiento_5_dias',
    nombre: 'Escalar a Supervisor',
    descripcion: 'Escala a supervisor si la guía lleva más de 5 días',
    config: {
      triggerTipo: 'time_threshold' as TriggerType,
      triggerCondiciones: { horasSinMovimiento: 120, estados: ['in_transit', 'issue', 'exception'] },
      acciones: [
        { tipo: 'escalate' as ActionType, parametros: { nivel: 'supervisor', razon: 'Retraso crítico' } },
        { tipo: 'create_alert' as ActionType, parametros: { tipo: 'critico', mensaje: 'Escalado por retraso crítico' } },
      ],
    },
  },
  {
    id: 'notificar_novedad',
    nombre: 'Notificar al Cliente - Novedad',
    descripcion: 'Envía WhatsApp cuando hay una novedad en la entrega',
    config: {
      triggerTipo: 'status_change' as TriggerType,
      triggerCondiciones: { nuevoEstado: 'issue' },
      acciones: [{ tipo: 'send_whatsapp' as ActionType, parametros: { plantilla: 'intento_fallido', mensaje: 'Hubo un problema con tu entrega' } }],
    },
  },
];

/**
 * Crear regla a partir de plantilla
 */
export const crearReglaDesdeTemplate = (templateId: string): AutomationRule | null => {
  const template = PLANTILLAS_REGLAS.find(t => t.id === templateId);
  if (!template) return null;

  return crearReglaPersonalizada({
    nombre: template.nombre,
    descripcion: template.descripcion,
    triggerTipo: template.config.triggerTipo,
    triggerCondiciones: template.config.triggerCondiciones,
    acciones: template.config.acciones,
  });
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
  marcarAlertaLeida,
  // Nuevas funciones
  PLANTILLAS_WHATSAPP,
  obtenerPlantilla,
  renderizarPlantilla,
  obtenerPlantillasPorCategoria,
  crearReglaPersonalizada,
  eliminarRegla,
  actualizarRegla,
  PLANTILLAS_REGLAS,
  crearReglaDesdeTemplate,
};
