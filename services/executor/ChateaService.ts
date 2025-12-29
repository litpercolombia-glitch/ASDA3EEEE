/**
 * ChateaService - WhatsApp API Integration
 *
 * Handles communication with Chatea API for sending WhatsApp messages.
 * NEVER logs phone numbers in clear text.
 */

import {
  ChateaSendRequest,
  ChateaResponse,
  ExecutorConfig,
  DEFAULT_EXECUTOR_CONFIG,
} from '../../types/executor.types';

// =====================================================
// CONFIGURATION
// =====================================================

/**
 * Load config from environment variables
 */
function loadConfig(): ExecutorConfig {
  const config: ExecutorConfig = {
    ...DEFAULT_EXECUTOR_CONFIG,
    enabled: process.env.EXECUTOR_ENABLED === 'true',
    pilotCity: process.env.PILOT_CITY || undefined,
    pilotCarrier: process.env.PILOT_CARRIER || undefined,
    chateaApiUrl: process.env.CHATEA_API_URL || '',
    chateaApiKey: process.env.CHATEA_API_KEY || '',
    rateLimits: {
      globalPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '20', 10),
      perPhonePerDay: parseInt(process.env.RATE_LIMIT_PER_PHONE_DAY || '2', 10),
      perGuiaPerTriggerPerDay: 1,
      dailySendLimit: parseInt(process.env.DAILY_SEND_LIMIT || '100', 10),
    },
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelaysMs: [60000, 300000, 900000], // 1m, 5m, 15m
  };

  return config;
}

// =====================================================
// CHATEA SERVICE
// =====================================================

class ChateaServiceImpl {
  private config: ExecutorConfig;

  constructor() {
    this.config = loadConfig();
  }

  /**
   * Reload configuration from environment
   */
  reloadConfig(): void {
    this.config = loadConfig();
  }

  /**
   * Get current configuration (for testing/debugging)
   */
  getConfig(): ExecutorConfig {
    return { ...this.config };
  }

  /**
   * Check if executor is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if a city/carrier matches pilot filters
   */
  matchesPilotFilter(city: string, carrier: string): boolean {
    // If no pilot filters set, all pass
    if (!this.config.pilotCity && !this.config.pilotCarrier) {
      return true;
    }

    // If pilot city set, must match
    if (this.config.pilotCity) {
      const cityMatch = city.toLowerCase().includes(this.config.pilotCity.toLowerCase());
      if (!cityMatch) return false;
    }

    // If pilot carrier set, must match
    if (this.config.pilotCarrier) {
      const carrierMatch = carrier.toLowerCase().includes(this.config.pilotCarrier.toLowerCase());
      if (!carrierMatch) return false;
    }

    return true;
  }

  /**
   * Send WhatsApp message via Chatea API
   *
   * @param phone - Phone number (NEVER logged)
   * @param template - Template name
   * @param variables - Template variables
   * @returns API response
   */
  async sendMessage(
    phone: string,
    template: string,
    variables: Record<string, string>
  ): Promise<ChateaResponse> {
    // Validate configuration
    if (!this.config.chateaApiUrl) {
      return {
        success: false,
        error: 'Chatea API URL not configured',
        errorCode: 500,
      };
    }

    if (!this.config.chateaApiKey) {
      return {
        success: false,
        error: 'Chatea API key not configured',
        errorCode: 500,
      };
    }

    // Prepare request (phone is passed but NOT logged)
    const request: ChateaSendRequest = {
      phone: this.normalizePhone(phone),
      template,
      variables,
    };

    try {
      const response = await this.makeApiCall(request);
      return response;
    } catch (error) {
      // Sanitize error - NEVER include phone in error message
      const errorMessage = this.sanitizeError(error);
      return {
        success: false,
        error: errorMessage,
        errorCode: this.extractErrorCode(error),
      };
    }
  }

