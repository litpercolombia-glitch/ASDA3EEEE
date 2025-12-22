/**
 * Tests para utils/sanitize.ts
 *
 * Estas pruebas son CRÍTICAS para la seguridad - verifican que
 * las funciones de sanitización previenen ataques XSS correctamente.
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  safeMarkdown,
  sanitizeAttribute,
  sanitizeUrl,
  stripHtml,
  truncateSafe,
  parseMarkdownToElements,
} from '../../utils/sanitize';

describe('sanitize utilities', () => {
  // ============================================
  // escapeHtml tests
  // ============================================
  describe('escapeHtml', () => {
    it('should escape basic HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
      expect(escapeHtml("It's fine")).toBe('It&#x27;s fine');
    });

    it('should escape backticks', () => {
      expect(escapeHtml('`code`')).toBe('&#x60;code&#x60;');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
      expect(escapeHtml(123 as unknown as string)).toBe('');
    });

    it('should preserve safe characters', () => {
      expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
    });

    it('should handle complex XSS attempts', () => {
      const xssPayload = '<img src="x" onerror="alert(1)">';
      const escaped = escapeHtml(xssPayload);
      expect(escaped).not.toContain('<img');
      expect(escaped).not.toContain('onerror');
    });
  });

  // ============================================
  // safeMarkdown tests
  // ============================================
  describe('safeMarkdown', () => {
    it('should convert **bold** to <strong>', () => {
      expect(safeMarkdown('This is **bold** text')).toBe(
        'This is <strong>bold</strong> text'
      );
    });

    it('should convert *italic* to <em>', () => {
      expect(safeMarkdown('This is *italic* text')).toBe(
        'This is <em>italic</em> text'
      );
    });

    it('should convert `code` to <code>', () => {
      const result = safeMarkdown('Use `npm install`');
      expect(result).toContain('<code');
      expect(result).toContain('npm install');
      expect(result).toContain('</code>');
    });

    it('should escape HTML before applying markdown', () => {
      const malicious = '**<script>alert(1)</script>**';
      const result = safeMarkdown(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('<strong>');
    });

    it('should handle multiple markdown formats', () => {
      const text = '**Bold** and *italic* and `code`';
      const result = safeMarkdown(text);
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<code');
    });

    it('should handle empty strings', () => {
      expect(safeMarkdown('')).toBe('');
    });

    it('should not be tricked by nested XSS in markdown', () => {
      const xss = '**<img src=x onerror=alert(1)>**';
      const result = safeMarkdown(xss);
      expect(result).not.toContain('<img');
      expect(result).not.toContain('onerror');
    });
  });

  // ============================================
  // sanitizeAttribute tests
  // ============================================
  describe('sanitizeAttribute', () => {
    it('should remove javascript: protocol', () => {
      expect(sanitizeAttribute('javascript:alert(1)')).not.toContain('javascript:');
    });

    it('should remove data: protocol', () => {
      expect(sanitizeAttribute('data:text/html,<script>alert(1)</script>')).not.toContain('data:');
    });

    it('should remove vbscript: protocol', () => {
      expect(sanitizeAttribute('vbscript:msgbox(1)')).not.toContain('vbscript:');
    });

    it('should remove event handlers', () => {
      expect(sanitizeAttribute('onclick=alert(1)')).not.toContain('onclick=');
      expect(sanitizeAttribute('onerror=alert(1)')).not.toContain('onerror=');
      expect(sanitizeAttribute('onload=alert(1)')).not.toContain('onload=');
    });

    it('should escape HTML characters in attributes', () => {
      expect(sanitizeAttribute('value with <tag>')).toContain('&lt;');
      expect(sanitizeAttribute('value with <tag>')).toContain('&gt;');
    });

    it('should handle case variations', () => {
      expect(sanitizeAttribute('JAVASCRIPT:alert(1)')).not.toContain('javascript:');
      expect(sanitizeAttribute('JavaScript:alert(1)')).not.toContain('javascript:');
    });
  });

  // ============================================
  // sanitizeUrl tests
  // ============================================
  describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
    });

    it('should allow anchor URLs', () => {
      expect(sanitizeUrl('#section')).toBe('#section');
    });

    it('should allow mailto URLs', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should block data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should block vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    });

    it('should block file: URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should add https to URLs without protocol', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com');
    });

    it('should handle empty strings', () => {
      expect(sanitizeUrl('')).toBe('');
    });

    it('should handle case variations', () => {
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
      expect(sanitizeUrl('JavaScript:alert(1)')).toBe('');
    });
  });

  // ============================================
  // stripHtml tests
  // ============================================
  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello');
    });

    it('should remove multiple tags', () => {
      expect(stripHtml('<div><p>Hello</p><span>World</span></div>')).toBe('HelloWorld');
    });

    it('should handle self-closing tags', () => {
      expect(stripHtml('Line1<br/>Line2')).toBe('Line1Line2');
    });

    it('should handle tags with attributes', () => {
      expect(stripHtml('<a href="http://example.com">Link</a>')).toBe('Link');
    });

    it('should handle empty strings', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should preserve text without HTML', () => {
      expect(stripHtml('Plain text')).toBe('Plain text');
    });
  });

  // ============================================
  // truncateSafe tests
  // ============================================
  describe('truncateSafe', () => {
    it('should truncate long strings', () => {
      expect(truncateSafe('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncateSafe('Hello', 10)).toBe('Hello');
    });

    it('should use custom suffix', () => {
      expect(truncateSafe('Hello World', 8, '…')).toBe('Hello W…');
    });

    it('should handle exact length', () => {
      expect(truncateSafe('Hello', 5)).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(truncateSafe('', 10)).toBe('');
    });
  });

  // ============================================
  // parseMarkdownToElements tests
  // ============================================
  describe('parseMarkdownToElements', () => {
    it('should parse bold text', () => {
      const elements = parseMarkdownToElements('Hello **bold** world');
      expect(elements).toContainEqual({ type: 'bold', content: 'bold' });
    });

    it('should parse italic text', () => {
      const elements = parseMarkdownToElements('Hello *italic* world');
      expect(elements).toContainEqual({ type: 'italic', content: 'italic' });
    });

    it('should parse code text', () => {
      const elements = parseMarkdownToElements('Use `code` here');
      expect(elements).toContainEqual({ type: 'code', content: 'code' });
    });

    it('should include plain text elements', () => {
      const elements = parseMarkdownToElements('Hello **bold** world');
      expect(elements.some(e => e.type === 'text' && e.content.includes('Hello'))).toBe(true);
    });

    it('should handle text without markdown', () => {
      const elements = parseMarkdownToElements('Plain text');
      expect(elements).toHaveLength(1);
      expect(elements[0]).toEqual({ type: 'text', content: 'Plain text' });
    });

    it('should handle empty strings', () => {
      const elements = parseMarkdownToElements('');
      expect(elements).toHaveLength(0);
    });
  });
});
