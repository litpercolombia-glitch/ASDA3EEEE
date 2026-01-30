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

  // Load XLSX from CDN - con cleanup apropiado para evitar memory leaks
  useEffect(() => {
    let isMounted = true;

    // Check if XLSX is already loaded
    if (window.XLSX) {
      setXlsxLoaded(true);
      return;
    }

    // Handler para cuando el script cargue
    const handleScriptLoad = () => {
      if (isMounted) {
        console.log('XLSX library loaded successfully');
        setXlsxLoaded(true);
      }
    };

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="sheetjs"]') as HTMLScriptElement;
    if (existingScript) {
      if (window.XLSX) {
        setXlsxLoaded(true);
      } else {
        existingScript.addEventListener('load', handleScriptLoad);
      }
      return () => {
        isMounted = false;
        existingScript.removeEventListener('load', handleScriptLoad);
      };
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = handleScriptLoad;
    script.onerror = () => {
      console.error('Failed to load XLSX library');
    };
    document.body.appendChild(script);

    return () => {
      isMounted = false;
      // No removemos el script del DOM porque otros componentes pueden usarlo
      // Solo limpiamos los handlers
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  /**
   * Normalize status from Excel to ShipmentStatus
   * MEJORADO: Más patrones para estados de Colombia
   */
  const normalizeExcelStatus = (rawStatus: string): ShipmentStatus => {
    if (!rawStatus) return ShipmentStatus.PENDING;

    const status = rawStatus.toUpperCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Quitar acentos

    // ===== ENTREGADO =====
    if (
      status.includes('ENTREG') ||
      status.includes('DELIVERED') ||
      status.includes('RECOGIDO') ||
      status.includes('CUMPLIDO') ||
      status.includes('EXITOSO') ||
      status.includes('EFECTIV') ||
      status === 'OK'
    ) {
      return ShipmentStatus.DELIVERED;
    }

    // ===== NOVEDAD/ISSUE =====
    if (
      status.includes('NOVEDAD') ||
      status.includes('DEVOL') ||
      status.includes('RECHAZ') ||
      status.includes('FALLIDO') ||
      status.includes('NO ENTREGA') ||
      status.includes('RETORNO') ||
      status.includes('SINIESTRO') ||
      status.includes('PERDIDO') ||
      status.includes('DAÑADO') ||
      status.includes('DANADO') ||
      status.includes('AVERIA') ||
      status.includes('DIRECCION ERRADA') ||
      status.includes('DIRECCION INCORRECTA') ||
      status.includes('TELEFONO ERRADO') ||
      status.includes('NO CONTESTA') ||
      status.includes('AUSENTE') ||
      status.includes('CERRADO') ||
      status.includes('SIN DINERO') ||
      status.includes('ZONA RIESGO') ||
      status.includes('REPROGRAMADO')
    ) {
      return ShipmentStatus.ISSUE;
    }

    // ===== EN OFICINA =====
    if (
      status.includes('OFICINA') ||
      status.includes('BODEGA') ||
      status.includes('RETIRO') ||
      status.includes('DISPONIBLE') ||
      status.includes('ALMACEN') ||
      status.includes('PUNTO') ||
      status.includes('AGENCIA') ||
      status.includes('CENTRO')
    ) {
      return ShipmentStatus.IN_OFFICE;
    }

    // ===== EN TRÁNSITO =====
    if (
      status.includes('TRANSIT') ||
      status.includes('TRANSITO') ||
      status.includes('REPARTO') ||
      status.includes('CAMINO') ||
      status.includes('RUTA') ||
      status.includes('DISTRIBU') ||
      status.includes('DESPACHADO') ||
      status.includes('ENVIADO') ||
      status.includes('MOVILIZA') ||
      status.includes('CARGADO') ||
      status.includes('LLEGADA') ||
      status.includes('SALIDA') ||
      status.includes('ARRIBO')
    ) {
      return ShipmentStatus.IN_TRANSIT;
    }

    // ===== PENDIENTE (default) =====
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
  const parseExcelFile = useCallback(
    async (
      file: File,
      phoneRegistry: Record<string, string> = {}
    ): Promise<ShipmentExcelResult> => {
      setIsLoading(true);

      // Wait for XLSX to load if not ready
      if (!window.XLSX) {
        // Try to wait a bit
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!window.XLSX) {
          const result: ShipmentExcelResult = {
            success: false,
            shipments: [],
            error: 'Librería Excel no cargada. Por favor recarga la página e intenta de nuevo.',
            preview: null,
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
        const guiasSheet =
          sheetNames.find((name: string) =>
            /guias|envios|shipments|tracking|pedidos|ordenes/i.test(name)
          ) || sheetNames[0];

        // Convert to JSON
        const rawData: any[] = window.XLSX.utils.sheet_to_json(workbook.Sheets[guiasSheet], {
          raw: false,
          defval: '',
        });

        if (rawData.length === 0) {
          throw new Error('No se encontraron datos en el archivo Excel');
        }

        // Detect column mapping
        const firstRow = rawData[0];
        const columns = Object.keys(firstRow);

        /**
         * Helper to find column by multiple patterns
         * CORREGIDO: Ahora busca coincidencias flexibles (contiene, no solo empieza)
         */
        const findColumn = (patterns: string[]): string | undefined => {
          // Primero buscar coincidencia exacta
          for (const pattern of patterns) {
            const exact = columns.find((c) =>
              c.toLowerCase().trim() === pattern.toLowerCase()
            );
            if (exact) return exact;
          }

          // Luego buscar si contiene el patrón
          for (const pattern of patterns) {
            const partial = columns.find((c) =>
              c.toLowerCase().includes(pattern.toLowerCase())
            );
            if (partial) return partial;
          }

          return undefined;
        };

        // Find guide column - Ampliado para variantes Colombia
        const guideColumn = findColumn([
          'guia', 'guía', 'guide', 'numero de guia', 'número de guía',
          'numero_de_guia', 'tracking', 'nro', 'id', 'codigo', 'código',
          'no. guia', 'no guia', '#'
        ]) || columns[0];

        // Find status column - AMPLIADO: incluye "estatus" que es común en Colombia
        const statusColumn = findColumn([
          'estatus', 'estado', 'status', 'estado actual',
          'estatus actual', 'estado envio', 'state'
        ]);

        // Find phone column
        const phoneColumn = findColumn([
          'telefono', 'teléfono', 'phone', 'celular', 'cel', 'movil', 'móvil',
          'telefono destinatario', 'contacto'
        ]);

        // Find carrier column
        const carrierColumn = findColumn([
          'transportadora', 'carrier', 'empresa', 'mensajeria', 'mensajería',
          'courier', 'operador'
        ]);

        // Find destination column - AMPLIADO: "ciudad destino" y variantes
        const destColumn = findColumn([
          'ciudad destino', 'ciudad_destino', 'ciudad de destino',
          'destino', 'destination', 'ciudad', 'city', 'municipio',
          'ciudad destinatario', 'municipio destino'
        ]);

        // Find days column
        const daysColumn = findColumn([
          'dias', 'días', 'days', 'tiempo', 'time',
          'dias transito', 'días en tránsito'
        ]);

        // Find value column
        const valueColumn = findColumn([
          'valor', 'value', 'precio', 'price', 'monto', 'amount',
          'valor declarado', 'recaudo', 'total'
        ]);

        // Find last movement column - NUEVO: Para tracking
        const lastMovementColumn = findColumn([
          'ultimo movimiento', 'último movimiento', 'last movement',
          'ultimo_movimiento', 'movimiento', 'novedad', 'observacion'
        ]);

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
          const phone = phoneColumn ? String(row[phoneColumn] || '') : phoneRegistry[guideId] || '';
          const carrierText = carrierColumn ? String(row[carrierColumn] || '') : '';
          const destination = destColumn ? String(row[destColumn] || '') : 'Colombia';
          const daysStr = daysColumn ? String(row[daysColumn] || '0') : '0';
          const valueStr = valueColumn ? String(row[valueColumn] || '0') : '0';
          // NUEVO: Último movimiento para tracking
          const lastMovement = lastMovementColumn ? String(row[lastMovementColumn] || '') : '';

          // Process values
          const status = normalizeExcelStatus(rawStatus);
          const carrier = carrierText ? detectCarrierFromText(carrierText) : detectCarrier(guideId);
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
              destination: destination.toUpperCase() || 'Sin ciudad',
              daysInTransit,
              rawStatus: rawStatus || status,
              events: [
                {
                  date: batchDate,
                  location: destination || 'Colombia',
                  description: lastMovement || rawStatus || 'Cargado desde Excel',
                  isRecent: true,
                },
              ],
              hasErrors: false,
              estimatedDelivery:
                status === ShipmentStatus.DELIVERED ? 'Entregado' : 'Por confirmar',
              declaredValue,
            },
            // NUEVO: Guardar último movimiento para seguimiento
            notes: lastMovement || undefined,
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
            statuses: Array.from(statuses),
          },
        };

        setParseResult(result);
        setIsLoading(false);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido al procesar el archivo Excel';

        const result: ShipmentExcelResult = {
          success: false,
          shipments: [],
          error: errorMessage,
          preview: null,
        };

        setParseResult(result);
        setIsLoading(false);
        return result;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setParseResult(null);
  }, []);

  return {
    parseExcelFile,
    isLoading,
    xlsxLoaded,
    parseResult,
    reset,
  };
}

export default useShipmentExcelParser;