  /**
   * Make actual API call to Chatea
   * In production, this uses fetch/axios
   * For now, returns mock response for testing
   */
  private async makeApiCall(request: ChateaSendRequest): Promise<ChateaResponse> {
    // TODO: Implement actual Chatea API call
    // This is a placeholder that simulates the API

    const url = `${this.config.chateaApiUrl}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.chateaApiKey}`,
        },
        body: JSON.stringify({
          to: request.phone,
          template: {
            name: request.template,
            components: [
              {
                type: 'body',
                parameters: Object.entries(request.variables).map(([key, value]) => ({
                  type: 'text',
                  text: value,
                })),
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status}`,
          errorCode: response.status,
        };
      }

      const data = await response.json();

      return {
        success: true,
        messageId: data.messageId || data.id || `msg_${Date.now()}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Normalize phone number for API
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Ensure starts with +
    if (!normalized.startsWith('+')) {
      // Assume Colombian if no country code
      if (normalized.startsWith('57')) {
        normalized = '+' + normalized;
      } else if (normalized.startsWith('0')) {
        normalized = '+57' + normalized.substring(1);
      } else {
        normalized = '+57' + normalized;
      }
    }

    return normalized;
  }

  /**
   * Sanitize error message to never include PII
   */
  private sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      // Remove any phone-like patterns from error message
      let message = error.message;
      message = message.replace(/\+?\d{10,15}/g, '[PHONE_REDACTED]');
      message = message.replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');
      return message;
    }
    return 'Unknown error';
  }

  /**
   * Extract HTTP error code from error
   */
  private extractErrorCode(error: unknown): number {
    if (error instanceof Error) {
      // Try to extract status code from error message or properties
      const match = error.message.match(/\b([45]\d{2})\b/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 500;
  }

  /**
   * Check if error is retryable (5xx or timeout)
   */
  isRetryableError(errorCode: number | undefined): boolean {
    if (!errorCode) return false;
    return errorCode >= 500 && errorCode < 600;
  }

  /**
   * Check if error is permanent (4xx)
   */
  isPermanentError(errorCode: number | undefined): boolean {
    if (!errorCode) return false;
    return errorCode >= 400 && errorCode < 500;
  }

  /**
   * Get retry delay for attempt number
   */
  getRetryDelay(attemptNumber: number): number {
    const delays = this.config.retryDelaysMs;
    if (attemptNumber >= delays.length) {
      return delays[delays.length - 1];
    }
    return delays[attemptNumber];
  }

  /**
   * Get max retries
   */
  getMaxRetries(): number {
    return this.config.maxRetries;
  }
}

// =====================================================
// MOCK SERVICE FOR TESTING
// =====================================================

/**
 * Mock Chatea service for testing
 * Simulates API responses without making real calls
 */
export class MockChateaService extends ChateaServiceImpl {
  private mockResponses: ChateaResponse[] = [];
  private callHistory: { phone: string; template: string; variables: Record<string, string> }[] = [];

  /**
   * Queue a mock response
   */
  queueResponse(response: ChateaResponse): void {
    this.mockResponses.push(response);
  }

  /**
   * Queue multiple mock responses
   */
  queueResponses(responses: ChateaResponse[]): void {
    this.mockResponses.push(...responses);
  }

  /**
   * Get call history (phones are logged in test only)
   */
  getCallHistory(): typeof this.callHistory {
    return [...this.callHistory];
  }

  /**
   * Clear mock state
   */
  clearMock(): void {
    this.mockResponses = [];
    this.callHistory = [];
  }

  /**
   * Override sendMessage to use mock responses
   */
  async sendMessage(
    phone: string,
    template: string,
    variables: Record<string, string>
  ): Promise<ChateaResponse> {
    // Record call (for testing only)
    this.callHistory.push({ phone, template, variables });

    // Return queued response or default success
    if (this.mockResponses.length > 0) {
      return this.mockResponses.shift()!;
    }

    // Default success response
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// Singleton export
export const ChateaService = new ChateaServiceImpl();

export default ChateaService;
