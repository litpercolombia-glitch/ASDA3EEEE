import { HistoricalData, RiskAnalysis, RiskLevel, CarrierPerformance, ProductType } from '../types';

/**
 * Calcula el score de riesgo para una ciudad y transportadora específica
 */
export function calculateRiskScore(
  ciudad: string,
  transportadora: string,
  data: HistoricalData,
  orderValue?: number,
  productType?: ProductType
): RiskAnalysis {
  const cityData = data[ciudad];

  if (!cityData) {
    return {
      risk: 'DESCONOCIDO',
      score: 50,
      factors: {
        tasaExito: 0,
        tiempoPromedio: 0,
        volumenDatos: 0,
        confiabilidad: 'Baja',
      },
      recommendations: [
        'No hay datos históricos para esta ciudad',
        'Se recomienda precaución extrema',
        'Confirmar dirección detalladamente antes de enviar',
      ],
    };
  }

  const carrierData = cityData.find((c) => c.carrier === transportadora);

  if (!carrierData) {
    return {
      risk: 'DESCONOCIDO',
      score: 50,
      factors: {
        tasaExito: 0,
        tiempoPromedio: 0,
        volumenDatos: 0,
        confiabilidad: 'Baja',
      },
      recommendations: [
        `No hay datos históricos para ${transportadora} en ${ciudad}`,
        'Considerar usar otra transportadora con historial conocido',
      ],
    };
  }

  const tasaExito = carrierData.deliveryRate;
  const tiempoPromedio = carrierData.avgTimeValue;
  const volumenDatos = carrierData.total;

  // Cálculo del score de riesgo
  let riskScore = 100 - tasaExito; // Base: inverso de tasa de éxito

  // Penalización por tiempo largo
  if (tiempoPromedio > 5) riskScore += 10;
  if (tiempoPromedio > 8) riskScore += 15;
  if (tiempoPromedio > 10) riskScore += 20;

  // Incertidumbre por pocos datos
  if (volumenDatos < 10) riskScore += 20;
  if (volumenDatos < 5) riskScore += 30;

  // Penalización por tipo de producto frágil
  if (productType === 'Frágil' || productType === 'Electrónico') {
    riskScore += 10;
  }

  // Penalización por alto valor del pedido
  if (orderValue && orderValue > 500000) {
    riskScore += 15;
  }

  // Normalizar score entre 0-100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Clasificación de riesgo
  let riskLevel: RiskLevel = 'BAJO';
  if (riskScore > 30) riskLevel = 'MEDIO';
  if (riskScore > 50) riskLevel = 'ALTO';
  if (riskScore > 70) riskLevel = 'CRÍTICO';

  // Confiabilidad basada en volumen de datos
  let confiabilidad: 'Alta' | 'Media' | 'Baja' = 'Alta';
  if (volumenDatos < 10) confiabilidad = 'Media';
  if (volumenDatos < 5) confiabilidad = 'Baja';

  // Generar recomendaciones
  const recommendations = generateRecommendations(
    riskLevel,
    tasaExito,
    tiempoPromedio,
    volumenDatos,
    ciudad,
    transportadora,
    productType
  );

  return {
    risk: riskLevel,
    score: Math.round(riskScore),
    factors: {
      tasaExito: Math.round(tasaExito * 10) / 10,
      tiempoPromedio: Math.round(tiempoPromedio * 10) / 10,
      volumenDatos,
      confiabilidad,
    },
    recommendations,
  };
}

/**
 * Genera recomendaciones basadas en el nivel de riesgo
 */
function generateRecommendations(
  riskLevel: RiskLevel,
  tasaExito: number,
  tiempoPromedio: number,
  volumenDatos: number,
  ciudad: string,
  transportadora: string,
  productType?: ProductType
): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'CRÍTICO') {
    recommendations.push(
      '⚠️ RIESGO CRÍTICO: Considerar NO enviar a esta zona con esta transportadora'
    );
    recommendations.push('Buscar transportadora alternativa con mejor historial');
    recommendations.push('Si debe enviar, exigir prepago en lugar de contraentrega');
  }

  if (riskLevel === 'ALTO') {
    recommendations.push('⚠️ Alto riesgo de novedad o devolución');
    recommendations.push('Confirmar dirección y teléfono por WhatsApp antes de enviar');
    recommendations.push('Considerar seguro adicional para el envío');
  }

  if (riskLevel === 'MEDIO') {
    recommendations.push('⚠️ Riesgo moderado detectado');
    recommendations.push('Verificar datos del destinatario cuidadosamente');
  }

  if (riskLevel === 'BAJO') {
    recommendations.push('✅ Zona con buen historial de entregas');
    recommendations.push('Proceder con configuración estándar');
  }

  // Recomendaciones específicas por factor
  if (tasaExito < 60) {
    recommendations.push(`Solo ${tasaExito.toFixed(0)}% de éxito histórico - buscar alternativa`);
  }

  if (tiempoPromedio > 7) {
    recommendations.push(`Tiempo promedio alto (${tiempoPromedio} días) - informar al cliente`);
  }

  if (volumenDatos < 5) {
    recommendations.push('⚠️ Pocos datos históricos - resultados menos confiables');
  }

  if (productType === 'Frágil') {
    recommendations.push('Producto frágil: usar empaque reforzado y seguro adicional');
  }

  if (productType === 'Electrónico') {
    recommendations.push('Electrónico: exigir firma al recibir y verificación de identidad');
  }

  return recommendations;
}

