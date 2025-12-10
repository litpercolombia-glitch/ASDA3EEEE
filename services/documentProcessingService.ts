// ============================================
// LITPER PRO - DOCUMENT PROCESSING SERVICE
// Procesamiento de documentos con IA
// ============================================

import Anthropic from '@anthropic-ai/sdk';

// ============================================
// TIPOS
// ============================================

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: 'excel' | 'pdf' | 'docx' | 'txt' | 'url' | 'unknown';
  processedAt: Date;
  status: 'processing' | 'completed' | 'error';

  // Contenido extraído
  rawContent: string;

  // Análisis IA
  aiAnalysis: {
    summary: string;
    keyPoints: string[];
    recommendations: string[];
    category: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    actionItems: string[];
    entities: {
      cities: string[];
      carriers: string[];
      amounts: string[];
      dates: string[];
    };
  } | null;

  // Métricas (para Excel financiero)
  financialMetrics?: {
    totalSales: number;
    totalProfit: number;
    profitMargin: number;
    deliveryRate: number;
    returnRate: number;
    avgTicket: number;
  };

  error?: string;
}

export interface SessionData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  tabId: string;
  data: any;
  metadata: {
    recordCount: number;
    description: string;
  };
}

export interface KnowledgeEntry {
  id: string;
  type: 'proceso' | 'regla' | 'plantilla' | 'info' | 'faq';
  title: string;
  content: string;
  summary: string;
  tags: string[];
  source: string;
  createdAt: Date;
  priority: 'critica' | 'alta' | 'media' | 'baja';
}

// ============================================
// CONSTANTES DE ALMACENAMIENTO
// ============================================

