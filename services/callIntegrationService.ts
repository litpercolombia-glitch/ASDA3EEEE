// services/callIntegrationService.ts
// Servicio de Integración de Llamadas Automatizadas
// Integra Eleven Labs para voz + OpenAI para scripts dinámicos

// ============================================
// INTERFACES
// ============================================

export interface CallConfig {
  elevenLabsApiKey?: string;
  openAIApiKey?: string;
  defaultVoiceId: string;
  defaultLanguage: 'es-CO' | 'es-CL' | 'es-EC' | 'es-MX';
  maxConcurrentCalls: number;
  retryAttempts: number;
  callHours: {
    start: number; // 8 = 8 AM
    end: number;   // 18 = 6 PM
  };
}

export interface CallScript {
  type: CallScriptType;
  greeting: string;
  mainMessage: string;
  questions: string[];
  closingPositive: string;
  closingNegative: string;
  fallbackMessage: string;
}

export type CallScriptType =
  | 'RECLAMO_OFICINA'
  | 'NO_ESTABA'
  | 'DIRECCION_ERRADA'
  | 'RECHAZO_PEDIDO'
  | 'NO_CANCELA_VALOR'
  | 'CONFIRMAR_ENTREGA'
  | 'RECORDATORIO_RETIRO'
  | 'VERIFICAR_DATOS';

export interface CallRequest {
  id: string;
  guideNumber: string;
  phone: string;
  customerName?: string;
  scriptType: CallScriptType;
  variables: Record<string, string>;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  scheduledTime?: Date;
  status: CallStatus;
  attempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  result?: CallResult;
}

export type CallStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface CallResult {
  answered: boolean;
  duration: number;
  outcome: 'POSITIVE' | 'NEGATIVE' | 'NO_ANSWER' | 'BUSY' | 'INVALID_NUMBER' | 'CALLBACK_REQUESTED';
  notes?: string;
  customerResponse?: string;
  nextAction?: string;
  timestamp: Date;
}