/**
 * Recomienda la mejor transportadora para una ciudad dada
 */
export function recommendBestCarrier(
  ciudad: string,
  data: HistoricalData,
  productType?: ProductType
): {
  best: CarrierPerformance | null;
  alternatives: CarrierPerformance[];
  reason: string;
} {
  const cityData = data[ciudad];

  if (!cityData || cityData.length === 0) {
    return {
      best: null,
      alternatives: [],
      reason: `No hay datos históricos para ${ciudad}`,
    };
  }

  // Filtrar transportadoras con datos suficientes
  const reliable = cityData.filter((c) => c.total >= 5);

  if (reliable.length === 0) {
    return {
      best: null,
      alternatives: cityData.sort((a, b) => b.deliveryRate - a.deliveryRate),
      reason: 'Datos insuficientes para todas las transportadoras',
    };
  }

  // Calcular score para cada transportadora
  const scored = reliable.map((carrier) => {
    let score = carrier.deliveryRate; // Base: tasa de éxito

    // Bonus por rapidez
    if (carrier.avgTimeValue <= 3) score += 15;
    else if (carrier.avgTimeValue <= 5) score += 10;
    else if (carrier.avgTimeValue <= 7) score += 5;

    // Bonus por volumen de datos (confiabilidad)
    if (carrier.total >= 50) score += 10;
    else if (carrier.total >= 20) score += 5;

    // Penalización por productos frágiles si el tiempo es muy largo
    if ((productType === 'Frágil' || productType === 'Electrónico') && carrier.avgTimeValue > 7) {
      score -= 10;
    }

    return { ...carrier, calculatedScore: score };
  });

  // Ordenar por score
  scored.sort((a, b) => b.calculatedScore! - a.calculatedScore!);

  const best = scored[0];
  const alternatives = scored.slice(1, 3); // Top 2 alternativas

  let reason = `${best.carrier} tiene ${best.deliveryRate.toFixed(0)}% de éxito`;
  if (best.avgTimeValue <= 3) {
    reason += ' y entrega rápida';
  }
  if (best.total >= 50) {
    reason += ' con datos muy confiables';
  }

  return {
    best,
    alternatives,
    reason,
  };
}

/**
 * Compara dos transportadoras en una ciudad específica
 */
export function compareCarriers(
  ciudad: string,
  carrier1: string,
  carrier2: string,
  data: HistoricalData
): {
  winner: string | null;
  comparison: {
    carrier: string;
    deliveryRate: number;
    avgTime: number;
    total: number;
  }[];
  recommendation: string;
} {
  const cityData = data[ciudad];

  if (!cityData) {
    return {
      winner: null,
      comparison: [],
      recommendation: `No hay datos para ${ciudad}`,
    };
  }

  const c1Data = cityData.find((c) => c.carrier === carrier1);
  const c2Data = cityData.find((c) => c.carrier === carrier2);

  if (!c1Data || !c2Data) {
    return {
      winner: null,
      comparison: [],
      recommendation: 'Una o ambas transportadoras no tienen datos',
    };
  }

  const comparison = [
    {
      carrier: carrier1,
      deliveryRate: c1Data.deliveryRate,
      avgTime: c1Data.avgTimeValue,
      total: c1Data.total,
    },
    {
      carrier: carrier2,
      deliveryRate: c2Data.deliveryRate,
      avgTime: c2Data.avgTimeValue,
      total: c2Data.total,
    },
  ];

  // Determinar ganador basado en múltiples factores
  let winner: string | null = null;
  let recommendation = '';

  const diff = c1Data.deliveryRate - c2Data.deliveryRate;

  if (Math.abs(diff) > 10) {
    // Diferencia significativa en tasa de éxito
    winner = diff > 0 ? carrier1 : carrier2;
    recommendation = `${winner} tiene significativamente mejor tasa de éxito (${Math.abs(diff).toFixed(0)}% más)`;
  } else {
    // Tasas similares, comparar por tiempo
    const timeDiff = c1Data.avgTimeValue - c2Data.avgTimeValue;
    if (Math.abs(timeDiff) > 2) {
      winner = timeDiff < 0 ? carrier1 : carrier2;
      recommendation = `Tasas similares, pero ${winner} es ${Math.abs(timeDiff).toFixed(1)} días más rápida`;
    } else {
      recommendation = 'Ambas transportadoras tienen desempeño muy similar';
    }
  }

  return {
    winner,
    comparison,
    recommendation,
  };
}
