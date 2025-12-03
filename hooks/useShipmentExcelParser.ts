import { useState, useEffect, useCallback } from 'react';
import { Shipment, ShipmentStatus, CarrierName } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { analyzeShipmentRisk, detectCarrier } from '../services/logisticsService';

// Declare global XLSX from CDN
declare global {
  interface Window {
    XLSX: any;
  }
}

interface ShipmentExcelResult {
  success: boolean;
  shipments: Shipment[];
  error: string | null;
  preview: {
    totalRecords: number;
    carriers: string[];
    statuses: string[];
  } | null;
}

export function useShipmentExcelParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [parseResult, setParseResult] = useState<ShipmentExcelResult | null>(null);

  // Load XLSX from CDN
  useEffect(() => {
    // Check if XLSX is already loaded
    if (window.XLSX) {
      setXlsxLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="sheetjs"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setXlsxLoaded(true));
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = () => {
      console.log('XLSX library loaded successfully');
      setXlsxLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load XLSX library');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  /**
   * Normalize status from Excel to ShipmentStatus
   */
  const normalizeExcelStatus = (rawStatus: string): ShipmentStatus => {
    if (!rawStatus) return ShipmentStatus.PENDING;

    const status = rawStatus.toUpperCase().trim();

    // Entregado
    if (status.includes('ENTREG') || status.includes('DELIVERED') || status.includes('RECOGIDO')) {
      return ShipmentStatus.DELIVERED;
    }

    // Novedad/Issue
    if (status.includes('NOVEDAD') || status.includes('DEVOL') || status.includes('RECHAZ') ||
        status.includes('FALLIDO') || status.includes('NO ENTREGA') || status.includes('RETORNO')) {
      return ShipmentStatus.ISSUE;
    }

    // En oficina
    if (status.includes('OFICINA') || status.includes('BODEGA') || status.includes('RETIRO') ||
        status.includes('DISPONIBLE') || status.includes('ALMACEN')) {
      return ShipmentStatus.IN_OFFICE;
    }

    // En tránsito
    if (status.includes('TRANSIT') || status.includes('REPARTO') || status.includes('CAMINO') ||
        status.includes('RUTA') || status.includes('DISTRIBU')) {
      return ShipmentStatus.IN_TRANSIT;
    }

    return ShipmentStatus.PENDING;
  };

  /**
   * Detect carrier from text
   */
  const detectCarrierFromText = (text: string): CarrierName => {
    if (!text) return CarrierName.UNKNOWN;

    const upper = text.toUpperCase();

    if (upper.includes('INTER') || upper.includes('RAPIDISIMO') || upper.includes('RAPIDI')) {
      return CarrierName.INTER_RAPIDISIMO;
    }
    if (upper.includes('ENVIA') || upper.includes('ENVÍA')) {
      return CarrierName.ENVIA;
    }
    if (upper.includes('COORD')) {
      return CarrierName.COORDINADORA;
    }
    if (upper.includes('TCC')) {
      return CarrierName.TCC;
    }
    if (upper.includes('VELOCES')) {
      return CarrierName.VELOCES;
    }

    return CarrierName.UNKNOWN;
  };

  /**
   * Parse Excel file with shipment data
   */
  const parseExcelFile = useCallback(async (
    file: File,
    phoneRegistry: Record<string, string> = {}
  ): Promise<ShipmentExcelResult> => {
    setIsLoading(true);

    // Wait for XLSX to load if not ready
    if (!window.XLSX) {
      // Try to wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!window.XLSX) {
        const result: ShipmentExcelResult = {
          success: false,
          shipments: [],
          error: 'Librería Excel no cargada. Por favor recarga la página e intenta de nuevo.',
          preview: null
        };
        setParseResult(result);
        setIsLoading(false);
        return result;
      }
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;

      if (sheetNames.length === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      // Find the best sheet to use (look for keywords)
      const guiasSheet = sheetNames.find((name: string) =>
        /guias|envios|shipments|tracking|pedidos|ordenes/i.test(name)
      ) || sheetNames[0];

      // Convert to JSON
      const rawData: any[] = window.XLSX.utils.sheet_to_json(workbook.Sheets[guiasSheet], {
        raw: false,
        defval: ''
      });

      if (rawData.length === 0) {
        throw new Error('No se encontraron datos en el archivo Excel');
      }

      // Detect column mapping
      const firstRow = rawData[0];
      const columns = Object.keys(firstRow);

      // Find guide column
      const guideColumn = columns.find(c =>
        /^(guia|guide|numero|id|tracking|nro|#)/i.test(c)
      ) || columns[0];

      // Find status column
      const statusColumn = columns.find(c =>
        /^(estado|status|estatus)/i.test(c)
      );

      // Find phone column
      const phoneColumn = columns.find(c =>
        /^(telefono|phone|celular|cel|movil)/i.test(c)
      );

      // Find carrier column
      const carrierColumn = columns.find(c =>
        /^(transportadora|carrier|empresa|mensajeria)/i.test(c)
      );

      // Find destination column
      const destColumn = columns.find(c =>
        /^(destino|destination|ciudad|city|municipio)/i.test(c)
      );

      // Find days column
      const daysColumn = columns.find(c =>
        /^(dias|days|tiempo|time)/i.test(c)
      );

      // Find value column
      const valueColumn = columns.find(c =>
        /^(valor|value|precio|price|monto|amount)/i.test(c)
      );

      const today = new Date().toISOString().split('T')[0];
      const batchId = uuidv4();
      const batchDate = new Date().toISOString();

      const shipments: Shipment[] = [];
      const seenIds = new Set<string>();
      const carriers = new Set<string>();
      const statuses = new Set<string>();

      for (const row of rawData) {
        const guideId = String(row[guideColumn] || '').trim();

        // Skip empty or duplicate guides
        if (!guideId || seenIds.has(guideId)) continue;
        seenIds.add(guideId);

        // Get values from columns
        const rawStatus = statusColumn ? String(row[statusColumn] || '') : '';
        const phone = phoneColumn ? String(row[phoneColumn] || '') : (phoneRegistry[guideId] || '');
        const carrierText = carrierColumn ? String(row[carrierColumn] || '') : '';
        const destination = destColumn ? String(row[destColumn] || '') : 'Colombia';
        const daysStr = daysColumn ? String(row[daysColumn] || '0') : '0';
        const valueStr = valueColumn ? String(row[valueColumn] || '0') : '0';

        // Process values
        const status = normalizeExcelStatus(rawStatus);
        const carrier = carrierText
          ? detectCarrierFromText(carrierText)
          : detectCarrier(guideId);
        const daysInTransit = parseInt(daysStr.replace(/\D/g, '')) || 0;
        const declaredValue = parseInt(valueStr.replace(/\D/g, '')) || 0;

        // Track for preview
        if (carrierText) carriers.add(carrierText);
        if (rawStatus) statuses.add(rawStatus);

        const shipment: Shipment = {
          id: guideId,
          batchId,
          batchDate,
          source: 'DETAILED',
          carrier,
          status,
          phone: phone.replace(/\D/g, '').slice(-10) || undefined,
          checkStatus: false,
          dateKey: today,
          detailedInfo: {
            origin: 'Colombia',
            destination: destination.toUpperCase(),
            daysInTransit,
            rawStatus: rawStatus || status,
            events: [{
              date: batchDate,
              location: destination,
              description: rawStatus || 'Cargado desde Excel',
              isRecent: true
            }],
            hasErrors: false,
            estimatedDelivery: status === ShipmentStatus.DELIVERED ? 'Entregado' : 'Por confirmar',
            declaredValue
          }
        };

        shipment.riskAnalysis = analyzeShipmentRisk(shipment);
        shipments.push(shipment);
      }

      const result: ShipmentExcelResult = {
        success: true,
        shipments,
        error: null,
        preview: {
          totalRecords: shipments.length,
          carriers: Array.from(carriers),
          statuses: Array.from(statuses)
        }
      };

      setParseResult(result);
      setIsLoading(false);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error desconocido al procesar el archivo Excel';

      const result: ShipmentExcelResult = {
        success: false,
        shipments: [],
        error: errorMessage,
        preview: null
      };

      setParseResult(result);
      setIsLoading(false);
      return result;
    }
  }, []);

  const reset = useCallback(() => {
    setParseResult(null);
  }, []);

  return {
    parseExcelFile,
    isLoading,
    xlsxLoaded,
    parseResult,
    reset
  };
}

export default useShipmentExcelParser;