export interface CallQueueStats {
  totalPending: number;
  totalScheduled: number;
  totalCompleted: number;
  totalFailed: number;
  successRate: number;
  avgDuration: number;
  todaysCalls: number;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'litper_call_queue';

const DEFAULT_CONFIG: CallConfig = {
  defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Sofia voice ID de Eleven Labs
  defaultLanguage: 'es-CO',
  maxConcurrentCalls: 3,
  retryAttempts: 2,
  callHours: {
    start: 8,
    end: 18,
  },
};

// Scripts predefinidos por tipo de novedad
const CALL_SCRIPTS: Record<CallScriptType, CallScript> = {
  RECLAMO_OFICINA: {
    type: 'RECLAMO_OFICINA',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le llamamos de {empresa} respecto a su pedido con guía {guideNumber}. Su paquete está en la oficina de {transportadora} ubicada en {ubicacion}. Es importante que lo recoja pronto ya que después de 5 días hábiles será devuelto al remitente.',
    questions: [
      '¿Puede pasar a recogerlo hoy o mañana?',
      '¿Necesita la dirección exacta de la oficina?',
      '¿Hay algún inconveniente para ir a recogerlo?',
    ],
    closingPositive: 'Perfecto, le esperamos entonces. Recuerde llevar su cédula. ¡Que tenga buen día!',
    closingNegative: 'Entiendo. Recuerde que tiene hasta {fechaLimite} para recogerlo. Si no puede, también puede autorizar a otra persona con carta poder. ¿Puedo ayudarle con algo más?',
    fallbackMessage: 'Le dejaremos un mensaje. Su pedido {guideNumber} está en oficina para retiro. Por favor comuníquese con nosotros lo antes posible.',
  },
  NO_ESTABA: {
    type: 'NO_ESTABA',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le llamamos de {empresa}. Intentamos entregar su pedido con guía {guideNumber} pero no encontramos a nadie en la dirección. Queremos coordinar un nuevo intento de entrega.',
    questions: [
      '¿A qué hora estará disponible hoy para recibirlo?',
      '¿La dirección {direccion} es correcta?',
      '¿Hay alguna referencia o indicación especial para el repartidor?',
    ],
    closingPositive: 'Perfecto, reagendaremos la entrega para {horario}. Por favor esté pendiente. ¡Gracias!',
    closingNegative: 'Entiendo. Lo intentaremos nuevamente mañana. Si no podemos contactarlo, el paquete regresará a nuestra bodega.',
    fallbackMessage: 'No pudimos contactarlo. Intentaremos entregar su pedido {guideNumber} nuevamente mañana.',
  },
  DIRECCION_ERRADA: {
    type: 'DIRECCION_ERRADA',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le llamamos de {empresa} porque hay un problema con la dirección de entrega de su pedido {guideNumber}. La dirección actual es {direccion} pero el repartidor no pudo ubicarla.',
    questions: [
      '¿Puede confirmarnos la dirección completa con barrio?',
      '¿Hay alguna referencia como un local o edificio cercano?',
      '¿El número de casa/apartamento está correcto?',
    ],
    closingPositive: 'Perfecto, actualizaremos la dirección a {nuevaDireccion} y programaremos la entrega. ¡Gracias!',
    closingNegative: 'Necesitamos la dirección correcta para poder entregar. Por favor envíela por WhatsApp al número {whatsapp}.',
    fallbackMessage: 'Hay un problema con la dirección de su pedido {guideNumber}. Por favor contáctenos.',
  },
  RECHAZO_PEDIDO: {
    type: 'RECHAZO_PEDIDO',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le llamamos de {empresa} respecto a su pedido {guideNumber}. Vimos que no pudo recibirlo en el último intento de entrega. Queremos ayudarle a resolver cualquier inconveniente.',
    questions: [
      '¿Hubo algún problema con el producto?',
      '¿El valor a pagar era diferente al esperado?',
      '¿Desea que intentemos la entrega nuevamente?',
    ],
    closingPositive: 'Entendido. Programaremos un nuevo intento. Si tiene alguna duda sobre el producto, puede llamarnos.',
    closingNegative: 'Lamentamos que no haya funcionado. El pedido será devuelto y procesaremos la devolución.',
    fallbackMessage: 'Su pedido {guideNumber} fue rechazado. Si desea recibirlo, contáctenos.',
  },
  NO_CANCELA_VALOR: {
    type: 'NO_CANCELA_VALOR',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le llamamos de {empresa} respecto a su pedido {guideNumber}. El valor a pagar es ${valor} contraentrega. Queremos confirmar si tendrá el dinero disponible para cuando llegue el repartidor.',
    questions: [
      '¿Tendrá el valor exacto de ${valor} en efectivo?',
      '¿Prefiere que programemos la entrega para otro día?',
      '¿Hay algún problema con el valor del pedido?',
    ],
    closingPositive: 'Perfecto. El repartidor pasará con cambio pero es mejor tener el monto exacto. ¡Gracias!',
    closingNegative: 'Entiendo. Si el valor no es correcto, puede contactar a la tienda antes de la entrega.',
    fallbackMessage: 'Su pedido {guideNumber} requiere pago de ${valor}. Tenga el dinero listo.',
  },
  CONFIRMAR_ENTREGA: {
    type: 'CONFIRMAR_ENTREGA',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le llamamos de {empresa}. Su pedido {guideNumber} está en camino y llegará hoy entre {horarioInicio} y {horarioFin}. Queremos confirmar que estará disponible para recibirlo.',
    questions: [
      '¿Estará disponible en la dirección {direccion}?',
      '¿Hay alguien más que pueda recibir el pedido?',
    ],
    closingPositive: '¡Excelente! El repartidor llegará en el horario indicado. Tenga a mano ${valor} si es contraentrega.',
    closingNegative: 'Entendido. Si no hay nadie para recibir, el repartidor dejará una notificación para reagendar.',
    fallbackMessage: 'Su pedido {guideNumber} llega hoy. Esté pendiente.',
  },
  RECORDATORIO_RETIRO: {
    type: 'RECORDATORIO_RETIRO',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le recordamos que su pedido {guideNumber} sigue en la oficina de {transportadora}. Solo quedan {diasRestantes} días para recogerlo antes de que sea devuelto.',
    questions: [
      '¿Podrá pasar a recogerlo hoy?',
      '¿Necesita que enviemos la dirección de la oficina?',
    ],
    closingPositive: 'Perfecto. Recuerde llevar su cédula. La oficina está en {ubicacion}.',
    closingNegative: 'Entendido. Le recomendamos ir lo antes posible para evitar la devolución.',
    fallbackMessage: 'URGENTE: Su pedido {guideNumber} será devuelto en {diasRestantes} días si no lo recoge.',
  },
  VERIFICAR_DATOS: {
    type: 'VERIFICAR_DATOS',
    greeting: 'Hola, buenos días. ¿Hablo con {customerName}?',
    mainMessage: 'Le llamamos de {empresa} para verificar los datos de entrega de su pedido {guideNumber}.',
    questions: [
      '¿La dirección {direccion} es correcta?',
      '¿El número de teléfono {telefono} es el mejor para contactarlo?',
      '¿Desea agregar alguna indicación especial para el repartidor?',
    ],
    closingPositive: 'Perfecto, todos los datos están confirmados. Su pedido llegará pronto.',
    closingNegative: 'Actualizaremos la información. Si tiene cambios adicionales, contáctenos.',
    fallbackMessage: 'Necesitamos verificar los datos de su pedido {guideNumber}. Contáctenos.',
  },
};

// ============================================
// CLASE PRINCIPAL
// ============================================

class CallIntegrationService {
  private config: CallConfig;
  private queue: CallRequest[];