const STORAGE_KEYS = {
  PROCESSED_DOCS: 'litper_processed_documents',
  SESSIONS: 'litper_saved_sessions',
  KNOWLEDGE_BASE: 'litper_knowledge_base',
  URL_CACHE: 'litper_url_cache',
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

const generateId = () => `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// SERVICIO DE PROCESAMIENTO DE DOCUMENTOS
// ============================================

export class DocumentProcessingService {
  private anthropic: Anthropic | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    }
  }

  // Procesar texto con IA
  async analyzeWithAI(
    content: string,
    context: string = 'documento'
  ): Promise<ProcessedDocument['aiAnalysis']> {
    if (!this.anthropic) {
      // Fallback si no hay API key - análisis básico
      return this.basicAnalysis(content);
    }

    try {
      const prompt = `Analiza el siguiente ${context} y proporciona un análisis estructurado en español.

CONTENIDO:
${content.substring(0, 15000)}

INSTRUCCIONES:
Responde SOLO con JSON válido (sin markdown, sin \`\`\`):

{
  "summary": "Resumen ejecutivo de 2-3 oraciones",
  "keyPoints": ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
  "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
  "category": "logistica|ventas|atencion|finanzas|operaciones|otro",
  "sentiment": "positive|neutral|negative",
  "actionItems": ["Acción a tomar 1", "Acción a tomar 2"],
  "entities": {
    "cities": ["ciudades mencionadas"],
    "carriers": ["transportadoras mencionadas"],
    "amounts": ["montos o valores"],
    "dates": ["fechas mencionadas"]
  }
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      // Limpiar respuesta de posibles markdown
      let cleanText = text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```json?\n?/g, '').replace(/```$/g, '');
      }

      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Error en análisis IA:', error);
      return this.basicAnalysis(content);
    }
  }

  // Análisis básico sin IA
  private basicAnalysis(content: string): ProcessedDocument['aiAnalysis'] {
    const words = content.split(/\s+/).length;
    const lines = content.split('\n').filter((l) => l.trim()).length;

    // Detectar entidades básicas
    const cities = this.extractCities(content);
    const carriers = this.extractCarriers(content);
    const amounts = this.extractAmounts(content);

    return {
      summary: `Documento con ${words} palabras y ${lines} líneas de contenido.`,
      keyPoints: [
        `Contiene información sobre ${cities.length > 0 ? cities.slice(0, 3).join(', ') : 'varias ubicaciones'}`,
        `${carriers.length > 0 ? `Menciona transportadoras: ${carriers.join(', ')}` : 'Documento general'}`,
        `Procesado automáticamente sin análisis IA profundo`,
      ],
      recommendations: [
        'Revisar el contenido manualmente para mayor precisión',
        'Considerar habilitar la API de IA para análisis más detallado',
        'Guardar en la base de conocimiento si es relevante',
      ],
      category: 'otro',
      sentiment: 'neutral',
      actionItems: ['Revisar documento', 'Clasificar manualmente'],
      entities: {
        cities,
        carriers,
        amounts,
        dates: this.extractDates(content),
      },
    };
  }

  // Extraer ciudades colombianas
  private extractCities(content: string): string[] {
    const colombianCities = [
      'BOGOTA',
      'MEDELLIN',
      'CALI',
      'BARRANQUILLA',
      'CARTAGENA',
      'BUCARAMANGA',
      'CUCUTA',
      'PEREIRA',
      'SANTA MARTA',
      'IBAGUE',
      'MANIZALES',
      'VILLAVICENCIO',
      'PASTO',
      'NEIVA',
      'ARMENIA',
      'MONTERIA',
      'VALLEDUPAR',
      'POPAYAN',
    ];
    const upper = content.toUpperCase();
    return colombianCities.filter((city) => upper.includes(city));
  }

  // Extraer transportadoras
  private extractCarriers(content: string): string[] {
    const carriers = [
      'COORDINADORA',
      'INTERRAPIDISIMO',
      'ENVIA',
      'TCC',
      'SERVIENTREGA',
      'VELOCES',
      '472',
    ];
    const upper = content.toUpperCase();
    return carriers.filter((carrier) => upper.includes(carrier));
  }

  // Extraer montos
  private extractAmounts(content: string): string[] {
    const amountRegex = /\$[\d,.]+|\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
    const matches = content.match(amountRegex) || [];
    return [...new Set(matches)].slice(0, 10);
  }

  // Extraer fechas
  private extractDates(content: string): string[] {
    const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g;
    const matches = content.match(dateRegex) || [];
    return [...new Set(matches)].slice(0, 10);
  }

  // Procesar archivo Excel
  async processExcel(data: any[], fileName: string): Promise<ProcessedDocument> {
    const docId = generateId();

    try {
      // Convertir datos a texto para análisis
      const textContent = this.excelToText(data);

      // Detectar si es archivo financiero de Dropi
      const isFinancial = this.isFinancialExcel(data);

      // Análisis IA
      const aiAnalysis = await this.analyzeWithAI(
        textContent,
        isFinancial ? 'reporte financiero de dropshipping' : 'archivo Excel'
      );

      // Métricas financieras si aplica
      let financialMetrics;
      if (isFinancial) {
        financialMetrics = this.extractFinancialMetrics(data);
      }

      const doc: ProcessedDocument = {
        id: docId,
        fileName,
        fileType: 'excel',
        processedAt: new Date(),
        status: 'completed',
        rawContent: textContent,
        aiAnalysis,
        financialMetrics,
      };

      this.saveProcessedDocument(doc);
      return doc;
    } catch (error: any) {
      const doc: ProcessedDocument = {
        id: docId,
        fileName,
        fileType: 'excel',
        processedAt: new Date(),
        status: 'error',
        rawContent: '',
        aiAnalysis: null,
        error: error.message,
      };
      return doc;
    }
  }

  // Convertir Excel a texto
  private excelToText(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    let text = `Columnas: ${headers.join(', ')}\n\n`;

    // Primeras 100 filas para análisis
    const sampleData = data.slice(0, 100);
    sampleData.forEach((row, idx) => {
      const values = headers.map((h) => `${h}: ${row[h] || ''}`).join(' | ');
      text += `Fila ${idx + 1}: ${values}\n`;
    });

    text += `\n... Total: ${data.length} registros`;
    return text;
  }

  // Detectar si es Excel financiero
  private isFinancialExcel(data: any[]): boolean {
    if (!data || data.length === 0) return false;

    const headers = Object.keys(data[0]).map((h) => h.toUpperCase());
    const financialKeywords = [
      'VALOR FACTURADO',
      'GANANCIA',
      'PRECIO FLETE',
      'COSTO',
      'DEVOLUCION',
      'ESTADO GUIA',
      'TRANSPORTADORA',
      'TOTAL',
    ];

    return financialKeywords.some((keyword) => headers.some((h) => h.includes(keyword)));
  }

  // Extraer métricas financieras
  private extractFinancialMetrics(data: any[]): ProcessedDocument['financialMetrics'] {
    let totalSales = 0;
    let totalProfit = 0;
    let deliveredCount = 0;
    let returnedCount = 0;

    data.forEach((row) => {
      // Buscar columnas de valor
      Object.entries(row).forEach(([key, value]) => {
        const keyUpper = key.toUpperCase();
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value).replace(/[,$]/g, '')) || 0;

        if (
          keyUpper.includes('FACTURADO') ||
          keyUpper.includes('VENTA') ||
          keyUpper.includes('TOTAL')
        ) {
          totalSales += numValue;
        }
        if (keyUpper.includes('GANANCIA') || keyUpper.includes('UTILIDAD')) {
          totalProfit += numValue;
        }

        // Contar estados
        if (keyUpper.includes('ESTADO') || keyUpper.includes('ESTATUS')) {
          const statusValue = String(value).toUpperCase();
          if (statusValue.includes('ENTREGADO') || statusValue.includes('EXITOSO')) {
            deliveredCount++;
          } else if (statusValue.includes('DEVOLU') || statusValue.includes('RETORNO')) {
            returnedCount++;
          }
        }
      });
    });

    const total = data.length;

    return {
      totalSales,
      totalProfit,
      profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
      deliveryRate: total > 0 ? (deliveredCount / total) * 100 : 0,
      returnRate: total > 0 ? (returnedCount / total) * 100 : 0,
      avgTicket: total > 0 ? totalSales / total : 0,
    };
  }

  // Procesar URL
  async processUrl(url: string): Promise<ProcessedDocument> {
    const docId = generateId();

    try {
      // Intentar obtener contenido de la URL
      const response = await fetch(url);
      const html = await response.text();

      // Extraer texto del HTML
      const textContent = this.extractTextFromHtml(html);

      // Análisis IA
      const aiAnalysis = await this.analyzeWithAI(textContent, 'página web');

      const doc: ProcessedDocument = {
        id: docId,
        fileName: url,
        fileType: 'url',
        processedAt: new Date(),
        status: 'completed',
        rawContent: textContent,
        aiAnalysis,
      };

      this.saveProcessedDocument(doc);
      return doc;
    } catch (error: any) {
      // Si falla el fetch, intentar análisis solo de la URL
      const basicAnalysis = this.basicAnalysis(`URL: ${url}`);

      const doc: ProcessedDocument = {
        id: docId,
        fileName: url,
        fileType: 'url',
        processedAt: new Date(),
        status: 'error',
        rawContent: url,
        aiAnalysis: basicAnalysis,
        error: `No se pudo cargar la URL: ${error.message}. El análisis se realizó con información limitada.`,
      };

      return doc;
    }
  }

  // Extraer texto de HTML
  private extractTextFromHtml(html: string): string {
    // Remover scripts y estilos
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.substring(0, 20000);
  }

  // Procesar texto plano
  async processText(content: string, fileName: string): Promise<ProcessedDocument> {
    const docId = generateId();

    const aiAnalysis = await this.analyzeWithAI(content, 'documento de texto');

    const doc: ProcessedDocument = {
      id: docId,
      fileName,
      fileType: 'txt',
      processedAt: new Date(),
      status: 'completed',
      rawContent: content,
      aiAnalysis,
    };

    this.saveProcessedDocument(doc);
    return doc;
  }

  // ============================================
  // GESTIÓN DE DOCUMENTOS PROCESADOS
  // ============================================

  saveProcessedDocument(doc: ProcessedDocument): void {
    const docs = this.getProcessedDocuments();
    const existingIndex = docs.findIndex((d) => d.id === doc.id);

    if (existingIndex >= 0) {
      docs[existingIndex] = doc;
    } else {
      docs.unshift(doc);
    }

    // Mantener máximo 50 documentos
    const limited = docs.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.PROCESSED_DOCS, JSON.stringify(limited));
  }

  getProcessedDocuments(): ProcessedDocument[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROCESSED_DOCS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  deleteProcessedDocument(id: string): void {
    const docs = this.getProcessedDocuments().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROCESSED_DOCS, JSON.stringify(docs));
  }

  clearAllDocuments(): void {
    localStorage.removeItem(STORAGE_KEYS.PROCESSED_DOCS);
  }

  // ============================================
  // GESTIÓN DE SESIONES
  // ============================================

  saveSession(tabId: string, name: string, data: any, description: string = ''): SessionData {
    const sessions = this.getSessions();

    const session: SessionData = {
      id: generateId(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      tabId,
      data,
      metadata: {
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        description,
      },
    };

    sessions.unshift(session);

    // Mantener máximo 30 sesiones por pestaña
    const tabSessions = sessions.filter((s) => s.tabId === tabId).slice(0, 30);
    const otherSessions = sessions.filter((s) => s.tabId !== tabId);
    const combined = [...tabSessions, ...otherSessions];

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(combined));

    return session;
  }

  getSessions(tabId?: string): SessionData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      const sessions: SessionData[] = stored ? JSON.parse(stored) : [];

      if (tabId) {
        return sessions.filter((s) => s.tabId === tabId);
      }
      return sessions;
    } catch {
      return [];
    }
  }

  getSession(id: string): SessionData | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id) || null;
  }

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  // ============================================
  // BASE DE CONOCIMIENTO
  // ============================================

  addToKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'createdAt'>): KnowledgeEntry {
    const knowledge = this.getKnowledge();

    const newEntry: KnowledgeEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date(),
    };

    knowledge.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(knowledge.slice(0, 200)));

    return newEntry;
  }

  getKnowledge(type?: KnowledgeEntry['type']): KnowledgeEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
      const knowledge: KnowledgeEntry[] = stored ? JSON.parse(stored) : [];

      if (type) {
        return knowledge.filter((k) => k.type === type);
      }
      return knowledge;
    } catch {
      return [];
    }
  }

  searchKnowledge(query: string): KnowledgeEntry[] {
    const knowledge = this.getKnowledge();
    const queryLower = query.toLowerCase();

    return knowledge.filter(
      (k) =>
        k.title.toLowerCase().includes(queryLower) ||
        k.content.toLowerCase().includes(queryLower) ||
        k.summary.toLowerCase().includes(queryLower) ||
        k.tags.some((t) => t.toLowerCase().includes(queryLower))
    );
  }

  deleteKnowledge(id: string): void {
    const knowledge = this.getKnowledge().filter((k) => k.id !== id);
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(knowledge));
  }
}

// Singleton instance
export const documentProcessor = new DocumentProcessingService();

export default documentProcessor;
