import { useState } from 'react';
import * as XLSX from 'xlsx';
import { DeliveryData, TimeData, HistoricalData, CarrierPerformance } from '../types';

interface ParseResult {
  success: boolean;
  data: HistoricalData | null;
  preview: {
    totalCities: number;
    totalCarriers: number;
    totalRecords: number;
    cities: string[];
    carriers: string[];
  } | null;
  error: string | null;
}

export function useExcelParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const parseExcelFile = async (file: File): Promise<ParseResult> => {
    setIsLoading(true);

    try {
      // Leer el archivo
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Verificar que existan las hojas requeridas
      if (!workbook.SheetNames.includes('Tasa_Entregas')) {
        throw new Error('Falta la hoja "Tasa_Entregas" en el archivo Excel');
      }

      if (!workbook.SheetNames.includes('Tiempo_Promedio')) {
        throw new Error('Falta la hoja "Tiempo_Promedio" en el archivo Excel');
      }

      // Parsear hoja de tasas de entrega
      const deliverySheet = workbook.Sheets['Tasa_Entregas'];
      const deliveryData: DeliveryData[] = XLSX.utils.sheet_to_json(deliverySheet, {
        raw: false,
      });

      // Parsear hoja de tiempos promedio
      const timeSheet = workbook.Sheets['Tiempo_Promedio'];
      const timeData: TimeData[] = XLSX.utils.sheet_to_json(timeSheet, {
        raw: false,
      });

      // Validar columnas requeridas en Tasa_Entregas
      if (deliveryData.length > 0) {
        const firstRow: any = deliveryData[0];
        const requiredColumns = ['CIUDAD', 'TRANSPORTADORA', 'DEVOLUCIONES', 'ENTREGAS', 'TOTAL'];
        const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

        if (missingColumns.length > 0) {
          throw new Error(
            `Faltan columnas en "Tasa_Entregas": ${missingColumns.join(', ')}`
          );
        }
      }

      // Validar columnas requeridas en Tiempo_Promedio
      if (timeData.length > 0) {
        const firstRow: any = timeData[0];
        const requiredColumns = ['CIUDAD', 'TRANSPORTADORA', 'DIAS'];
        const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

        if (missingColumns.length > 0) {
          throw new Error(
            `Faltan columnas en "Tiempo_Promedio": ${missingColumns.join(', ')}`
          );
        }
      }

      // Transformar datos a formato HistoricalData
      const historicalData = transformToHistoricalData(deliveryData, timeData);

      // Generar preview
      const cities = Array.from(new Set(deliveryData.map((d: any) => d.CIUDAD)));
      const carriers = Array.from(new Set(deliveryData.map((d: any) => d.TRANSPORTADORA)));

      const result: ParseResult = {
        success: true,
        data: historicalData,
        preview: {
          totalCities: cities.length,
          totalCarriers: carriers.length,
          totalRecords: deliveryData.length,
          cities: cities.slice(0, 10), // Primeras 10 ciudades
          carriers,
        },
        error: null,
      };

      setParseResult(result);
      setIsLoading(false);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al parsear Excel';

      const result: ParseResult = {
        success: false,
        data: null,
        preview: null,
        error: errorMessage,
      };

      setParseResult(result);
      setIsLoading(false);
      return result;
    }
  };

  const reset = () => {
    setParseResult(null);
  };

  return {
    parseExcelFile,
    isLoading,
    parseResult,
    reset,
  };
}

/**
 * Transforma los datos del Excel a formato HistoricalData
 */
function transformToHistoricalData(
  deliveryData: DeliveryData[],
  timeData: TimeData[]
): HistoricalData {
  const historicalData: HistoricalData = {};

  // Crear índice de tiempos por ciudad+transportadora
  const timeIndex = new Map<string, number>();
  timeData.forEach((t: any) => {
    const key = `${normalizeString(t.CIUDAD)}|${normalizeString(t.TRANSPORTADORA)}`;
    timeIndex.set(key, parseFloat(t.DIAS) || 0);
  });

  // Procesar datos de entregas
  deliveryData.forEach((d: any) => {
    const ciudad = normalizeString(d.CIUDAD);
    const transportadora = normalizeString(d.TRANSPORTADORA);
    const devoluciones = parseInt(d.DEVOLUCIONES) || 0;
    const entregas = parseInt(d.ENTREGAS) || 0;
    const total = parseInt(d.TOTAL) || devoluciones + entregas;

    // Obtener tiempo promedio
    const key = `${ciudad}|${transportadora}`;
    const avgTime = timeIndex.get(key) || 0;

    // Calcular tasas
    const deliveryRate = total > 0 ? (entregas / total) * 100 : 0;
    const returnRate = total > 0 ? (devoluciones / total) * 100 : 0;

    // Crear CarrierPerformance
    const performance: CarrierPerformance = {
      carrier: transportadora,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      returnRate: Math.round(returnRate * 10) / 10,
      avgTime: formatAvgTime(avgTime),
      avgTimeValue: avgTime,
      total,
      deliveries: entregas,
      returns: devoluciones,
    };

    // Agregar a historicalData
    if (!historicalData[ciudad]) {
      historicalData[ciudad] = [];
    }

    historicalData[ciudad].push(performance);
  });

  return historicalData;
}

/**
 * Normaliza strings para consistencia
 */
function normalizeString(str: string): string {
  return str
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
}

/**
 * Formatea el tiempo promedio para mostrar
 */
function formatAvgTime(days: number): string {
  if (days === 0) return 'Sin datos';
  if (days === 1) return '1 día';
  if (days < 1) return 'Menos de 1 día';
  return `${days} días`;
}

/**
 * Genera una plantilla de ejemplo en formato Excel
 */
export function generateExcelTemplate(): void {
  // Datos de ejemplo para Tasa_Entregas
  const deliveryExample = [
    {
      CIUDAD: 'BOGOTA',
      TRANSPORTADORA: 'COORDINADORA',
      DEVOLUCIONES: 331,
      ENTREGAS: 959,
      TOTAL: 1290,
    },
    {
      CIUDAD: 'BOGOTA',
      TRANSPORTADORA: 'ENVIA',
      DEVOLUCIONES: 150,
      ENTREGAS: 450,
      TOTAL: 600,
    },
    {
      CIUDAD: 'MEDELLIN',
      TRANSPORTADORA: 'COORDINADORA',
      DEVOLUCIONES: 50,
      ENTREGAS: 200,
      TOTAL: 250,
    },
    {
      CIUDAD: 'MEDELLIN',
      TRANSPORTADORA: 'ENVIA',
      DEVOLUCIONES: 101,
      ENTREGAS: 180,
      TOTAL: 281,
    },
  ];

  // Datos de ejemplo para Tiempo_Promedio
  const timeExample = [
    { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'COORDINADORA', DIAS: 2 },
    { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'ENVIA', DIAS: 3 },
    { CIUDAD: 'MEDELLIN', TRANSPORTADORA: 'COORDINADORA', DIAS: 3 },
    { CIUDAD: 'MEDELLIN', TRANSPORTADORA: 'ENVIA', DIAS: 4 },
  ];

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Crear hoja de Tasa_Entregas
  const ws1 = XLSX.utils.json_to_sheet(deliveryExample);
  XLSX.utils.book_append_sheet(wb, ws1, 'Tasa_Entregas');

  // Crear hoja de Tiempo_Promedio
  const ws2 = XLSX.utils.json_to_sheet(timeExample);
  XLSX.utils.book_append_sheet(wb, ws2, 'Tiempo_Promedio');

  // Descargar archivo
  XLSX.writeFile(wb, 'plantilla_datos_logisticos.xlsx');
}
