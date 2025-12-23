// ============================================
// LITPER COMMAND CENTER - WEB SEARCH SERVICE
// Servicio de búsqueda web con DuckDuckGo
// ============================================

// ============================================
// TIPOS
// ============================================

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  totalResults: number;
  searchTime: number;
  source: 'duckduckgo' | 'google-custom' | 'cache';
}

export interface NewsResult {
  title: string;
  url: string;
  description: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

interface DDGResponse {
  Abstract: string;
  AbstractText: string;
  AbstractSource: string;
  AbstractURL: string;
  Image: string;
  Heading: string;
  Answer: string;
  AnswerType: string;
  Definition: string;
  DefinitionSource: string;
  DefinitionURL: string;
  RelatedTopics: DDGRelatedTopic[];
  Results: DDGResult[];
  Type: string;
  Redirect: string;
}

interface DDGRelatedTopic {
  FirstURL?: string;
  Icon?: { URL: string };
  Result?: string;
  Text?: string;
  Topics?: DDGRelatedTopic[];
}

interface DDGResult {
  FirstURL: string;
  Icon: { URL: string };
  Result: string;
  Text: string;
}

// ============================================
// CACHE SYSTEM
// ============================================

interface CacheEntry {
  data: WebSearchResponse;
  timestamp: number;
  ttl: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

function getCacheKey(query: string, type: string): string {
  return `${type}:${query.toLowerCase().trim()}`;
}

function getFromCache(key: string): WebSearchResponse | null {
  const entry = searchCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    searchCache.delete(key);
    return null;
  }

