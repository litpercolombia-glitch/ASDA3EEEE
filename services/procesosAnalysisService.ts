// services/procesosAnalysisService.ts
// Servicio de Análisis de Productividad con AI - LITPER PRO

// ==================== TIPOS ====================

export interface RondaData {
  fecha: string;
  usuario: string;
  ronda: number;
  horaInicio: string;
  horaFin: string;
  tiempoMin: number;
  iniciales: number;
  realizadas: number;
  canceladas: number;
  agendadas: number;
  dificiles: number;
  pendientes: number;
  revisadas: number;
}

export interface NovedadData {
  fecha: string;
  usuario: string;
  ronda: number;
  horaInicio: string;
  horaFin: string;
  tiempoMin: number;
  revisadas: number;
  solucionadas: number;
  devolucion: number;
  cliente: number;
  transportadora: number;
  litper: number;
}

export interface TrackerData {
  metadata: {
    usuario: string;
    fechaReporte: string;
  };
  guias: RondaData[];
  novedades: NovedadData[];
  resumen: {
    totalGuiasRealizadas: number;
    totalNovedadesSolucionadas: number;
    totalRondas: number;
  };
}

export interface AnalysisResult {
  success: boolean;
  data: TrackerData;
  analysis: {
    insights: string[];
    recommendations: string[];
    kpis: {
      productividad: number;
      tasaExito: number;
      eficiencia: number;
      tiempoPromedio: number;
    };
    anomalies: string[];
    amazonComparison: {
      tasaExitoGap: number;
      tiempoGap: number;
      casosDificilesGap: number;
    };
    tendencia: 'mejorando' | 'estable' | 'declinando';
  };
  charts: {
    rendimientoPorRonda: { ronda: string; realizadas: number; canceladas: number; pendientes: number }[];
    distribucion: { name: string; value: number; color: string }[];
    tendenciaTemporal: { fecha: string; realizadas: number; dificiles: number }[];
  };
  timestamp: string;
}

// ==================== PARSER ====================

