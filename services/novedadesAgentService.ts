/**
 * 🚨 DISTRITO CRISIS MANAGEMENT
 * Servicio de solución de novedades, reintentos y recuperación de paquetes
 * Gestión de hasta 3 reintentos + llamadas a reclamo en oficina
 */

import { askAssistant } from './claudeService';
import { registrarAprendizaje, crearAlerta } from './agentCityService';
import {
  Novedad,
  GestionNovedad,
  TipoNovedad,
  Pais,
  DistritoId,
  NivelPrioridad,
  CanalComunicacion,
  ESTRATEGIAS_NOVEDAD,
} from '../types/agents';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_NOVEDADES = 'litper_novedades';
const MAX_REINTENTOS = 3;

// Mensajes por tipo de novedad y país
const MENSAJES_WHATSAPP: Record<TipoNovedad, Record<Pais, string>> = {
  [TipoNovedad.CLIENTE_NO_ESTABA]: {
    [Pais.COLOMBIA]: `Hola! 📦 Intentamos entregar tu pedido pero no te encontramos.

¿Qué prefieres?
1️⃣ Programar nueva hora
2️⃣ Cambiar dirección
3️⃣ Recoger en punto cercano

Responde con el número de tu opción 😊`,
    [Pais.CHILE]: `Hola! 📦 Pasamos a dejar tu pedido pero no estabas.

¿Qué prefieres?
1️⃣ Programar nueva hora
2️⃣ Cambiar dirección
3️⃣ Recoger en punto cercano

Responde con el número de tu opción 😊`,
    [Pais.ECUADOR]: `Hola! 📦 Intentamos entregar tu pedido pero no te encontramos.

¿Qué prefieres?
1️⃣ Programar nueva hora
2️⃣ Cambiar dirección
3️⃣ Recoger en punto cercano

Responde con el número de tu opción 😊`,
  },
  [TipoNovedad.DIRECCION_INCORRECTA]: {
    [Pais.COLOMBIA]: `Hola! 📍 No pudimos encontrar la dirección que nos diste.

Por favor envíame tu dirección completa:
• Calle/Carrera y número
• Barrio
• Ciudad
• Referencias (edificio, color de puerta, etc.)`,
    [Pais.CHILE]: `Hola! 📍 No pudimos encontrar la dirección que nos diste.

Por favor envíame tu dirección completa:
• Calle y número
• Comuna
• Ciudad
• Referencias (edificio, departamento, etc.)`,
    [Pais.ECUADOR]: `Hola! 📍 No pudimos encontrar la dirección que nos diste.

Por favor envíame tu dirección completa:
• Calle y número
• Sector/Barrio
• Ciudad
• Referencias`,
  },
  [TipoNovedad.TELEFONO_NO_CONTESTA]: {
    [Pais.COLOMBIA]: `Hola! 📞 Hemos intentado llamarte pero no hemos podido contactarte.

Tu paquete está listo para entrega. ¿Puedes confirmar:
1️⃣ Tu número de teléfono correcto
2️⃣ El mejor horario para llamarte

¡Queremos entregarte lo antes posible! 📦`,
    [Pais.CHILE]: `Hola! 📞 Hemos intentado contactarte sin éxito.

Tu paquete está listo. ¿Puedes confirmar:
1️⃣ Tu número de teléfono correcto
2️⃣ El mejor horario para llamarte

¡Queremos entregarte lo antes posible! 📦`,
    [Pais.ECUADOR]: `Hola! 📞 Hemos intentado llamarte pero no contestas.

Tu paquete está listo. ¿Puedes confirmar:
1️⃣ Tu número de teléfono correcto
2️⃣ El mejor horario para llamarte

¡Queremos entregarte lo antes posible! 📦`,
  },
  [TipoNovedad.REHUSADO]: {
    [Pais.COLOMBIA]: `Hola 👋 Vimos que no pudiste recibir el paquete.

¿Hubo algún problema con el producto o simplemente cambiaste de opinión?

Podemos:
1️⃣ Cambiar por otro producto
2️⃣ Hacer devolución fácil
3️⃣ Resolver cualquier duda

Estamos para ayudarte 😊`,
    [Pais.CHILE]: `Hola 👋 Vimos que no pudiste recibir el paquete.

¿Hubo algún problema con el producto?

Podemos:
1️⃣ Cambiar por otro producto
2️⃣ Hacer devolución fácil
3️⃣ Resolver cualquier duda

Estamos para ayudarte 😊`,
    [Pais.ECUADOR]: `Hola 👋 Vimos que no pudiste recibir el paquete.

¿Hubo algún problema?

Podemos:
1️⃣ Cambiar por otro producto
2️⃣ Hacer devolución fácil
3️⃣ Resolver cualquier duda

Estamos para ayudarte 😊`,
  },
  [TipoNovedad.PAQUETE_DANADO]: {
    [Pais.COLOMBIA]: `Hola 😔 Lamentamos mucho que tu paquete llegó dañado.

Esto NO debería pasar y tomaremos acción inmediata:

1️⃣ Te enviamos un reemplazo GRATIS
2️⃣ Sin necesidad de devolver el dañado
3️⃣ Prioridad en la entrega

¿Te parece bien? Te confirmo el nuevo envío en minutos.`,
    [Pais.CHILE]: `Hola 😔 Lamentamos mucho que tu paquete llegó dañado.

Esto NO debería pasar y tomaremos acción inmediata:

1️⃣ Te enviamos un reemplazo GRATIS
2️⃣ Sin necesidad de devolver el dañado
3️⃣ Prioridad en la entrega

¿Te parece bien?`,
    [Pais.ECUADOR]: `Hola 😔 Lamentamos mucho que tu paquete llegó dañado.

Esto NO debería pasar:

1️⃣ Te enviamos un reemplazo GRATIS
2️⃣ Sin necesidad de devolver el dañado
3️⃣ Prioridad en la entrega

¿Te parece bien?`,
  },
  [TipoNovedad.RECLAMO_OFICINA]: {
    [Pais.COLOMBIA]: `Hola! 📦 Tu paquete está en oficina esperándote:

📍 Dirección: [OFICINA]
🕐 Horario: Lun-Vie 8AM-6PM, Sáb 9AM-1PM
🆔 Lleva tu cédula

⚠️ Tienes 5 días para recogerlo.

¿Prefieres que te lo llevemos? Responde:
1️⃣ Recoger en oficina
2️⃣ Programar nueva entrega`,
    [Pais.CHILE]: `Hola! 📦 Tu paquete está en oficina:

📍 Dirección: [OFICINA]
🕐 Horario: Lun-Vie 9AM-6PM, Sáb 9AM-1PM
🆔 Lleva tu RUT

⚠️ Tienes 5 días para recogerlo.

¿Prefieres que te lo llevemos? Responde:
1️⃣ Recoger en oficina
2️⃣ Programar nueva entrega`,
    [Pais.ECUADOR]: `Hola! 📦 Tu paquete está en oficina:

📍 Dirección: [OFICINA]
🕐 Horario: Lun-Vie 8AM-5PM
🆔 Lleva tu cédula

⚠️ Tienes 5 días para recogerlo.

¿Prefieres que te lo llevemos? Responde:
1️⃣ Recoger en oficina
2️⃣ Programar nueva entrega`,
  },
  [TipoNovedad.OTRO]: {
    [Pais.COLOMBIA]: `Hola! 📦 Tenemos una novedad con tu envío.

Por favor contáctanos para resolverlo lo antes posible.
Estamos para ayudarte 😊`,
    [Pais.CHILE]: `Hola! 📦 Tenemos una novedad con tu envío.

Por favor contáctanos para resolverlo.
Estamos para ayudarte 😊`,
    [Pais.ECUADOR]: `Hola! 📦 Tenemos una novedad con tu envío.

Por favor contáctanos para resolverlo.
Estamos para ayudarte 😊`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASE SERVICIO DE NOVEDADES
// ═══════════════════════════════════════════════════════════════════════════════

class NovedadesAgentService {
  private novedades: Map<string, Novedad> = new Map();

  constructor() {
    this.cargarNovedades();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREACIÓN DE NOVEDADES
  // ═══════════════════════════════════════════════════════════════════════════

  crearNovedad(datos: {
    guiaId: string;
    tipo: TipoNovedad;
    descripcion: string;
    pais: Pais;
    ciudad: string;
    clienteNombre: string;
    clienteTelefono: string;
  }): Novedad {
    const estrategia = ESTRATEGIAS_NOVEDAD[datos.tipo];

    const novedad: Novedad = {
      id: `NOV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      guiaId: datos.guiaId,
      tipo: datos.tipo,
      descripcion: datos.descripcion,
      pais: datos.pais,
      ciudad: datos.ciudad,
      estado: 'nueva',
      prioridad: estrategia.prioridad,
      intentoActual: 0,
      maxIntentos: MAX_REINTENTOS,
      gestiones: [],
      clienteNombre: datos.clienteNombre,
      clienteTelefono: datos.clienteTelefono,
      clienteContactado: false,
      creadaEn: new Date(),
      ultimaActualizacion: new Date(),
    };

    this.novedades.set(novedad.id, novedad);
    this.guardarNovedades();

    // Crear alerta según prioridad
    if (novedad.prioridad >= NivelPrioridad.ALTA) {
      crearAlerta({
        tipo: novedad.prioridad >= NivelPrioridad.CRITICA ? 'critical' : 'warning',
        distrito: DistritoId.CRISIS,
        pais: datos.pais,
        titulo: `Nueva novedad: ${datos.tipo}`,
        mensaje: `Guía ${datos.guiaId} - ${datos.clienteNombre} - ${datos.ciudad}`,
      });
    }

    // Iniciar gestión automática
    this.iniciarGestionAutomatica(novedad);

    return novedad;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN AUTOMÁTICA
  // ═══════════════════════════════════════════════════════════════════════════

  private async iniciarGestionAutomatica(novedad: Novedad): Promise<void> {
    novedad.estado = 'en_gestion';
    novedad.intentoActual = 1;
    novedad.ultimaActualizacion = new Date();

    const estrategia = ESTRATEGIAS_NOVEDAD[novedad.tipo];
    const primeraAccion = estrategia.acciones[0];

    if (primeraAccion) {
      await this.ejecutarAccion(novedad, primeraAccion.canal, primeraAccion.mensaje);
    }

    this.guardarNovedades();
  }

  async ejecutarAccion(
    novedad: Novedad,
    canal: CanalComunicacion,
    descripcionAccion: string
  ): Promise<GestionNovedad> {
    const gestion: GestionNovedad = {
      id: `GEST_${Date.now()}`,
      timestamp: new Date(),
      agenteId: `SOLVER_${novedad.pais.toUpperCase()}_AUTO`,
      accion: descripcionAccion,
      canal,
      resultado: 'pendiente',
    };

    // Simular envío según canal
    switch (canal) {
      case CanalComunicacion.WHATSAPP:
        gestion.notas = this.enviarWhatsApp(novedad);
        break;
      case CanalComunicacion.LLAMADA:
        gestion.notas = await this.realizarLlamada(novedad);
        break;
      case CanalComunicacion.SMS:
        gestion.notas = this.enviarSMS(novedad);
        break;
      case CanalComunicacion.EMAIL:
        gestion.notas = this.enviarEmail(novedad);
        break;
    }

    novedad.gestiones.push(gestion);
    novedad.clienteContactado = true;
    novedad.ultimaActualizacion = new Date();

    this.guardarNovedades();

    // Registrar aprendizaje
    registrarAprendizaje({
      tipo: 'experiencia',
      categoria: 'gestion_novedad',
      descripcion: `Gestión ${novedad.tipo} vía ${canal}`,
      datos: {
        tipo: novedad.tipo,
        canal,
        intento: novedad.intentoActual,
        pais: novedad.pais,
      },
      impacto: 'medio',
      origenPais: novedad.pais,
    });

    return gestion;
  }

  private enviarWhatsApp(novedad: Novedad): string {
    const mensaje = MENSAJES_WHATSAPP[novedad.tipo][novedad.pais];
    // En producción: integrar con WhatsApp Business API
    console.log(`[WhatsApp] Enviando a ${novedad.clienteTelefono}:`, mensaje);
    return `WhatsApp enviado a ${novedad.clienteTelefono}`;
  }

  private async realizarLlamada(novedad: Novedad): Promise<string> {
    // Generar script de llamada con IA
    const script = await this.generarScriptLlamada(novedad);
    // En producción: integrar con servicio de llamadas VoIP/Eleven Labs
    console.log(`[Llamada] Llamando a ${novedad.clienteTelefono}`);
    console.log('Script:', script);
    return `Llamada programada a ${novedad.clienteTelefono}`;
  }

  private enviarSMS(novedad: Novedad): string {
    const mensajeCorto = `Litper: Tu paquete requiere atención. Responde WhatsApp o llama al [NUMERO]`;
    console.log(`[SMS] Enviando a ${novedad.clienteTelefono}:`, mensajeCorto);
    return `SMS enviado a ${novedad.clienteTelefono}`;
  }

  private enviarEmail(novedad: Novedad): string {
    console.log(`[Email] Enviando sobre novedad ${novedad.id}`);
    return `Email enviado`;
  }

  private async generarScriptLlamada(novedad: Novedad): Promise<string> {
    const prompt = `
Genera un script de llamada telefónica empático para resolver esta novedad:

TIPO: ${novedad.tipo}
CLIENTE: ${novedad.clienteNombre}
PAÍS: ${novedad.pais}
DESCRIPCIÓN: ${novedad.descripcion}
INTENTO: ${novedad.intentoActual} de ${novedad.maxIntentos}

El script debe ser:
- Corto y directo
- Empático y profesional
- Con opciones claras para el cliente
- En español de ${novedad.pais}

Genera solo el script, sin explicaciones.`;

    try {
      return await askAssistant(prompt);
    } catch {
      return `Hola ${novedad.clienteNombre}, le llamo de Litper sobre su envío...`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPUESTA DEL CLIENTE
  // ═══════════════════════════════════════════════════════════════════════════

  async procesarRespuestaCliente(
    novedadId: string,
    respuesta: string,
    canal: CanalComunicacion
  ): Promise<{ accion: string; siguientePaso?: string }> {
    const novedad = this.novedades.get(novedadId);
    if (!novedad) {
      return { accion: 'error', siguientePaso: 'Novedad no encontrada' };
    }

    // Analizar respuesta con IA
    const analisis = await this.analizarRespuesta(novedad, respuesta);

    // Registrar gestión
    const gestion: GestionNovedad = {
      id: `GEST_${Date.now()}`,
      timestamp: new Date(),
      agenteId: 'RESPONSE_PROCESSOR',
      accion: `Cliente respondió: "${respuesta}"`,
      canal,
      resultado: analisis.esPositiva ? 'exitoso' : 'pendiente',
      notas: analisis.interpretacion,
    };

    novedad.gestiones.push(gestion);
    novedad.clienteRespuesta = respuesta;
    novedad.ultimaActualizacion = new Date();

    // Tomar acción según análisis
    if (analisis.esPositiva) {
      // Respuesta positiva - proceder con solución
      novedad.solucionAplicada = analisis.solucion;

      if (analisis.requiereAccionAdicional) {
        gestion.siguientePaso = analisis.siguienteAccion;
      } else {
        novedad.estado = 'resuelta';
        novedad.fechaResolucion = new Date();
      }
    } else if (analisis.esNegativa) {
      // Respuesta negativa - escalar o siguiente intento
      if (novedad.intentoActual >= novedad.maxIntentos) {
        novedad.estado = 'escalada';
        crearAlerta({
          tipo: 'warning',
          distrito: DistritoId.CRISIS,
          pais: novedad.pais,
          titulo: 'Novedad escalada',
          mensaje: `${novedad.guiaId} - Cliente no acepta soluciones después de ${novedad.maxIntentos} intentos`,
        });
      } else {
        novedad.intentoActual++;
        gestion.siguientePaso = 'Intentar con siguiente estrategia';
      }
    } else {
      // Respuesta ambigua - pedir clarificación
      gestion.siguientePaso = 'Solicitar clarificación al cliente';
    }

    this.guardarNovedades();

    return {
      accion: analisis.accion,
      siguientePaso: gestion.siguientePaso,
    };
  }

  private async analizarRespuesta(
    novedad: Novedad,
    respuesta: string
  ): Promise<{
    esPositiva: boolean;
    esNegativa: boolean;
    interpretacion: string;
    accion: string;
    solucion?: string;
    requiereAccionAdicional: boolean;
    siguienteAccion?: string;
  }> {
    const prompt = `
Analiza esta respuesta del cliente sobre una novedad de envío:

TIPO NOVEDAD: ${novedad.tipo}
OPCIONES OFRECIDAS: ${MENSAJES_WHATSAPP[novedad.tipo][novedad.pais]}
RESPUESTA CLIENTE: "${respuesta}"

Responde en JSON:
{
  "esPositiva": boolean,
  "esNegativa": boolean,
  "interpretacion": "qué entendiste de la respuesta",
  "accion": "qué acción tomar",
  "solucion": "solución a aplicar si es positiva",
  "requiereAccionAdicional": boolean,
  "siguienteAccion": "siguiente paso si requiere más"
}`;

    try {
      const respuestaIA = await askAssistant(prompt);
      const jsonMatch = respuestaIA.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error analizando respuesta:', error);
    }

    // Fallback: análisis simple
    const respuestaLower = respuesta.toLowerCase();
    const palabrasPositivas = ['sí', 'si', 'ok', 'vale', 'bueno', 'perfecto', '1', '2', '3'];
    const palabrasNegativas = ['no', 'nunca', 'cancelar', 'devolver', 'malo'];

    return {
      esPositiva: palabrasPositivas.some((p) => respuestaLower.includes(p)),
      esNegativa: palabrasNegativas.some((p) => respuestaLower.includes(p)),
      interpretacion: 'Análisis automático de respuesta',
      accion: 'procesar_manualmente',
      requiereAccionAdicional: true,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REINTENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  async ejecutarReintento(novedadId: string): Promise<boolean> {
    const novedad = this.novedades.get(novedadId);
    if (!novedad) return false;

    if (novedad.intentoActual >= novedad.maxIntentos) {
      // Máximo de reintentos alcanzado - enviar a oficina
      await this.enviarAOficina(novedad);
      return false;
    }

    novedad.intentoActual++;
    novedad.ultimaActualizacion = new Date();

    const estrategia = ESTRATEGIAS_NOVEDAD[novedad.tipo];
    const accionIdx = Math.min(novedad.intentoActual - 1, estrategia.acciones.length - 1);
    const accion = estrategia.acciones[accionIdx];

    if (accion) {
      await this.ejecutarAccion(
        novedad,
        accion.canal,
        `Reintento ${novedad.intentoActual}: ${accion.mensaje}`
      );
    }

    this.guardarNovedades();
    return true;
  }

  private async enviarAOficina(novedad: Novedad): Promise<void> {
    novedad.tipo = TipoNovedad.RECLAMO_OFICINA;
    novedad.ultimaActualizacion = new Date();

    // Notificar cliente sobre paquete en oficina
    await this.ejecutarAccion(
      novedad,
      CanalComunicacion.WHATSAPP,
      'Paquete enviado a oficina para reclamo'
    );

    // Programar llamadas de recuperación
    this.programarLlamadaRecuperacion(novedad);

    this.guardarNovedades();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECUPERACIÓN DE PAQUETES EN OFICINA
  // ═══════════════════════════════════════════════════════════════════════════

  async programarLlamadaRecuperacion(novedad: Novedad): Promise<void> {
    // Programar llamada para día 3
    const fechaLlamada = new Date();
    fechaLlamada.setDate(fechaLlamada.getDate() + 3);

    crearAlerta({
      tipo: 'info',
      distrito: DistritoId.CRISIS,
      pais: novedad.pais,
      titulo: 'Llamada de recuperación programada',
      mensaje: `${novedad.guiaId} - Llamar ${fechaLlamada.toLocaleDateString()} para recuperar paquete en oficina`,
      accionRequerida: 'Ejecutar llamada de recuperación',
    });

    registrarAprendizaje({
      tipo: 'experiencia',
      categoria: 'reclamo_oficina',
      descripcion: 'Paquete enviado a reclamo en oficina',
      datos: {
        guiaId: novedad.guiaId,
        intentos: novedad.intentoActual,
        ciudad: novedad.ciudad,
      },
      impacto: 'alto',
      origenPais: novedad.pais,
    });
  }

  async ejecutarLlamadaRecuperacion(novedadId: string): Promise<{
    exito: boolean;
    resultado: string;
  }> {
    const novedad = this.novedades.get(novedadId);
    if (!novedad) {
      return { exito: false, resultado: 'Novedad no encontrada' };
    }

    // Generar script especial para recuperación
    const script = await this.generarScriptRecuperacion(novedad);

    const gestion: GestionNovedad = {
      id: `GEST_${Date.now()}`,
      timestamp: new Date(),
      agenteId: `RECOVERY_${novedad.pais.toUpperCase()}`,
      accion: 'Llamada de recuperación de paquete',
      canal: CanalComunicacion.LLAMADA,
      resultado: 'pendiente',
      notas: script,
    };

    novedad.gestiones.push(gestion);
    novedad.ultimaActualizacion = new Date();
    this.guardarNovedades();

    return {
      exito: true,
      resultado: 'Llamada de recuperación ejecutada',
    };
  }

  private async generarScriptRecuperacion(novedad: Novedad): Promise<string> {
    const prompt = `
Genera un script de llamada empático pero efectivo para recuperar un paquete que lleva días en oficina:

CLIENTE: ${novedad.clienteNombre}
PAÍS: ${novedad.pais}
CIUDAD: ${novedad.ciudad}
DÍAS EN OFICINA: ${Math.floor((Date.now() - novedad.creadaEn.getTime()) / (1000 * 60 * 60 * 24))}

El script debe:
- Mostrar preocupación genuina por el cliente
- Ofrecer 3 alternativas claras (recoger, nueva entrega, punto cercano)
- Mencionar urgencia sin presionar agresivamente
- Ser breve y en español de ${novedad.pais}

Genera solo el script.`;

    try {
      return await askAssistant(prompt);
    } catch {
      return `Hola ${novedad.clienteNombre}, le llamo de Litper. Su paquete está en nuestra oficina esperándolo...`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESOLUCIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  resolverNovedad(novedadId: string, solucion: string): boolean {
    const novedad = this.novedades.get(novedadId);
    if (!novedad) return false;

    novedad.estado = 'resuelta';
    novedad.solucionAplicada = solucion;
    novedad.fechaResolucion = new Date();
    novedad.ultimaActualizacion = new Date();

    // Agregar gestión final
    novedad.gestiones.push({
      id: `GEST_${Date.now()}`,
      timestamp: new Date(),
      agenteId: 'RESOLVER',
      accion: `Novedad resuelta: ${solucion}`,
      canal: CanalComunicacion.CHAT_WEB,
      resultado: 'exitoso',
    });

    // Registrar aprendizaje de éxito
    registrarAprendizaje({
      tipo: 'experiencia',
      categoria: 'resolucion_exitosa',
      descripcion: `${novedad.tipo} resuelto: ${solucion}`,
      datos: {
        tipo: novedad.tipo,
        intentos: novedad.intentoActual,
        tiempoResolucion:
          (novedad.fechaResolucion.getTime() - novedad.creadaEn.getTime()) / (1000 * 60 * 60),
      },
      impacto: 'medio',
      origenPais: novedad.pais,
    });

    this.guardarNovedades();
    return true;
  }

  marcarComoPerdida(novedadId: string, motivo: string): boolean {
    const novedad = this.novedades.get(novedadId);
    if (!novedad) return false;

    novedad.estado = 'perdida';
    novedad.ultimaActualizacion = new Date();

    novedad.gestiones.push({
      id: `GEST_${Date.now()}`,
      timestamp: new Date(),
      agenteId: 'SYSTEM',
      accion: `Marcado como perdido: ${motivo}`,
      canal: CanalComunicacion.CHAT_WEB,
      resultado: 'exitoso',
    });

    // Registrar para análisis
    registrarAprendizaje({
      tipo: 'error',
      categoria: 'perdida',
      descripcion: `Paquete perdido: ${motivo}`,
      datos: {
        tipo: novedad.tipo,
        intentos: novedad.intentoActual,
        ciudad: novedad.ciudad,
      },
      impacto: 'alto',
      origenPais: novedad.pais,
    });

    crearAlerta({
      tipo: 'error',
      distrito: DistritoId.CRISIS,
      pais: novedad.pais,
      titulo: 'Paquete perdido',
      mensaje: `${novedad.guiaId} - ${motivo}`,
    });

    this.guardarNovedades();
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTAS
  // ═══════════════════════════════════════════════════════════════════════════

  getNovedad(id: string): Novedad | undefined {
    return this.novedades.get(id);
  }

  getNovedadesPorPais(pais: Pais): Novedad[] {
    return Array.from(this.novedades.values()).filter((n) => n.pais === pais);
  }

  getNovedadesActivas(): Novedad[] {
    return Array.from(this.novedades.values()).filter((n) =>
      ['nueva', 'en_gestion'].includes(n.estado)
    );
  }

  getNovedadesPorEstado(estado: Novedad['estado']): Novedad[] {
    return Array.from(this.novedades.values()).filter((n) => n.estado === estado);
  }

  getNovedadesEnOficina(): Novedad[] {
    return Array.from(this.novedades.values()).filter(
      (n) => n.tipo === TipoNovedad.RECLAMO_OFICINA && n.estado !== 'resuelta'
    );
  }

  getEstadisticas(pais?: Pais) {
    let novedades = Array.from(this.novedades.values());
    if (pais) {
      novedades = novedades.filter((n) => n.pais === pais);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const novedadesHoy = novedades.filter((n) => n.creadaEn >= hoy);
    const resueltasHoy = novedades.filter(
      (n) => n.estado === 'resuelta' && n.fechaResolucion && n.fechaResolucion >= hoy
    );

    const activas = novedades.filter((n) => ['nueva', 'en_gestion'].includes(n.estado));

    const porTipo: Record<TipoNovedad, number> = {
      [TipoNovedad.CLIENTE_NO_ESTABA]: 0,
      [TipoNovedad.DIRECCION_INCORRECTA]: 0,
      [TipoNovedad.TELEFONO_NO_CONTESTA]: 0,
      [TipoNovedad.REHUSADO]: 0,
      [TipoNovedad.PAQUETE_DANADO]: 0,
      [TipoNovedad.RECLAMO_OFICINA]: 0,
      [TipoNovedad.OTRO]: 0,
    };

    activas.forEach((n) => {
      porTipo[n.tipo]++;
    });

    // Calcular tasa de éxito de reintentos
    const conReintentos = novedades.filter((n) => n.intentoActual > 1);
    const exitosReintento1 = novedades.filter(
      (n) => n.intentoActual === 1 && n.estado === 'resuelta'
    ).length;
    const exitosReintento2 = novedades.filter(
      (n) => n.intentoActual === 2 && n.estado === 'resuelta'
    ).length;
    const exitosReintento3 = novedades.filter(
      (n) => n.intentoActual === 3 && n.estado === 'resuelta'
    ).length;

    return {
      total: novedades.length,
      activas: activas.length,
      nuevasHoy: novedadesHoy.length,
      resueltasHoy: resueltasHoy.length,
      enOficina: this.getNovedadesEnOficina().length,
      escaladas: novedades.filter((n) => n.estado === 'escalada').length,
      perdidas: novedades.filter((n) => n.estado === 'perdida').length,
      tasaResolucion:
        novedades.length > 0
          ? (
              (novedades.filter((n) => n.estado === 'resuelta').length / novedades.length) *
              100
            ).toFixed(1)
          : '100',
      porTipo,
      tasasReintento: {
        reintento1:
          conReintentos.length > 0 ? Math.round((exitosReintento1 / novedades.length) * 100) : 0,
        reintento2:
          conReintentos.length > 0 ? Math.round((exitosReintento2 / novedades.length) * 100) : 0,
        reintento3:
          conReintentos.length > 0 ? Math.round((exitosReintento3 / novedades.length) * 100) : 0,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════════

  private cargarNovedades(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NOVEDADES);
      if (data) {
        const novedades: Novedad[] = JSON.parse(data);
        novedades.forEach((n) => {
          n.creadaEn = new Date(n.creadaEn);
          n.ultimaActualizacion = new Date(n.ultimaActualizacion);
          if (n.fechaResolucion) n.fechaResolucion = new Date(n.fechaResolucion);
          n.gestiones = n.gestiones.map((g) => ({
            ...g,
            timestamp: new Date(g.timestamp),
          }));
          this.novedades.set(n.id, n);
        });
      }
    } catch (error) {
      console.error('Error cargando novedades:', error);
    }
  }

  private guardarNovedades(): void {
    try {
      const novedades = Array.from(this.novedades.values());
      localStorage.setItem(STORAGE_KEY_NOVEDADES, JSON.stringify(novedades));
    } catch (error) {
      console.error('Error guardando novedades:', error);
    }
  }

  eliminarNovedad(id: string): boolean {
    const eliminada = this.novedades.delete(id);
    if (eliminada) this.guardarNovedades();
    return eliminada;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const novedadesService = new NovedadesAgentService();

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS
// ═══════════════════════════════════════════════════════════════════════════════

export const crearNovedad = (datos: Parameters<typeof novedadesService.crearNovedad>[0]) =>
  novedadesService.crearNovedad(datos);

export const ejecutarAccion = (novedad: Novedad, canal: CanalComunicacion, descripcion: string) =>
  novedadesService.ejecutarAccion(novedad, canal, descripcion);

export const procesarRespuestaCliente = (id: string, respuesta: string, canal: CanalComunicacion) =>
  novedadesService.procesarRespuestaCliente(id, respuesta, canal);

export const ejecutarReintento = (id: string) => novedadesService.ejecutarReintento(id);

export const ejecutarLlamadaRecuperacion = (id: string) =>
  novedadesService.ejecutarLlamadaRecuperacion(id);

export const resolverNovedad = (id: string, solucion: string) =>
  novedadesService.resolverNovedad(id, solucion);

export const marcarComoPerdida = (id: string, motivo: string) =>
  novedadesService.marcarComoPerdida(id, motivo);

export const getNovedad = (id: string) => novedadesService.getNovedad(id);

export const getNovedadesPorPais = (pais: Pais) => novedadesService.getNovedadesPorPais(pais);

export const getNovedadesActivas = () => novedadesService.getNovedadesActivas();

export const getNovedadesPorEstado = (estado: Novedad['estado']) =>
  novedadesService.getNovedadesPorEstado(estado);

export const getNovedadesEnOficina = () => novedadesService.getNovedadesEnOficina();

export const getEstadisticasNovedades = (pais?: Pais) => novedadesService.getEstadisticas(pais);
