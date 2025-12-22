/**
 * Tests para services/secureAIService.ts
 *
 * Verifica que el servicio de IA seguro funciona correctamente
 * y maneja errores apropiadamente.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { secureAI, SecureAIError, createSecureAIHook } from '../../services/secureAIService';

// Mock de fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('secureAIService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // getStatus tests
  // ============================================
  describe('getStatus', () => {
    it('should fetch AI status from backend', async () => {
      const mockStatus = {
        status: 'ready',
        providers: {
          claude: { available: true, model: 'claude-sonnet-4' },
          gemini: { available: false, model: 'gemini-2.5-flash' },
          openai: { available: false, model: 'gpt-4o-mini' },
        },
        default_provider: 'claude',
        timestamp: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await secureAI.getStatus();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('ready');
      expect(result.providers.claude.available).toBe(true);
    });

    it('should throw SecureAIError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(secureAI.getStatus()).rejects.toThrow(SecureAIError);
    });

    it('should throw SecureAIError on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' }),
      });

      await expect(secureAI.getStatus()).rejects.toThrow(SecureAIError);
    });
  });

  // ============================================
  // chat tests
  // ============================================
  describe('chat', () => {
    it('should send chat messages to backend', async () => {
      const mockResponse = {
        success: true,
        content: 'Hello! How can I help you?',
        provider: 'claude',
        model: 'claude-sonnet-4',
        usage: { input_tokens: 10, output_tokens: 20 },
        timestamp: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await secureAI.chat([
        { role: 'user', content: 'Hello' },
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello! How can I help you?');
      expect(result.provider).toBe('claude');
    });

    it('should include system prompt when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: 'Response',
          provider: 'claude',
          model: 'claude-sonnet-4',
          timestamp: new Date().toISOString(),
        }),
      });

      await secureAI.chat(
        [{ role: 'user', content: 'Hello' }],
        { system: 'You are a helpful assistant' }
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are a helpful assistant');
    });

    it('should include temperature and max_tokens options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: 'Response',
          provider: 'claude',
          model: 'claude-sonnet-4',
          timestamp: new Date().toISOString(),
        }),
      });

      await secureAI.chat(
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.5, maxTokens: 1000 }
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.5);
      expect(callBody.max_tokens).toBe(1000);
    });
  });

  // ============================================
  // sendMessage tests
  // ============================================
  describe('sendMessage', () => {
    it('should send single message and return content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: 'Hi there!',
          provider: 'claude',
          model: 'claude-sonnet-4',
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await secureAI.sendMessage('Hello');

      expect(result).toBe('Hi there!');
    });
  });

  // ============================================
  // analyzeImage tests
  // ============================================
  describe('analyzeImage', () => {
    it('should send image analysis request', async () => {
      const mockResponse = {
        success: true,
        analysis: 'This is a delivery photo showing...',
        provider: 'claude',
        model: 'claude-sonnet-4',
        timestamp: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await secureAI.analyzeImage(
        'base64encodedimage',
        'Analyze this delivery photo'
      );

      expect(result.success).toBe(true);
      expect(result.analysis).toContain('delivery photo');
    });

    it('should handle data URL format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analysis: 'Analysis result',
          provider: 'claude',
          model: 'claude-sonnet-4',
          timestamp: new Date().toISOString(),
        }),
      });

      await secureAI.analyzeImage(
        'data:image/jpeg;base64,/9j/4AAQ...',
        'Analyze'
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.image_base64).toContain('data:image/jpeg');
    });
  });

  // ============================================
  // analyzeText tests
  // ============================================
  describe('analyzeText', () => {
    it('should analyze text with default type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analysis: 'General analysis...',
          analysis_type: 'general',
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await secureAI.analyzeText('Some text to analyze');

      expect(result.success).toBe(true);
      expect(result.analysis_type).toBe('general');
    });

    it('should support sentiment analysis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analysis: 'Positive sentiment detected',
          analysis_type: 'sentiment',
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await secureAI.analyzeText('Great service!', 'sentiment');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.analysis_type).toBe('sentiment');
    });

    it('should support logistics analysis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analysis: 'Package in transit...',
          analysis_type: 'logistics',
          timestamp: new Date().toISOString(),
        }),
      });

      await secureAI.analyzeText('Package status update', 'logistics');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.analysis_type).toBe('logistics');
    });
  });

  // ============================================
  // analyzeShipment tests
  // ============================================
  describe('analyzeShipment', () => {
    it('should analyze shipment with all parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analysis: 'High risk - 5 days without movement',
          tracking_number: '12345678901',
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await secureAI.analyzeShipment({
        trackingNumber: '12345678901',
        status: 'En Tránsito',
        daysInTransit: 5,
        city: 'Bogotá',
        carrier: 'Coordinadora',
      });

      expect(result.success).toBe(true);
      expect(result.tracking_number).toBe('12345678901');
    });

    it('should work with minimal parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analysis: 'Analysis result',
          tracking_number: '12345678901',
          timestamp: new Date().toISOString(),
        }),
      });

      await secureAI.analyzeShipment({
        trackingNumber: '12345678901',
        status: 'Pendiente',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // SecureAIError tests
  // ============================================
  describe('SecureAIError', () => {
    it('should create error with message and status code', () => {
      const error = new SecureAIError('Test error', 500);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('SecureAIError');
    });

    it('should include details when provided', () => {
      const details = { field: 'value' };
      const error = new SecureAIError('Test error', 400, details);

      expect(error.details).toEqual(details);
    });
  });

  // ============================================
  // createSecureAIHook tests
  // ============================================
  describe('createSecureAIHook', () => {
    it('should create hook with loading and error state', () => {
      const hook = createSecureAIHook();

      expect(hook.loading).toBe(false);
      expect(hook.error).toBe(null);
      expect(typeof hook.sendMessage).toBe('function');
      expect(typeof hook.analyzeImage).toBe('function');
    });

    it('sendMessage should return response on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: 'Response text',
          provider: 'claude',
          model: 'claude-sonnet-4',
          timestamp: new Date().toISOString(),
        }),
      });

      const hook = createSecureAIHook();
      const result = await hook.sendMessage('Hello');

      expect(result).toBe('Response text');
    });

    it('sendMessage should return null and set error on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const hook = createSecureAIHook();
      const result = await hook.sendMessage('Hello');

      expect(result).toBe(null);
      expect(hook.error).toContain('Network error');
    });
  });
});