  constructor(config?: Partial<CallConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = this.loadQueue();
  }

  // ============================================
  // GESTIÓN DE COLA
  // ============================================

  private loadQueue(): CallRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        lastAttemptAt: r.lastAttemptAt ? new Date(r.lastAttemptAt) : undefined,
        scheduledTime: r.scheduledTime ? new Date(r.scheduledTime) : undefined,
        result: r.result ? { ...r.result, timestamp: new Date(r.result.timestamp) } : undefined,
      }));
    } catch {
      return [];
    }
  }

  private saveQueue(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
  }

  private generateId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // API PÚBLICA
  // ============================================

  /**
   * Añade una llamada a la cola
   */
  addToQueue(request: Omit<CallRequest, 'id' | 'status' | 'attempts' | 'createdAt'>): CallRequest {
    const callRequest: CallRequest = {
      ...request,
      id: this.generateId(),
      status: request.scheduledTime ? 'SCHEDULED' : 'PENDING',
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.push(callRequest);
    this.saveQueue();

    return callRequest;
  }

  /**
   * Añade múltiples llamadas a la cola
   */
  addBulkToQueue(
    guides: Array<{ guideNumber: string; phone: string; customerName?: string }>,
    scriptType: CallScriptType,
    variables: Record<string, string> = {},
    priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
  ): CallRequest[] {
    return guides.map(guide => this.addToQueue({
      guideNumber: guide.guideNumber,
      phone: guide.phone,
      customerName: guide.customerName,
      scriptType,
      variables: { ...variables, guideNumber: guide.guideNumber },
      priority,
    }));
  }

  /**
   * Obtiene el script para un tipo de llamada
   */
  getScript(type: CallScriptType): CallScript {
    return CALL_SCRIPTS[type];
  }

  /**
   * Genera el texto del script con variables reemplazadas
   */
  generateScriptText(type: CallScriptType, variables: Record<string, string>): string {
    const script = this.getScript(type);
    let fullScript = `${script.greeting}\n\n${script.mainMessage}\n\n`;

    script.questions.forEach((q, i) => {
      fullScript += `Pregunta ${i + 1}: ${q}\n`;
    });

    fullScript += `\nRespuesta positiva: ${script.closingPositive}\n`;
    fullScript += `Respuesta negativa: ${script.closingNegative}\n`;
    fullScript += `\nSi no contestan: ${script.fallbackMessage}`;

    // Reemplazar variables
    Object.entries(variables).forEach(([key, value]) => {
      fullScript = fullScript.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return fullScript;
  }

  /**
   * Actualiza el estado de una llamada
   */
  updateCallStatus(callId: string, status: CallStatus, result?: CallResult): void {
    const call = this.queue.find(c => c.id === callId);
    if (call) {
      call.status = status;
      call.lastAttemptAt = new Date();
      if (result) {
        call.result = result;
      }
      if (status === 'FAILED' && call.attempts < this.config.retryAttempts) {
        call.attempts++;
        call.status = 'PENDING';
      }
      this.saveQueue();
    }
  }

  /**
   * Obtiene llamadas pendientes
   */
  getPendingCalls(): CallRequest[] {
    return this.queue
      .filter(c => c.status === 'PENDING' || c.status === 'SCHEDULED')
      .sort((a, b) => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Obtiene estadísticas de la cola
   */
  getStats(): CallQueueStats {
    const today = new Date().toDateString();
    const todaysCalls = this.queue.filter(c =>
      c.createdAt.toDateString() === today
    );

    const completed = this.queue.filter(c => c.status === 'COMPLETED');
    const successful = completed.filter(c => c.result?.answered);

    return {
      totalPending: this.queue.filter(c => c.status === 'PENDING').length,
      totalScheduled: this.queue.filter(c => c.status === 'SCHEDULED').length,
      totalCompleted: completed.length,
      totalFailed: this.queue.filter(c => c.status === 'FAILED').length,
      successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0,
      avgDuration: successful.length > 0
        ? successful.reduce((sum, c) => sum + (c.result?.duration || 0), 0) / successful.length
        : 0,
      todaysCalls: todaysCalls.length,
    };
  }

  /**
   * Cancela una llamada
   */
  cancelCall(callId: string): void {
    const call = this.queue.find(c => c.id === callId);
    if (call && (call.status === 'PENDING' || call.status === 'SCHEDULED')) {
      call.status = 'CANCELLED';
      this.saveQueue();
    }
  }

  /**
   * Limpia llamadas completadas antiguas
   */
  cleanupOldCalls(daysOld: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const before = this.queue.length;
    this.queue = this.queue.filter(c =>
      c.status === 'PENDING' ||
      c.status === 'SCHEDULED' ||
      c.createdAt > cutoffDate
    );
    this.saveQueue();

    return before - this.queue.length;
  }

  /**
   * Verifica si está en horario de llamadas
   */
  isWithinCallHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= this.config.callHours.start && hour < this.config.callHours.end;
  }

  /**
   * Obtiene la próxima ventana de llamadas
   */
  getNextCallWindow(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (now.getHours() >= this.config.callHours.end) {
      // Próximo día
      start.setDate(start.getDate() + 1);
      end.setDate(end.getDate() + 1);
    }

    start.setHours(this.config.callHours.start, 0, 0, 0);
    end.setHours(this.config.callHours.end, 0, 0, 0);

    return { start, end };
  }

  /**
   * Simula una llamada (para testing sin API real)
   */
  async simulateCall(callId: string): Promise<CallResult> {
    const call = this.queue.find(c => c.id === callId);
    if (!call) throw new Error('Call not found');

    call.status = 'IN_PROGRESS';
    this.saveQueue();

    // Simular delay de llamada (2-5 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simular resultado aleatorio
    const outcomes: CallResult['outcome'][] = ['POSITIVE', 'NEGATIVE', 'NO_ANSWER', 'BUSY'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    const answered = outcome === 'POSITIVE' || outcome === 'NEGATIVE';

    const result: CallResult = {
      answered,
      duration: answered ? 30 + Math.floor(Math.random() * 120) : 0,
      outcome,
      notes: answered ? 'Llamada completada' : 'Sin respuesta',
      timestamp: new Date(),
    };

    this.updateCallStatus(callId, answered ? 'COMPLETED' : 'FAILED', result);

    return result;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const callService = new CallIntegrationService();

export default CallIntegrationService;
