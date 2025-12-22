/**
 * Utilidades de Sanitización de HTML
 *
 * Previene vulnerabilidades XSS al escapar caracteres peligrosos
 * y validar el contenido antes de renderizarlo.
 */

// Mapa de caracteres HTML que deben ser escapados
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapa caracteres HTML peligrosos
 * @param text - Texto a escapar
 * @returns Texto con caracteres HTML escapados
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Aplica formato Markdown básico de forma segura
 * Solo permite: **bold**, *italic*, `code`
 *
 * @param text - Texto con Markdown
 * @returns HTML seguro con formato aplicado
 */
export function safeMarkdown(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  // Primero escapar HTML
  let safe = escapeHtml(text);

  // Luego aplicar formato Markdown seguro
  // **bold** -> <strong>bold</strong>
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // *italic* -> <em>italic</em> (pero no si es parte de **)
  safe = safe.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // `code` -> <code>code</code>
  safe = safe.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');

  return safe;
}

/**
 * Sanitiza contenido para uso seguro en atributos HTML
 * @param value - Valor del atributo
 * @returns Valor seguro para atributos
 */
export function sanitizeAttribute(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Valida y sanitiza una URL
 * @param url - URL a validar
 * @returns URL segura o cadena vacía si es peligrosa
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim().toLowerCase();

  // Bloquear protocolos peligrosos
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ];

  if (dangerousProtocols.some((protocol) => trimmed.startsWith(protocol))) {
    return '';
  }

  // Permitir URLs relativas, http, https, mailto
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('#')
  ) {
    return url;
  }

  // Si no tiene protocolo, asumir https
  if (!trimmed.includes('://')) {
    return `https://${url}`;
  }

  return '';
}

/**
 * Elimina todas las etiquetas HTML
 * @param html - HTML a limpiar
 * @returns Texto plano sin HTML
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  return html.replace(/<[^>]*>/g, '');
}

/**
 * Trunca texto de forma segura (sin cortar en medio de entidades HTML)
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @param suffix - Sufijo a agregar si se trunca
 */
export function truncateSafe(text: string, maxLength: number, suffix = '...'): string {
  if (typeof text !== 'string' || text.length <= maxLength) {
    return text;
  }

  // Truncar y agregar sufijo
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Renderiza Markdown a React-safe JSX elements
 * Esta es la forma SEGURA de renderizar markdown sin dangerouslySetInnerHTML
 *
 * @param text - Texto con formato Markdown
 * @returns Array de elementos para renderizar
 */
export function parseMarkdownToElements(text: string): Array<{
  type: 'text' | 'bold' | 'italic' | 'code';
  content: string;
}> {
  const elements: Array<{ type: 'text' | 'bold' | 'italic' | 'code'; content: string }> = [];

  // Regex para detectar patrones de markdown
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' as const },
    { regex: /\*([^*]+)\*/g, type: 'italic' as const },
    { regex: /`([^`]+)`/g, type: 'code' as const },
  ];

  let lastIndex = 0;
  let currentText = text;

  // Simple tokenizer - procesa en orden
  while (currentText.length > 0) {
    let earliestMatch: { index: number; length: number; content: string; type: 'bold' | 'italic' | 'code' } | null = null;

    // Encontrar el match más temprano
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0; // Reset regex
      const match = pattern.regex.exec(currentText);
      if (match && (!earliestMatch || match.index < earliestMatch.index)) {
        earliestMatch = {
          index: match.index,
          length: match[0].length,
          content: match[1],
          type: pattern.type,
        };
      }
    }

    if (earliestMatch) {
      // Agregar texto antes del match
      if (earliestMatch.index > 0) {
        elements.push({
          type: 'text',
          content: currentText.substring(0, earliestMatch.index),
        });
      }

      // Agregar el elemento formateado
      elements.push({
        type: earliestMatch.type,
        content: earliestMatch.content,
      });

      // Continuar con el resto del texto
      currentText = currentText.substring(earliestMatch.index + earliestMatch.length);
    } else {
      // No más matches, agregar el resto como texto
      if (currentText.length > 0) {
        elements.push({ type: 'text', content: currentText });
      }
      break;
    }
  }

  return elements;
}

export default {
  escapeHtml,
  safeMarkdown,
  sanitizeAttribute,
  sanitizeUrl,
  stripHtml,
  truncateSafe,
  parseMarkdownToElements,
};
