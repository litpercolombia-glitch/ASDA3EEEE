/**
 * LITPER - Hook para Inteligencia Logística
 * Permite que cualquier componente acceda a los datos de Inteligencia Logística
 */

import { useState, useEffect, useCallback } from 'react';
import inteligenciaService, {
  GuiaInteligencia,
  SesionInteligencia,
} from '../services/inteligenciaLogisticaService';
import { Shipment } from '../types';

/**
 * Convierte una guía de Inteligencia Logística al formato Shipment
 */
const convertirAShipment = (guia: GuiaInteligencia): Shipment => {
  const estado = (guia.estado || '').toLowerCase();

  // Mapear estado
  let status: Shipment['status'] = 'in_transit';
  if (estado.includes('entregado') || estado.includes('delivered')) {
    status = 'delivered';
  } else if (estado.includes('oficina') || estado.includes('centro')) {
    status = 'in_office';
  } else if (estado.includes('reparto') || estado.includes('tránsito') || estado.includes('transito')) {
    status = 'in_transit';
  } else if (estado.includes('novedad') || estado.includes('devuelto') || estado.includes('rechaz')) {
    status = 'issue';
  }

  return {
    id: guia.guia,
    trackingNumber: guia.guia,
    status,
    carrier: guia.transportadora,
    phone: guia.telefono,
    recipientPhone: guia.telefono,
    senderPhone: '',
    detailedInfo: {
      destination: guia.ciudad || '',
      daysInTransit: guia.dias || 0,
      recipientName: guia.cliente || '',
      productName: guia.producto || '',
      declaredValue: guia.valor,
      deliveryAddress: guia.direccion || '',
    },
  } as Shipment;
};

/**
 * Hook para acceder a los datos de Inteligencia Logística
 */
export const useInteligenciaLogistica = () => {
  const [sesionActiva, setSesionActiva] = useState<SesionInteligencia | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = () => {
      setIsLoading(true);
      const sesion = inteligenciaService.getSesionActiva();
      setSesionActiva(sesion);

      if (sesion) {
        const shipmentsConvertidos = sesion.guias.map(convertirAShipment);
        setShipments(shipmentsConvertidos);
      } else {
        setShipments([]);
      }
      setIsLoading(false);
    };

    cargarDatos();

    // Suscribirse a cambios
    const unsub = inteligenciaService.suscribirse((nuevaSesion) => {
      setSesionActiva(nuevaSesion);
      if (nuevaSesion) {
        const shipmentsConvertidos = nuevaSesion.guias.map(convertirAShipment);
        setShipments(shipmentsConvertidos);
      } else {
        setShipments([]);
      }
    });

    return unsub;
  }, []);

  // Refrescar datos manualmente
  const refrescar = useCallback(() => {
    const sesion = inteligenciaService.getSesionActiva();
    setSesionActiva(sesion);
    if (sesion) {
      const shipmentsConvertidos = sesion.guias.map(convertirAShipment);
      setShipments(shipmentsConvertidos);
    } else {
      setShipments([]);
    }
  }, []);

  // Buscar guía
  const buscarGuia = useCallback((numero: string): Shipment | null => {
    const guia = inteligenciaService.buscarGuia(numero);
    return guia ? convertirAShipment(guia) : null;
  }, []);

  // Obtener estadísticas
  const estadisticas = inteligenciaService.getEstadisticas();

  // Obtener resumen para chat
  const resumenChat = inteligenciaService.getResumenParaChat();

  // Verificar si hay datos
  const tieneDatos = inteligenciaService.tieneDatos();

  return {
    sesionActiva,
    shipments,
    isLoading,
    refrescar,
    buscarGuia,
    estadisticas,
    resumenChat,
    tieneDatos,
    // Funciones directas del servicio
    getGuiasConNovedad: inteligenciaService.getGuiasConNovedad,
    getGuiasEnReparto: inteligenciaService.getGuiasEnReparto,
    formatearGuiaParaChat: inteligenciaService.formatearGuiaParaChat,
  };
};

export default useInteligenciaLogistica;
