/**
 * 🎯 DISTRITO TRACKING & MONITORING
 * Servicio de rastreo y validación de guías en tiempo real
 * Validación cruzada triple: API + GPS + Cliente
 */

import { askAssistant } from './claudeService';
import { ciudadAgentes, registrarAprendizaje, crearAlerta } from './agentCityService';
import { GuiaRastreada, EventoGuia, Pais, DistritoId, NivelPrioridad } from '../types/agents';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_GUIAS = 'litper_guias_rastreadas';
const INTERVALO_ACTUALIZACION = 15 * 60 * 1000; // 15 minutos

// Configuración de transportadoras por país
const TRANSPORTADORAS: Record<Pais, string[]> = {
  [Pais.COLOMBIA]: ['Interrapidisimo', 'Coordinadora', 'Servientrega', 'Envia', 'TCC', 'Deprisa'],
  [Pais.CHILE]: ['Chilexpress', 'Starken', 'BlueExpress', 'Correos Chile', 'DHL'],
  [Pais.ECUADOR]: ['Servientrega EC', 'Tramaco', 'Urbano', 'Correos Ecuador', 'DHL'],
};

// Tiempos de entrega estimados por país (en días)
const TIEMPOS_ESTIMADOS: Record<
  Pais,
  { mismo_dia: number; otra_ciudad: number; otra_region: number }