export function parseTrackerCSV(content: string): TrackerData {
  const lines = content.split('\n');
  let section = '';
  const result: TrackerData = {
    metadata: { usuario: '', fechaReporte: '' },
    guias: [],
    novedades: [],
    resumen: {
      totalGuiasRealizadas: 0,
      totalNovedadesSolucionadas: 0,
      totalRondas: 0,
    },
  };

  // Extraer metadata del encabezado
  const userMatch = content.match(/Usuario:\s*(\w+)/i);
  if (userMatch) result.metadata.usuario = userMatch[1];

  const dateMatch = content.match(/REPORTE\s*(\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) result.metadata.fechaReporte = dateMatch[1];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Detectar secciones
    if (trimmedLine.includes('=== GUIAS ===') || trimmedLine.includes('=== GUÍAS ===')) {
      section = 'guias';
      continue;
    } else if (trimmedLine.includes('=== NOVEDADES ===')) {
      section = 'novedades';
      continue;
    } else if (trimmedLine.includes('=== RESUMEN ===')) {
      section = 'resumen';
      continue;
    }

    // Parsear según sección
    if (section === 'guias' && trimmedLine && !trimmedLine.startsWith('Fecha,')) {
      const parts = trimmedLine.split(',');
      if (parts.length >= 13) {
        result.guias.push({
          fecha: parts[0]?.trim() || '',
          usuario: parts[1]?.trim() || '',
          ronda: parseInt(parts[2]) || 0,
          horaInicio: parts[3]?.trim() || '',
          horaFin: parts[4]?.trim() || '',
          tiempoMin: parseInt(parts[5]) || 0,
          iniciales: parseInt(parts[6]) || 0,
          realizadas: parseInt(parts[7]) || 0,
          canceladas: parseInt(parts[8]) || 0,
          agendadas: parseInt(parts[9]) || 0,
          dificiles: parseInt(parts[10]) || 0,
          pendientes: parseInt(parts[11]) || 0,
          revisadas: parseInt(parts[12]) || 0,
        });
      }
    } else if (section === 'novedades' && trimmedLine && !trimmedLine.startsWith('Fecha,')) {
      const parts = trimmedLine.split(',');
      if (parts.length >= 12) {
        result.novedades.push({
          fecha: parts[0]?.trim() || '',
          usuario: parts[1]?.trim() || '',
          ronda: parseInt(parts[2]) || 0,
          horaInicio: parts[3]?.trim() || '',
          horaFin: parts[4]?.trim() || '',
          tiempoMin: parseInt(parts[5]) || 0,
          revisadas: parseInt(parts[6]) || 0,
          solucionadas: parseInt(parts[7]) || 0,
          devolucion: parseInt(parts[8]) || 0,
          cliente: parseInt(parts[9]) || 0,
          transportadora: parseInt(parts[10]) || 0,
          litper: parseInt(parts[11]) || 0,
        });
      }
    } else if (section === 'resumen' && trimmedLine) {
      if (trimmedLine.startsWith('Total Guías Realizadas:')) {
        result.resumen.totalGuiasRealizadas = parseInt(trimmedLine.split(':')[1]) || 0;
      } else if (trimmedLine.startsWith('Total Novedades Solucionadas:')) {
        result.resumen.totalNovedadesSolucionadas = parseInt(trimmedLine.split(':')[1]) || 0;
      } else if (trimmedLine.startsWith('Total Rondas:')) {
        result.resumen.totalRondas = parseInt(trimmedLine.split(':')[1]) || 0;
      }
    }
  }

  // Calcular resumen si no viene en el archivo
  if (result.resumen.totalGuiasRealizadas === 0) {
    result.resumen.totalGuiasRealizadas = result.guias.reduce((acc, g) => acc + g.realizadas, 0);
  }
  if (result.resumen.totalNovedadesSolucionadas === 0) {
    result.resumen.totalNovedadesSolucionadas = result.novedades.reduce((acc, n) => acc + n.solucionadas, 0);
  }
  if (result.resumen.totalRondas === 0) {
    result.resumen.totalRondas = result.guias.length;
  }

  return result;
}

// ==================== CÁLCULOS ====================

function calcularKPIs(data: TrackerData) {
  const totalGuias = data.guias.reduce((acc, g) => acc + g.iniciales, 0);
  const realizadas = data.guias.reduce((acc, g) => acc + g.realizadas, 0);
  const canceladas = data.guias.reduce((acc, g) => acc + g.canceladas, 0);
  const dificiles = data.guias.reduce((acc, g) => acc + g.dificiles, 0);
  const tiempoTotal = data.guias.reduce((acc, g) => acc + g.tiempoMin, 0);

  const tasaExito = totalGuias > 0 ? (realizadas / totalGuias) * 100 : 0;
  const productividad = data.guias.length > 0 ? realizadas / data.guias.length : 0;
  const eficiencia = tiempoTotal > 0 ? (realizadas / tiempoTotal) * 60 : 0; // guías por hora
  const tiempoPromedio = data.guias.length > 0 ? tiempoTotal / data.guias.length : 0;

  return {
    productividad: Math.round(productividad * 10) / 10,
    tasaExito: Math.round(tasaExito * 10) / 10,
    eficiencia: Math.round(eficiencia * 10) / 10,
    tiempoPromedio: Math.round(tiempoPromedio),
    totalGuias,
    realizadas,
    canceladas,
    dificiles,
  };
}

