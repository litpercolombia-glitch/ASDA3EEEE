/**
 * Custom hook for shipment management
 */

import { useState, useEffect, useCallback } from 'react';
import type { Shipment } from '../types';
import {
  loadShipments,
  saveShipments,
  updateShipmentById,
  deleteShipmentById,
  clearAllShipments,
} from '../services/logisticsService';
import { logError } from '../utils/errorHandler';

export function useShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load shipments on mount
  useEffect(() => {
    try {
      const loaded = loadShipments();
      setShipments(loaded);
      setError(null);
    } catch (err) {
      const message = 'Error al cargar envíos guardados';
      logError(err, 'useShipments.load');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save shipments whenever they change
  useEffect(() => {
    if (!isLoading && shipments.length > 0) {
      try {
        saveShipments(shipments);
      } catch (err) {
        logError(err, 'useShipments.save');
      }
    }
  }, [shipments, isLoading]);

  const addShipment = useCallback((shipment: Shipment) => {
    setShipments((prev) => {
      const exists = prev.some((s) => s.id === shipment.id);
      if (exists) {
        return prev.map((s) => (s.id === shipment.id ? shipment : s));
      }
      return [...prev, shipment];
    });
  }, []);

  const addShipments = useCallback((newShipments: Shipment[]) => {
    setShipments((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      newShipments.forEach((s) => map.set(s.id, s));
      return Array.from(map.values());
    });
  }, []);

  const updateShipment = useCallback((id: string, updates: Partial<Shipment>) => {
    setShipments((prev) => updateShipmentById(prev, id, updates));
  }, []);

  const deleteShipment = useCallback((id: string) => {
    setShipments((prev) => deleteShipmentById(prev, id));
  }, []);

  const clearShipments = useCallback(() => {
    setShipments([]);
    clearAllShipments();
  }, []);

  return {
    shipments,
    isLoading,
    error,
    addShipment,
    addShipments,
    updateShipment,
    deleteShipment,
    clearShipments,
  };
}