  return { ...entry.data, source: 'cache' };
}

function setCache(key: string, data: WebSearchResponse, ttl: number = CACHE_TTL): void {
  searchCache.set(key, { data, timestamp: Date.now(), ttl });

  // Limpiar cache viejo
  if (searchCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of searchCache.entries()) {
      if (now - v.timestamp > v.ttl) {
        searchCache.delete(k);
      }
    }
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function parseHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '');
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'web';
  }
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export const webSearchService = {
  /**
   * Búsqueda general con DuckDuckGo Instant Answers API
   */
  async search(query: string, maxResults: number = 10): Promise<WebSearchResponse> {
    const startTime = Date.now();
    const cacheKey = getCacheKey(query, 'search');

    // Verificar cache
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // DuckDuckGo Instant Answers API (no requiere API key)
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_redirect=1&no_html=1&skip_disambig=1`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`DDG API error: ${response.status}`);
      }

      const data: DDGResponse = await response.json();
      const results: WebSearchResult[] = [];

      // Agregar resultado principal si existe
      if (data.AbstractText && data.AbstractURL) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          snippet: parseHTMLEntities(data.AbstractText),
          source: data.AbstractSource || extractDomain(data.AbstractURL),
        });
      }

      // Agregar respuesta directa
      if (data.Answer) {
        results.push({
          title: `Respuesta: ${query}`,
          url: data.AnswerType ? `https://duckduckgo.com/?q=${encodedQuery}` : '',
          snippet: parseHTMLEntities(data.Answer),
          source: 'DuckDuckGo Instant Answer',
        });
      }

      // Agregar definición si existe
      if (data.Definition && data.DefinitionURL) {
        results.push({
          title: `Definición: ${query}`,
          url: data.DefinitionURL,
          snippet: parseHTMLEntities(data.Definition),
          source: data.DefinitionSource || 'Dictionary',
        });
      }

      // Agregar resultados directos
      for (const result of data.Results || []) {
        if (results.length >= maxResults) break;
        results.push({
          title: parseHTMLEntities(result.Text),
          url: result.FirstURL,
          snippet: parseHTMLEntities(result.Result || result.Text),
          source: extractDomain(result.FirstURL),
        });
      }

      // Agregar tópicos relacionados
      for (const topic of data.RelatedTopics || []) {
        if (results.length >= maxResults) break;

        // Tópicos anidados
        if (topic.Topics) {
          for (const subTopic of topic.Topics) {
            if (results.length >= maxResults) break;
            if (subTopic.FirstURL && subTopic.Text) {
              results.push({
                title: parseHTMLEntities(subTopic.Text.split(' - ')[0] || subTopic.Text),
                url: subTopic.FirstURL,
                snippet: parseHTMLEntities(subTopic.Text),
                source: extractDomain(subTopic.FirstURL),
              });
            }
          }
        } else if (topic.FirstURL && topic.Text) {
          results.push({
            title: parseHTMLEntities(topic.Text.split(' - ')[0] || topic.Text),
            url: topic.FirstURL,
            snippet: parseHTMLEntities(topic.Text),
            source: extractDomain(topic.FirstURL),
          });
        }
      }

      const searchResponse: WebSearchResponse = {
        query,
        results: results.slice(0, maxResults),
        totalResults: results.length,
        searchTime: Date.now() - startTime,
        source: 'duckduckgo',
      };

      setCache(cacheKey, searchResponse);
      return searchResponse;

    } catch (error) {
      console.error('Error in web search:', error);

      // Retornar respuesta vacía en caso de error
      return {
        query,
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
        source: 'duckduckgo',
      };
    }
  },

  /**
   * Búsqueda de información sobre logística en Colombia
   */
  async searchLogistics(query: string): Promise<WebSearchResponse> {
    const logisticsQuery = `${query} logística Colombia envíos transportadora`;
    return this.search(logisticsQuery, 8);
  },

  /**
   * Búsqueda de información sobre ciudades colombianas
   */
  async searchCity(ciudad: string): Promise<WebSearchResponse> {
    const cityQuery = `${ciudad} Colombia población zona código postal`;
    return this.search(cityQuery, 5);
  },

  /**
   * Búsqueda de tasas de cambio y precios
   */
  async searchPricing(query: string): Promise<WebSearchResponse> {
    const pricingQuery = `${query} precio Colombia COP pesos`;
    return this.search(pricingQuery, 5);
  },

  /**
   * Búsqueda de regulaciones y normativas
   */
  async searchRegulations(query: string): Promise<WebSearchResponse> {
    const regulationQuery = `${query} regulación normativa Colombia ley decreto`;
    return this.search(regulationQuery, 5);
  },

  /**
   * Verificar si el servicio está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://api.duckduckgo.com/?q=test&format=json', {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Limpiar caché de búsquedas
   */
  clearCache(): void {
    searchCache.clear();
  },

  /**
   * Obtener estadísticas del caché
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: searchCache.size,
      entries: Array.from(searchCache.keys()),
    };
  },
};

// ============================================
// SERVICIO DE CLIMA (útil para logística)
// ============================================

export interface WeatherInfo {
  ciudad: string;
  temperatura: number;
  condicion: string;
  humedad: number;
  viento: number;
  alertas: string[];
}

export const weatherService = {
  /**
   * Obtener información del clima para una ciudad
   * Usa Open-Meteo API (gratuita, sin API key)
   */
  async getWeather(ciudad: string): Promise<WeatherInfo | null> {
    try {
      // Primero geocodificar la ciudad
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ciudad)}&count=1&language=es&format=json`
      );

      if (!geoResponse.ok) return null;

      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) return null;

      const { latitude, longitude, name } = geoData.results[0];

      // Obtener clima actual
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Bogota`
      );

      if (!weatherResponse.ok) return null;

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

      // Mapear código de clima a texto
      const weatherCodes: Record<number, string> = {
        0: 'Despejado',
        1: 'Mayormente despejado',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Niebla',
        48: 'Niebla helada',
        51: 'Llovizna ligera',
        53: 'Llovizna moderada',
        55: 'Llovizna intensa',
        61: 'Lluvia ligera',
        63: 'Lluvia moderada',
        65: 'Lluvia intensa',
        71: 'Nieve ligera',
        73: 'Nieve moderada',
        75: 'Nieve intensa',
        80: 'Chubascos ligeros',
        81: 'Chubascos moderados',
        82: 'Chubascos violentos',
        95: 'Tormenta',
        96: 'Tormenta con granizo',
        99: 'Tormenta con granizo fuerte',
      };

      const condicion = weatherCodes[current.weather_code] || 'Desconocido';

      // Generar alertas basadas en condiciones
      const alertas: string[] = [];
      if (current.weather_code >= 61 && current.weather_code <= 99) {
        alertas.push('⚠️ Condiciones de lluvia/tormenta pueden afectar entregas');
      }
      if (current.wind_speed_10m > 40) {
        alertas.push('⚠️ Vientos fuertes pueden causar retrasos');
      }

      return {
        ciudad: name,
        temperatura: Math.round(current.temperature_2m),
        condicion,
        humedad: current.relative_humidity_2m,
        viento: Math.round(current.wind_speed_10m),
        alertas,
      };

    } catch (error) {
      console.error('Error getting weather:', error);
      return null;
    }
  },

  /**
   * Obtener clima de múltiples ciudades
   */
  async getMultipleWeather(ciudades: string[]): Promise<Map<string, WeatherInfo | null>> {
    const results = new Map<string, WeatherInfo | null>();

    await Promise.all(
      ciudades.map(async (ciudad) => {
        const weather = await this.getWeather(ciudad);
        results.set(ciudad, weather);
      })
    );

    return results;
  },
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  search: webSearchService,
  weather: weatherService,
};