function generarInsights(data: TrackerData, kpis: ReturnType<typeof calcularKPIs>): string[] {
  const insights: string[] = [];

  // Análisis de tasa de éxito
  if (kpis.tasaExito >= 85) {
    insights.push(`✅ Excelente tasa de éxito del ${kpis.tasaExito}%, superando la meta del 85%`);
  } else if (kpis.tasaExito >= 70) {
    insights.push(`⚠️ Tasa de éxito del ${kpis.tasaExito}%, por debajo de la meta (85%)`);
  } else {
    insights.push(`🔴 Tasa de éxito crítica del ${kpis.tasaExito}%, requiere atención inmediata`);
  }

  // Análisis de productividad
  if (kpis.productividad >= 10) {
    insights.push(`📈 Alta productividad: ${kpis.productividad} guías promedio por ronda`);
  } else {
    insights.push(`📉 Productividad mejorable: ${kpis.productividad} guías promedio por ronda`);
  }

  // Análisis de casos difíciles
  const porcentajeDificiles = kpis.totalGuias > 0 ? (kpis.dificiles / kpis.totalGuias) * 100 : 0;
  if (porcentajeDificiles > 10) {
    insights.push(`⚡ Alto porcentaje de casos difíciles: ${porcentajeDificiles.toFixed(1)}%`);
  }

  // Análisis de eficiencia temporal
  if (kpis.eficiencia >= 20) {
    insights.push(`⏱️ Excelente eficiencia: ${kpis.eficiencia} guías procesadas por hora`);
  } else {
    insights.push(`⏱️ Eficiencia: ${kpis.eficiencia} guías por hora (meta: 20+)`);
  }

  // Análisis de novedades
  const totalNovedades = data.novedades.reduce((acc, n) => acc + n.revisadas, 0);
  const solucionadas = data.novedades.reduce((acc, n) => acc + n.solucionadas, 0);
  if (totalNovedades > 0) {
    const tasaSolucion = (solucionadas / totalNovedades) * 100;
    insights.push(`🔧 Tasa de solución de novedades: ${tasaSolucion.toFixed(1)}%`);
  }

  return insights;
}

function generarRecomendaciones(data: TrackerData, kpis: ReturnType<typeof calcularKPIs>): string[] {
  const recomendaciones: string[] = [];

  if (kpis.tasaExito < 85) {
    recomendaciones.push('Implementar verificación previa de direcciones para reducir cancelaciones');
    recomendaciones.push('Establecer horarios óptimos de entrega según zona');
  }

  if (kpis.dificiles > kpis.totalGuias * 0.1) {
    recomendaciones.push('Crear protocolo especial para casos difíciles recurrentes');
    recomendaciones.push('Capacitar en técnicas de negociación con clientes');
  }

  if (kpis.tiempoPromedio > 15) {
    recomendaciones.push('Optimizar rutas usando algoritmos de clustering');
    recomendaciones.push('Preparar documentación antes de iniciar rondas');
  }

  if (kpis.eficiencia < 20) {
    recomendaciones.push('Reducir tiempos muertos entre entregas');
    recomendaciones.push('Implementar sistema de priorización inteligente');
  }

  // Siempre agregar al menos una recomendación
  if (recomendaciones.length === 0) {
    recomendaciones.push('Mantener el excelente desempeño actual');
    recomendaciones.push('Documentar mejores prácticas para compartir con el equipo');
  }

  return recomendaciones;
}

function detectarAnomalias(data: TrackerData): string[] {
  const anomalias: string[] = [];

  // Detectar rondas con 0 realizadas
  const rondasVacias = data.guias.filter(g => g.realizadas === 0 && g.iniciales > 0);
  if (rondasVacias.length > 0) {
    anomalias.push(`${rondasVacias.length} ronda(s) sin entregas completadas`);
  }

  // Detectar tiempos inusualmente largos
  const tiemposLargos = data.guias.filter(g => g.tiempoMin > 60);
  if (tiemposLargos.length > 0) {
    anomalias.push(`${tiemposLargos.length} ronda(s) con tiempo superior a 1 hora`);
  }

  // Detectar alta tasa de cancelación en rondas específicas
  for (const guia of data.guias) {
    if (guia.iniciales > 0 && guia.canceladas / guia.iniciales > 0.5) {
      anomalias.push(`Ronda ${guia.ronda} del ${guia.fecha}: >50% cancelaciones`);
    }
  }

  return anomalias;
}