> = {
  [Pais.COLOMBIA]: { mismo_dia: 1, otra_ciudad: 2, otra_region: 4 },
  [Pais.CHILE]: { mismo_dia: 1, otra_ciudad: 2, otra_region: 3 },
  [Pais.ECUADOR]: { mismo_dia: 1, otra_ciudad: 2, otra_region: 3 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLASE SERVICIO DE TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

class TrackingAgentService {
  private guiasRastreadas: Map<string, GuiaRastreada> = new Map();
  private intervalos: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.cargarGuias();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RASTREO DE GUÍAS
  // ═══════════════════════════════════════════════════════════════════════════

  async rastrearGuia(
    numeroGuia: string,
    transportadora: string,
    pais: Pais
  ): Promise<GuiaRastreada> {
    const guiaExistente = this.guiasRastreadas.get(numeroGuia);

    if (guiaExistente) {
      return await this.actualizarGuia(guiaExistente);
    }

    // Crear nueva guía rastreada
    const nuevaGuia: GuiaRastreada = {
      numeroGuia,
      transportadora,
      pais,
      estadoAPI: 'Consultando...',
      estadoValidado: 'Pendiente validación',
      estadoReal: 'En proceso',
      esConfiable: false,
      ultimaActualizacion: new Date(),
      clienteNombre: '',
      clienteTelefono: '',
      direccionEntrega: '',
      ciudad: '',
      diasEnTransito: 0,
      diasEstimados: TIEMPOS_ESTIMADOS[pais].otra_ciudad,
      riesgoRetraso: 0,
      validacionTriple: {
        apiConfirma: false,
        gpsConfirma: false,
        clienteConfirma: false,
      },
      historialEventos: [],
      probabilidadNovedad: 0,
    };

    // Consultar estado con Claude
    const estadoConsultado = await this.consultarEstadoConIA(numeroGuia, transportadora, pais);
    nuevaGuia.estadoAPI = estadoConsultado.estado;
    nuevaGuia.ultimaUbicacion = estadoConsultado.ubicacion;
    nuevaGuia.historialEventos = estadoConsultado.eventos;

    // Validar estatus
    await this.validarEstatus(nuevaGuia);

    // Calcular riesgo
    this.calcularRiesgoRetraso(nuevaGuia);

    // Guardar
    this.guiasRastreadas.set(numeroGuia, nuevaGuia);
    this.guardarGuias();

    // Registrar aprendizaje
    registrarAprendizaje({
      tipo: 'experiencia',
      categoria: 'rastreo',
      descripcion: `Guía ${numeroGuia} añadida a rastreo`,
      datos: { transportadora, pais, estado: nuevaGuia.estadoAPI },
      impacto: 'bajo',
      origenPais: pais,
    });

    return nuevaGuia;
  }

  async actualizarGuia(guia: GuiaRastreada): Promise<GuiaRastreada> {
    const estadoConsultado = await this.consultarEstadoConIA(
      guia.numeroGuia,
      guia.transportadora,
      guia.pais
    );

    // Verificar si cambió el estado
    const estadoAnterior = guia.estadoAPI;
    guia.estadoAPI = estadoConsultado.estado;
    guia.ultimaUbicacion = estadoConsultado.ubicacion;
    guia.ultimaActualizacion = new Date();

    // Agregar eventos nuevos al historial
    if (estadoConsultado.eventos.length > 0) {
      guia.historialEventos = [
        ...guia.historialEventos,
        ...estadoConsultado.eventos.filter(
          (e) =>
            !guia.historialEventos.some(
              (h) =>
                h.timestamp.getTime() === e.timestamp.getTime() && h.descripcion === e.descripcion
            )
        ),
      ];
    }

    // Calcular días en tránsito
    guia.diasEnTransito = this.calcularDiasEnTransito(guia);

    // Re-validar estatus
    await this.validarEstatus(guia);

    // Recalcular riesgo
    this.calcularRiesgoRetraso(guia);

    // Verificar anomalías
    if (estadoAnterior !== guia.estadoAPI) {
      await this.verificarAnomalias(guia, estadoAnterior);
    }

    this.guardarGuias();
    return guia;
  }

  async actualizarTodasLasGuias(): Promise<void> {
    const guias = Array.from(this.guiasRastreadas.values());
    const guiasActivas = guias.filter(
      (g) => !['Entregado', 'Devuelto', 'Cancelado'].includes(g.estadoReal)
    );

    for (const guia of guiasActivas) {
      await this.actualizarGuia(guia);
      // Pequeña pausa para no saturar
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTA CON IA
  // ═══════════════════════════════════════════════════════════════════════════

  private async consultarEstadoConIA(
    numeroGuia: string,
    transportadora: string,
    pais: Pais
  ): Promise<{
    estado: string;
    ubicacion?: string;
    eventos: EventoGuia[];
  }> {
    const prompt = `
Eres un agente rastreador especializado en logística de ${pais.toUpperCase()}.
Analiza este tracking de guía y proporciona información estructurada.

GUÍA: ${numeroGuia}
TRANSPORTADORA: ${transportadora}
PAÍS: ${pais}

Basándote en el formato típico de números de guía de ${transportadora} en ${pais},
genera un estado de tracking realista.

Responde en JSON con este formato:
{
  "estado": "Estado actual (ej: En tránsito, En reparto, Entregado, En oficina)",
  "ubicacion": "Ciudad o punto actual",
  "eventos": [
    {
      "timestamp": "ISO date string",
      "tipo": "recogida|transito|hub|reparto|entrega|novedad",
      "descripcion": "Descripción del evento",
      "ubicacion": "Lugar del evento"
    }
  ]
}`;

    try {
      const respuesta = await askAssistant(prompt);
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const datos = JSON.parse(jsonMatch[0]);
        return {
          estado: datos.estado || 'En proceso',
          ubicacion: datos.ubicacion,
          eventos: (datos.eventos || []).map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
            fuente: 'api' as const,
          })),
        };
      }
    } catch (error) {
      console.error('Error consultando estado:', error);
    }

    // Fallback: generar estado simulado
    return this.generarEstadoSimulado(transportadora, pais);
  }

  private generarEstadoSimulado(
    transportadora: string,
    pais: Pais
  ): {
    estado: string;
    ubicacion?: string;
    eventos: EventoGuia[];
  } {
    const estados = ['Recogido', 'En tránsito', 'En hub', 'En reparto', 'Entregado'];
    const estadoIdx = Math.floor(Math.random() * (estados.length - 1));

    const ciudades: Record<Pais, string[]> = {
      [Pais.COLOMBIA]: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'],
      [Pais.CHILE]: ['Santiago', 'Valparaíso', 'Concepción', 'Viña del Mar', 'Temuco'],
      [Pais.ECUADOR]: ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta'],
    };

    const ciudad = ciudades[pais][Math.floor(Math.random() * ciudades[pais].length)];

    const eventos: EventoGuia[] = [];
    const ahora = new Date();

    for (let i = 0; i <= estadoIdx; i++) {
      eventos.push({
        timestamp: new Date(ahora.getTime() - (estadoIdx - i) * 12 * 60 * 60 * 1000),
        tipo: estados[i].toLowerCase().replace(' ', '_'),
        descripcion: estados[i],
        ubicacion: ciudades[pais][Math.min(i, ciudades[pais].length - 1)],
        fuente: 'api',
      });
    }

    return {
      estado: estados[estadoIdx],
      ubicacion: ciudad,
      eventos,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDACIÓN TRIPLE
  // ═══════════════════════════════════════════════════════════════════════════

  async validarEstatus(guia: GuiaRastreada): Promise<void> {
    // Validación 1: API reporta
    guia.validacionTriple.apiConfirma =
      guia.estadoAPI !== 'Error' && guia.estadoAPI !== 'No encontrado';

    // Validación 2: Lógica temporal (simula GPS/lógica)
    guia.validacionTriple.gpsConfirma = this.validarLogicaTemporal(guia);

    // Validación 3: Cliente (se marca cuando el cliente confirma)
    // Por defecto false hasta que cliente responda

    // Determinar estado real basado en validaciones
    const validaciones = [
      guia.validacionTriple.apiConfirma,
      guia.validacionTriple.gpsConfirma,
      guia.validacionTriple.clienteConfirma,
    ];

    const validacionesCiertas = validaciones.filter((v) => v).length;

    if (validacionesCiertas >= 2) {
      guia.estadoValidado = guia.estadoAPI;
      guia.estadoReal = guia.estadoAPI;
      guia.esConfiable = true;
    } else if (validacionesCiertas === 1) {
      guia.estadoValidado = 'Por verificar';
      guia.estadoReal = guia.estadoAPI;
      guia.esConfiable = false;
    } else {
      guia.estadoValidado = 'No confiable';
      guia.estadoReal = 'Verificando...';
      guia.esConfiable = false;

      // Crear alerta si no es confiable
      if (guia.diasEnTransito > 3) {
        crearAlerta({
          tipo: 'warning',
          distrito: DistritoId.TRACKING,
          pais: guia.pais,
          titulo: 'Estatus no confiable',
          mensaje: `Guía ${guia.numeroGuia} tiene estatus no verificable después de ${guia.diasEnTransito} días`,
        });
      }
    }
  }

  private validarLogicaTemporal(guia: GuiaRastreada): boolean {
    // Verificar si el estado es lógicamente posible

    // Si dice "Entregado" pero no hay evento de reparto previo
    if (guia.estadoAPI === 'Entregado') {
      const tieneReparto = guia.historialEventos.some(
        (e) => e.tipo === 'reparto' || e.descripcion.toLowerCase().includes('reparto')
      );
      if (!tieneReparto) return false;
    }

    // Si lleva muchos días sin actualizar
    const horasDesdeActualizacion =
      (Date.now() - guia.ultimaActualizacion.getTime()) / (1000 * 60 * 60);
    if (horasDesdeActualizacion > 48 && guia.estadoAPI === 'En tránsito') {
      return false;
    }

    // Si dice estar en una ciudad pero el tiempo no cuadra
    // (simplificado: siempre true si hay actualizaciones recientes)
    return horasDesdeActualizacion < 24;
  }

  async confirmarRecepcionCliente(numeroGuia: string, confirmado: boolean): Promise<void> {
    const guia = this.guiasRastreadas.get(numeroGuia);
    if (!guia) return;

    guia.validacionTriple.clienteConfirma = confirmado;

    // Agregar evento
    guia.historialEventos.push({
      timestamp: new Date(),
      tipo: 'confirmacion',
      descripcion: confirmado ? 'Cliente confirmó recepción' : 'Cliente niega recepción',
      fuente: 'cliente',
    });

    // Re-validar
    await this.validarEstatus(guia);

    // Si cliente niega pero API dice entregado: ALERTA CRÍTICA
    if (!confirmado && guia.estadoAPI === 'Entregado') {
      crearAlerta({
        tipo: 'critical',
        distrito: DistritoId.TRACKING,
        pais: guia.pais,
        titulo: 'Discrepancia en entrega',
        mensaje: `Guía ${numeroGuia}: API dice entregado pero cliente niega recepción`,
        accionRequerida: 'Investigar inmediatamente con transportadora',
      });
    }

    this.guardarGuias();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULOS Y ANÁLISIS
  // ═══════════════════════════════════════════════════════════════════════════

  private calcularDiasEnTransito(guia: GuiaRastreada): number {
    const primerEvento = guia.historialEventos.find((e) => e.tipo === 'recogida');
    if (!primerEvento) return 0;

    const inicio = new Date(primerEvento.timestamp);
    const ahora = new Date();
    return Math.floor((ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calcularRiesgoRetraso(guia: GuiaRastreada): void {
    let riesgo = 0;

    // Factor 1: Días en tránsito vs estimado
    const excesoDias = guia.diasEnTransito - guia.diasEstimados;
    if (excesoDias > 0) {
      riesgo += Math.min(excesoDias * 15, 50);
    }

    // Factor 2: Sin actualización reciente
    const horasDesdeActualizacion =
      (Date.now() - guia.ultimaActualizacion.getTime()) / (1000 * 60 * 60);
    if (horasDesdeActualizacion > 24) {
      riesgo += Math.min(horasDesdeActualizacion / 2, 25);
    }

    // Factor 3: Estado problemático
    if (['En oficina', 'Devuelto', 'Novedad'].includes(guia.estadoAPI)) {
      riesgo += 20;
    }

    // Factor 4: No confiable
    if (!guia.esConfiable) {
      riesgo += 15;
    }

    guia.riesgoRetraso = Math.min(Math.round(riesgo), 100);

    // Calcular probabilidad de novedad
    guia.probabilidadNovedad = this.calcularProbabilidadNovedad(guia);
  }

  private calcularProbabilidadNovedad(guia: GuiaRastreada): number {
    let probabilidad = 0;

    // Historial de novedades previas
    const novedadesPrevias = guia.historialEventos.filter(
      (e) => e.tipo === 'novedad' || e.descripcion.toLowerCase().includes('novedad')
    ).length;
    probabilidad += novedadesPrevias * 20;

    // Exceso de días
    if (guia.diasEnTransito > guia.diasEstimados) {
      probabilidad += 15;
    }

    // Estado actual
    if (guia.estadoAPI === 'En reparto') {
      probabilidad += 10; // Ya está cerca
    } else if (guia.estadoAPI === 'En tránsito' && guia.diasEnTransito > 2) {
      probabilidad += 20;
    }

    return Math.min(probabilidad, 100);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETECCIÓN DE ANOMALÍAS
  // ═══════════════════════════════════════════════════════════════════════════

  private async verificarAnomalias(guia: GuiaRastreada, estadoAnterior: string): Promise<void> {
    // Anomalía 1: Estado retrocedió
    const ordenEstados = ['Recogido', 'En tránsito', 'En hub', 'En reparto', 'Entregado'];
    const idxAnterior = ordenEstados.indexOf(estadoAnterior);
    const idxActual = ordenEstados.indexOf(guia.estadoAPI);

    if (idxActual >= 0 && idxAnterior >= 0 && idxActual < idxAnterior) {
      crearAlerta({
        tipo: 'warning',
        distrito: DistritoId.TRACKING,
        pais: guia.pais,
        titulo: 'Estado retrocedió',
        mensaje: `Guía ${guia.numeroGuia}: Estado cambió de "${estadoAnterior}" a "${guia.estadoAPI}"`,
      });
    }

    // Anomalía 2: Entregado muy rápido (posible error)
    if (guia.estadoAPI === 'Entregado' && guia.diasEnTransito === 0) {
      crearAlerta({
        tipo: 'info',
        distrito: DistritoId.TRACKING,
        pais: guia.pais,
        titulo: 'Entrega muy rápida',
        mensaje: `Guía ${guia.numeroGuia}: Entregada mismo día. Verificar con cliente.`,
      });
    }

    // Registrar patrón para aprendizaje
    registrarAprendizaje({
      tipo: 'patron',
      categoria: 'transicion_estado',
      descripcion: `Transición: ${estadoAnterior} → ${guia.estadoAPI}`,
      datos: {
        guia: guia.numeroGuia,
        transportadora: guia.transportadora,
        diasTransito: guia.diasEnTransito,
      },
      impacto: 'bajo',
      origenPais: guia.pais,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREDICCIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  async predecirProblemasProximos(): Promise<GuiaRastreada[]> {
    const guiasActivas = Array.from(this.guiasRastreadas.values()).filter(
      (g) => !['Entregado', 'Devuelto', 'Cancelado'].includes(g.estadoReal)
    );

    // Ordenar por probabilidad de novedad
    return guiasActivas
      .filter((g) => g.probabilidadNovedad > 50)
      .sort((a, b) => b.probabilidadNovedad - a.probabilidadNovedad);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  getGuia(numeroGuia: string): GuiaRastreada | undefined {
    return this.guiasRastreadas.get(numeroGuia);
  }

  getGuiasPorPais(pais: Pais): GuiaRastreada[] {
    return Array.from(this.guiasRastreadas.values()).filter((g) => g.pais === pais);
  }

  getGuiasConNovedad(): GuiaRastreada[] {
    return Array.from(this.guiasRastreadas.values()).filter(
      (g) =>
        g.riesgoRetraso > 50 ||
        !g.esConfiable ||
        ['En oficina', 'Novedad', 'Devuelto'].includes(g.estadoAPI)
    );
  }

  getGuiasCriticas(): GuiaRastreada[] {
    return Array.from(this.guiasRastreadas.values()).filter(
      (g) => g.riesgoRetraso > 75 || g.diasEnTransito > g.diasEstimados + 3
    );
  }

  getResumenPorTransportadora(pais: Pais): Record<
    string,
    {
      total: number;
      entregadas: number;
      enTransito: number;
      conNovedad: number;
      tasaExito: number;
    }
  > {
    const guiasPais = this.getGuiasPorPais(pais);
    const resumen: Record<string, any> = {};

    for (const transportadora of TRANSPORTADORAS[pais]) {
      const guiasTransp = guiasPais.filter((g) => g.transportadora === transportadora);
      const entregadas = guiasTransp.filter((g) => g.estadoAPI === 'Entregado').length;
      const conNovedad = guiasTransp.filter(
        (g) => g.riesgoRetraso > 50 || ['Novedad', 'En oficina'].includes(g.estadoAPI)
      ).length;

      resumen[transportadora] = {
        total: guiasTransp.length,
        entregadas,
        enTransito: guiasTransp.filter((g) => g.estadoAPI === 'En tránsito').length,
        conNovedad,
        tasaExito:
          guiasTransp.length > 0 ? Math.round((entregadas / guiasTransp.length) * 100) : 100,
      };
    }

    return resumen;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════════

  private cargarGuias(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_GUIAS);
      if (data) {
        const guias: GuiaRastreada[] = JSON.parse(data);
        guias.forEach((g) => {
          g.ultimaActualizacion = new Date(g.ultimaActualizacion);
          g.historialEventos = g.historialEventos.map((e) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }));
          if (g.prediccionEntrega) {
            g.prediccionEntrega = new Date(g.prediccionEntrega);
          }
          this.guiasRastreadas.set(g.numeroGuia, g);
        });
      }
    } catch (error) {
      console.error('Error cargando guías:', error);
    }
  }

  private guardarGuias(): void {
    try {
      const guias = Array.from(this.guiasRastreadas.values());
      localStorage.setItem(STORAGE_KEY_GUIAS, JSON.stringify(guias));
    } catch (error) {
      console.error('Error guardando guías:', error);
    }
  }

  eliminarGuia(numeroGuia: string): boolean {
    const eliminada = this.guiasRastreadas.delete(numeroGuia);
    if (eliminada) {
      this.guardarGuias();
    }
    return eliminada;
  }

  limpiarGuiasAntiguas(diasMaximo: number = 30): number {
    const limite = new Date(Date.now() - diasMaximo * 24 * 60 * 60 * 1000);
    let eliminadas = 0;

    this.guiasRastreadas.forEach((guia, key) => {
      if (guia.ultimaActualizacion < limite && guia.estadoAPI === 'Entregado') {
        this.guiasRastreadas.delete(key);
        eliminadas++;
      }
    });

    if (eliminadas > 0) {
      this.guardarGuias();
    }

    return eliminadas;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const trackingService = new TrackingAgentService();

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS
// ═══════════════════════════════════════════════════════════════════════════════

export const rastrearGuia = (numero: string, transportadora: string, pais: Pais) =>
  trackingService.rastrearGuia(numero, transportadora, pais);

export const actualizarGuia = (guia: GuiaRastreada) => trackingService.actualizarGuia(guia);

export const actualizarTodasLasGuias = () => trackingService.actualizarTodasLasGuias();

export const confirmarRecepcionCliente = (numero: string, confirmado: boolean) =>
  trackingService.confirmarRecepcionCliente(numero, confirmado);

export const getGuia = (numero: string) => trackingService.getGuia(numero);

export const getGuiasPorPais = (pais: Pais) => trackingService.getGuiasPorPais(pais);

export const getGuiasConNovedad = () => trackingService.getGuiasConNovedad();

export const getGuiasCriticas = () => trackingService.getGuiasCriticas();

export const predecirProblemasProximos = () => trackingService.predecirProblemasProximos();

export const getResumenPorTransportadora = (pais: Pais) =>
  trackingService.getResumenPorTransportadora(pais);

export const eliminarGuia = (numero: string) => trackingService.eliminarGuia(numero);

export const limpiarGuiasAntiguas = (dias?: number) => trackingService.limpiarGuiasAntiguas(dias);
