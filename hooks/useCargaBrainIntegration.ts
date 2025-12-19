// hooks/useCargaBrainIntegration.ts
// Integración entre el sistema de cargas y el Cerebro Central

import { useEffect, useCallback } from 'react';
import { useCargaStore } from '../stores/cargaStore';
import { GuiaCarga } from '../types/carga.types';
import {
  centralBrain,
  dataUnifier,
  journeyBuilder,
  knowledgeHub,
  alertManager,
  eventBus,
  ShipmentJourney,
} from '../services/brain';
import { TrackingData } from '../services/brain/unification/ShipmentMatcher';

interface BrainIntegrationResult {
  // Funciones para sincronizar con el cerebro
  sincronizarConCerebro: () => void;
  obtenerJourneyGuia: (numeroGuia: string) => ShipmentJourney | null;
  analizarCargaActual: () => void;

  // Estado
  isAnalyzing: boolean;
  lastSync: Date | null;
}

export function useCargaBrainIntegration(): BrainIntegrationResult {
  const { cargaActual, agregarGuias } = useCargaStore();

  // Sincronizar guías de la carga actual con el Cerebro Central
  const sincronizarConCerebro = useCallback(() => {
    if (!cargaActual || cargaActual.guias.length === 0) return;

    console.log('🧠 Sincronizando carga con Cerebro Central...');

    // Convertir GuiaCarga a TrackingData para el unificador
    const trackingDataList: TrackingData[] = cargaActual.guias.map(guiaToTrackingData);

    // Unificar datos (sin Dropi en este caso, solo tracking)
    const resultado = dataUnifier.unifyBulk(trackingDataList, []);

    // Registrar cada envío unificado en el cerebro
    resultado.unified.forEach(shipment => {
      centralBrain.registerShipment(shipment);
    });

    console.log(`✅ ${resultado.unified.length} envíos sincronizados con el Cerebro`);

    // Emitir evento de sincronización
    eventBus.emit('data.synchronized', {
      cargaId: cargaActual.id,
      totalGuias: cargaActual.totalGuias,
      sincronizadas: resultado.unified.length,
    });
  }, [cargaActual]);

  // Obtener el journey visual de una guía
  const obtenerJourneyGuia = useCallback((numeroGuia: string): ShipmentJourney | null => {
    // Buscar en la carga actual
    const guia = cargaActual?.guias.find(g => g.numeroGuia === numeroGuia);
    if (!guia) return null;

    // Convertir a TrackingData
    const trackingData = guiaToTrackingData(guia);

    // Construir journey
    return journeyBuilder.buildFromRawData(trackingData, null);
  }, [cargaActual]);

  // Analizar la carga actual con el sistema de conocimiento
  const analizarCargaActual = useCallback(() => {
    if (!cargaActual || cargaActual.guias.length < 5) {
      console.log('⚠️ Se necesitan al menos 5 guías para analizar patrones');
      return;
    }

    console.log('🔍 Analizando carga actual...');

    // Primero sincronizar
    sincronizarConCerebro();

    // Ejecutar análisis de conocimiento
    const reporte = knowledgeHub.analyze();

    console.log(`📊 Análisis completado:
      - Patrones encontrados: ${reporte.patterns.length}
      - Insights generados: ${reporte.insights.length}
      - Envíos de alto riesgo: ${reporte.predictions.highRiskShipments}
    `);

    // Crear alertas basadas en el análisis
    if (reporte.predictions.highRiskShipments > 0) {
      alertManager.createAlert({
        severity: 'warning',
        title: `${reporte.predictions.highRiskShipments} envíos en riesgo`,
        message: `Se detectaron ${reporte.predictions.highRiskShipments} envíos con alto riesgo de retraso o novedad`,
        category: 'analysis',
        autoResolvable: false,
      });
    }
  }, [cargaActual, sincronizarConCerebro]);

  // Escuchar eventos del cerebro para actualizar la carga
  useEffect(() => {
    // Cuando el cerebro detecta una actualización de estado
    const unsubscribeUpdate = eventBus.on('shipment.updated', (event) => {
      const { trackingNumber, newStatus } = event.payload as {
        trackingNumber: string;
        newStatus: string;
      };

      // Buscar y actualizar en la carga actual
      if (cargaActual) {
        const guiaIndex = cargaActual.guias.findIndex(
          g => g.numeroGuia === trackingNumber
        );

        if (guiaIndex >= 0) {
          // Actualizar estado de la guía
          const guiaActualizada = {
            ...cargaActual.guias[guiaIndex],
            estado: newStatus,
          };

          console.log(`🔄 Actualización recibida del cerebro: ${trackingNumber} -> ${newStatus}`);
        }
      }
    });

    // Cuando hay una alerta de novedad
    const unsubscribeAlert = eventBus.on('shipment.issue', (event) => {
      const { trackingNumber, issueDescription } = event.payload as {
        trackingNumber: string;
        issueDescription: string;
      };

      // Marcar novedad en la guía
      if (cargaActual) {
        const guiaIndex = cargaActual.guias.findIndex(
          g => g.numeroGuia === trackingNumber
        );

        if (guiaIndex >= 0) {
          console.log(`⚠️ Novedad detectada: ${trackingNumber} - ${issueDescription}`);
        }
      }
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeAlert();
    };
  }, [cargaActual]);

  // Auto-sincronizar cuando cambia la carga
  useEffect(() => {
    if (cargaActual && cargaActual.guias.length > 0) {
      // Sincronizar después de un pequeño delay para evitar muchas llamadas
      const timer = setTimeout(() => {
        sincronizarConCerebro();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cargaActual?.id, cargaActual?.guias.length]);

  return {
    sincronizarConCerebro,
    obtenerJourneyGuia,
    analizarCargaActual,
    isAnalyzing: false,
    lastSync: null,
  };
}

// ==================== HELPERS ====================

/**
 * Convertir GuiaCarga a TrackingData para el unificador
 */
function guiaToTrackingData(guia: GuiaCarga): TrackingData {
  return {
    trackingNumber: guia.numeroGuia,
    status: guia.estado,
    carrier: guia.transportadora,
    location: guia.ciudadDestino,
    lastUpdate: guia.fechaUltimoMovimiento
      ? new Date(guia.fechaUltimoMovimiento)
      : new Date(),
    events: guia.historialEventos?.map(evt => ({
      date: new Date(evt.fecha),
      description: evt.descripcion,
      location: evt.ubicacion,
      status: evt.estado,
    })) || [],
    phone: guia.telefono,
    customerName: guia.nombreCliente,
    destination: guia.ciudadDestino,
    daysInTransit: guia.diasTransito,
  };
}

export default useCargaBrainIntegration;