function determinarTendencia(data: TrackerData): 'mejorando' | 'estable' | 'declinando' {
  if (data.guias.length < 2) return 'estable';

  const mitad = Math.floor(data.guias.length / 2);
  const primerasPart = data.guias.slice(0, mitad);
  const segundasPart = data.guias.slice(mitad);

  const tasaPrimera = primerasPart.reduce((acc, g) => acc + g.realizadas, 0) /
    Math.max(1, primerasPart.reduce((acc, g) => acc + g.iniciales, 0));
  const tasaSegunda = segundasPart.reduce((acc, g) => acc + g.realizadas, 0) /
    Math.max(1, segundasPart.reduce((acc, g) => acc + g.iniciales, 0));

  const diferencia = tasaSegunda - tasaPrimera;
  if (diferencia > 0.05) return 'mejorando';
  if (diferencia < -0.05) return 'declinando';
  return 'estable';
}

function prepararDatosGraficos(data: TrackerData) {
  // Rendimiento por ronda
  const rendimientoPorRonda = data.guias.map((g, idx) => ({
    ronda: `R${idx + 1}`,
    realizadas: g.realizadas,
    canceladas: g.canceladas,
    pendientes: g.pendientes,
  }));

  // Distribución de estados
  const totales = data.guias.reduce(
    (acc, g) => ({
      realizadas: acc.realizadas + g.realizadas,
      canceladas: acc.canceladas + g.canceladas,
      agendadas: acc.agendadas + g.agendadas,
      dificiles: acc.dificiles + g.dificiles,
      pendientes: acc.pendientes + g.pendientes,
    }),
    { realizadas: 0, canceladas: 0, agendadas: 0, dificiles: 0, pendientes: 0 }
  );

  const distribucion = [
    { name: 'Realizadas', value: totales.realizadas, color: '#10b981' },
    { name: 'Canceladas', value: totales.canceladas, color: '#ef4444' },
    { name: 'Agendadas', value: totales.agendadas, color: '#3b82f6' },
    { name: 'Difíciles', value: totales.dificiles, color: '#f59e0b' },
    { name: 'Pendientes', value: totales.pendientes, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  // Tendencia temporal (agrupar por fecha)
  const porFecha: Record<string, { fecha: string; realizadas: number; dificiles: number }> = {};
  for (const g of data.guias) {
    if (!porFecha[g.fecha]) {
      porFecha[g.fecha] = { fecha: g.fecha, realizadas: 0, dificiles: 0 };
    }
    porFecha[g.fecha].realizadas += g.realizadas;
    porFecha[g.fecha].dificiles += g.dificiles;
  }
  const tendenciaTemporal = Object.values(porFecha).sort((a, b) => a.fecha.localeCompare(b.fecha));

  return { rendimientoPorRonda, distribucion, tendenciaTemporal };
}

// ==================== ANÁLISIS PRINCIPAL ====================

export async function analizarDatosTracker(
  content: string,
  usuarioNombre: string
): Promise<AnalysisResult> {
  // Parsear datos
  const data = parseTrackerCSV(content);
  if (!data.metadata.usuario) {
    data.metadata.usuario = usuarioNombre;
  }

  // Calcular KPIs
  const kpis = calcularKPIs(data);

  // Generar análisis
  const insights = generarInsights(data, kpis);
  const recommendations = generarRecomendaciones(data, kpis);
  const anomalies = detectarAnomalias(data);
  const tendencia = determinarTendencia(data);

  // Comparación con Amazon (benchmarks)
  const amazonBenchmarks = {
    tasaExito: 99.9,
    tiempoPromedio: 5,
    casosDificiles: 1,
  };
  const amazonComparison = {
    tasaExitoGap: Math.round((amazonBenchmarks.tasaExito - kpis.tasaExito) * 10) / 10,
    tiempoGap: kpis.tiempoPromedio - amazonBenchmarks.tiempoPromedio,
    casosDificilesGap: Math.round(((kpis.dificiles / Math.max(1, kpis.totalGuias)) * 100 - amazonBenchmarks.casosDificiles) * 10) / 10,
  };

  // Preparar datos para gráficos
  const charts = prepararDatosGraficos(data);

  return {
    success: true,
    data,
    analysis: {
      insights,
      recommendations,
      kpis: {
        productividad: kpis.productividad,
        tasaExito: kpis.tasaExito,
        eficiencia: kpis.eficiencia,
        tiempoPromedio: kpis.tiempoPromedio,
      },
      anomalies,
      amazonComparison,
      tendencia,
    },
    charts,
    timestamp: new Date().toISOString(),
  };
}

// ==================== ANÁLISIS CON CLAUDE AI ====================

// API Key should be configured via environment variable or settings panel
const getClaudeApiKey = (): string => {
  // Try to get from localStorage (configured in settings)
  const storedKey = localStorage.getItem('lp_claude_api_key');
  if (storedKey) return storedKey;

  // Fallback to environment variable (if available in build)
  return import.meta.env?.VITE_CLAUDE_API_KEY || '';
};

const CLAUDE_API_KEY = getClaudeApiKey();

export async function analizarConClaudeAI(data: TrackerData, usuarioNombre: string): Promise<{
  insights: string[];
  recommendations: string[];
  summary: string;
}> {
  try {
    const prompt = `
Eres un experto en logística y productividad. Analiza estos datos del operador ${usuarioNombre}:

RESUMEN:
- Total guías realizadas: ${data.resumen.totalGuiasRealizadas}
- Total novedades solucionadas: ${data.resumen.totalNovedadesSolucionadas}
- Total rondas: ${data.resumen.totalRondas}

DATOS DE GUÍAS:
${JSON.stringify(data.guias.slice(0, 10), null, 2)}

CONTEXTO LITPER:
- Meta de entrega: 85%
- Benchmark Amazon: 99.9%
- Meta diaria: 50 pedidos por operador

Responde con:
1. 3 insights clave (observaciones importantes)
2. 3 recomendaciones específicas
3. Un resumen ejecutivo de 2 líneas

Formato tu respuesta EXACTAMENTE así:
INSIGHTS:
- [insight 1]
- [insight 2]
- [insight 3]

RECOMENDACIONES:
- [rec 1]
- [rec 2]
- [rec 3]

RESUMEN:
[resumen ejecutivo]
`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error('Error al conectar con Claude AI');
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    // Parsear respuesta
    const insights: string[] = [];
    const recommendations: string[] = [];
    let summary = '';

    const insightsMatch = text.match(/INSIGHTS:\n([\s\S]*?)(?=RECOMENDACIONES:|$)/i);
    if (insightsMatch) {
      const lines = insightsMatch[1].split('\n').filter((l: string) => l.trim().startsWith('-'));
      insights.push(...lines.map((l: string) => l.replace(/^-\s*/, '').trim()));
    }

    const recsMatch = text.match(/RECOMENDACIONES:\n([\s\S]*?)(?=RESUMEN:|$)/i);
    if (recsMatch) {
      const lines = recsMatch[1].split('\n').filter((l: string) => l.trim().startsWith('-'));
      recommendations.push(...lines.map((l: string) => l.replace(/^-\s*/, '').trim()));
    }

    const summaryMatch = text.match(/RESUMEN:\n([\s\S]*?)$/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    return {
      insights: insights.length > 0 ? insights : ['Análisis completado correctamente'],
      recommendations: recommendations.length > 0 ? recommendations : ['Mantener el ritmo de trabajo actual'],
      summary: summary || 'Datos procesados exitosamente.',
    };
  } catch (error) {
    console.error('Error con Claude AI:', error);
    return {
      insights: ['No se pudo conectar con Claude AI para análisis avanzado'],
      recommendations: ['Revisar conexión y reintentar'],
      summary: 'Análisis básico completado. Análisis AI no disponible.',
    };
  }
}

export default {
  parseTrackerCSV,
  analizarDatosTracker,
  analizarConClaudeAI,
};
