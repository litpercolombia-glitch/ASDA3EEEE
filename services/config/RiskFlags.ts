/**
 * RiskFlags - PR #6
 *
 * Configurable flags for risky cities and carriers.
 * Used by RiskScoringService to add location-based risk points.
 *
 * Default values are empty - configure via environment or API.
 */

import { RiskFlagsConfig } from '../../types/scoring.types';

// =====================================================
// RISK FLAGS CONFIGURATION
// =====================================================

class RiskFlagsImpl {
  private config: RiskFlagsConfig = {
    riskyCities: [],
    riskyCarriers: [],
  };

  /**
   * Initialize from environment variables
   * RISKY_CITIES=Cali,Medellin,Barranquilla
   * RISKY_CARRIERS=CarrierX,CarrierY
   */
  constructor() {
    this.loadFromEnv();
  }

  /**
   * Load configuration from environment
   */
  private loadFromEnv(): void {
    const env = typeof process !== 'undefined' ? process.env : {};

    if (env.RISKY_CITIES) {
      this.config.riskyCities = env.RISKY_CITIES
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    }

    if (env.RISKY_CARRIERS) {
      this.config.riskyCarriers = env.RISKY_CARRIERS
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  /**
   * Reload configuration
   */
  reload(): void {
    this.loadFromEnv();
  }

  /**
   * Get current configuration
   */
  getConfig(): RiskFlagsConfig {
    return { ...this.config };
  }

  /**
   * Check if a city is flagged as risky
   */
  isRiskyCity(city: string | undefined): boolean {
    if (!city || this.config.riskyCities.length === 0) {
      return false;
    }
    return this.config.riskyCities.includes(city.toLowerCase());
  }

  /**
   * Check if a carrier is flagged as risky
   */
  isRiskyCarrier(carrier: string | undefined): boolean {
    if (!carrier || this.config.riskyCarriers.length === 0) {
      return false;
    }
    return this.config.riskyCarriers.includes(carrier.toLowerCase());
  }

  /**
   * Add a risky city (runtime)
   */
  addRiskyCity(city: string): void {
    const normalized = city.toLowerCase();
    if (!this.config.riskyCities.includes(normalized)) {
      this.config.riskyCities.push(normalized);
    }
  }

  /**
   * Add a risky carrier (runtime)
   */
  addRiskyCarrier(carrier: string): void {
    const normalized = carrier.toLowerCase();
    if (!this.config.riskyCarriers.includes(normalized)) {
      this.config.riskyCarriers.push(normalized);
    }
  }

  /**
   * Remove a risky city (runtime)
   */
  removeRiskyCity(city: string): void {
    const normalized = city.toLowerCase();
    this.config.riskyCities = this.config.riskyCities.filter(c => c !== normalized);
  }

  /**
   * Remove a risky carrier (runtime)
   */
  removeRiskyCarrier(carrier: string): void {
    const normalized = carrier.toLowerCase();
    this.config.riskyCarriers = this.config.riskyCarriers.filter(c => c !== normalized);
  }

  /**
   * Set full configuration (for testing or API)
   */
  setConfig(config: RiskFlagsConfig): void {
    this.config = {
      riskyCities: config.riskyCities.map(c => c.toLowerCase()),
      riskyCarriers: config.riskyCarriers.map(c => c.toLowerCase()),
    };
  }

  /**
   * Clear all flags (for testing)
   */
  clear(): void {
    this.config = {
      riskyCities: [],
      riskyCarriers: [],
    };
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const RiskFlags = new RiskFlagsImpl();
export default RiskFlags;
