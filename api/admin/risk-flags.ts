/**
 * Admin Endpoint: /api/admin/risk-flags
 *
 * GET - Get current risk flags (risky cities/carriers)
 * PUT - Update risk flags (with audit trail)
 *
 * Allows dynamic configuration without deploy.
 *
 * Protected by ADMIN_SECRET.
 * NO PII in responses.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminAuth, logAdminAction } from '../../services/auth';

// =====================================================
// TYPES
// =====================================================

interface RiskFlagsUpdateRequest {
  riskyCities?: string[];
  riskyCarriers?: string[];
  addCities?: string[];
  removeCities?: string[];
  addCarriers?: string[];
  removeCarriers?: string[];
}

// Audit trail for changes
interface RiskFlagsChange {
  timestamp: Date;
  action: 'SET' | 'ADD' | 'REMOVE';
  field: 'cities' | 'carriers';
  values: string[];
  reason?: string;
}

const auditTrail: RiskFlagsChange[] = [];
const MAX_AUDIT_ENTRIES = 100;

// =====================================================
// VALIDATION
// =====================================================

function validateRequest(body: any): {
  valid: boolean;
  errors: string[];
  data?: RiskFlagsUpdateRequest;
} {
  const errors: string[] = [];

  // At least one field must be present
  const hasField = body.riskyCities || body.riskyCarriers ||
    body.addCities || body.removeCities ||
    body.addCarriers || body.removeCarriers;

  if (!hasField) {
    errors.push('At least one field required: riskyCities, riskyCarriers, addCities, removeCities, addCarriers, removeCarriers');
  }

  // Validate arrays
  const arrayFields = ['riskyCities', 'riskyCarriers', 'addCities', 'removeCities', 'addCarriers', 'removeCarriers'];

  for (const field of arrayFields) {
    if (body[field] !== undefined) {
      if (!Array.isArray(body[field])) {
        errors.push(`${field} must be an array`);
      } else {
        // Validate each item is a non-empty string
        for (const item of body[field]) {
          if (typeof item !== 'string' || item.trim().length === 0) {
            errors.push(`${field} must contain non-empty strings`);
            break;
          }
          // No phone numbers in city/carrier names
          if (/\d{7,}/.test(item)) {
            errors.push(`${field} values cannot contain long numbers`);
            break;
          }
        }

        // Limit array size
        if (body[field].length > 100) {
          errors.push(`${field} cannot have more than 100 items`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? body as RiskFlagsUpdateRequest : undefined,
  };
}

// =====================================================
// HANDLER
// =====================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Validate auth (ADMIN_SECRET)
  const auth = requireAdminAuth(req);
  if (!auth.authorized) {
    res.status(401).json({ error: auth.error || 'Unauthorized' });
    return;
  }

  const { RiskFlags } = await import('../../services/config/RiskFlags');

  // GET - Return current flags
  if (req.method === 'GET') {
    const config = RiskFlags.getConfig();

    // Cache OK for read-only GET
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.status(200).json({
      timestamp: new Date().toISOString(),
      config: {
        riskyCities: config.riskyCities,
        riskyCarriers: config.riskyCarriers,
      },
      counts: {
        cities: config.riskyCities.length,
        carriers: config.riskyCarriers.length,
      },
      recentChanges: auditTrail.slice(-10).map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
      })),
    });
    return;
  }

  // PUT - Update flags
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed. Use GET or PUT.' });
    return;
  }

  // Validate request
  const validation = validateRequest(req.body);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
    });
    return;
  }

  const data = validation.data!;
  const now = new Date();
  const changes: string[] = [];

  // CRITICAL: No caching for mutations
  res.setHeader('Cache-Control', 'no-store');

  try {
    // Full replacement if provided
    if (data.riskyCities) {
      const oldCities = RiskFlags.getConfig().riskyCities;
      RiskFlags.setConfig({
        riskyCities: data.riskyCities,
        riskyCarriers: RiskFlags.getConfig().riskyCarriers,
      });
      changes.push(`Set riskyCities: ${data.riskyCities.length} items`);

      auditTrail.push({
        timestamp: now,
        action: 'SET',
        field: 'cities',
        values: data.riskyCities,
        reason: req.body.reason,
      });
    }

    if (data.riskyCarriers) {
      RiskFlags.setConfig({
        riskyCities: RiskFlags.getConfig().riskyCities,
        riskyCarriers: data.riskyCarriers,
      });
      changes.push(`Set riskyCarriers: ${data.riskyCarriers.length} items`);

      auditTrail.push({
        timestamp: now,
        action: 'SET',
        field: 'carriers',
        values: data.riskyCarriers,
        reason: req.body.reason,
      });
    }

    // Incremental additions
    if (data.addCities) {
      for (const city of data.addCities) {
        RiskFlags.addRiskyCity(city);
      }
      changes.push(`Added cities: ${data.addCities.join(', ')}`);

      auditTrail.push({
        timestamp: now,
        action: 'ADD',
        field: 'cities',
        values: data.addCities,
        reason: req.body.reason,
      });
    }

    if (data.addCarriers) {
      for (const carrier of data.addCarriers) {
        RiskFlags.addRiskyCarrier(carrier);
      }
      changes.push(`Added carriers: ${data.addCarriers.join(', ')}`);

      auditTrail.push({
        timestamp: now,
        action: 'ADD',
        field: 'carriers',
        values: data.addCarriers,
        reason: req.body.reason,
      });
    }

    // Incremental removals
    if (data.removeCities) {
      for (const city of data.removeCities) {
        RiskFlags.removeRiskyCity(city);
      }
      changes.push(`Removed cities: ${data.removeCities.join(', ')}`);

      auditTrail.push({
        timestamp: now,
        action: 'REMOVE',
        field: 'cities',
        values: data.removeCities,
        reason: req.body.reason,
      });
    }

    if (data.removeCarriers) {
      for (const carrier of data.removeCarriers) {
        RiskFlags.removeRiskyCarrier(carrier);
      }
      changes.push(`Removed carriers: ${data.removeCarriers.join(', ')}`);

      auditTrail.push({
        timestamp: now,
        action: 'REMOVE',
        field: 'carriers',
        values: data.removeCarriers,
        reason: req.body.reason,
      });
    }

    // Trim audit trail
    while (auditTrail.length > MAX_AUDIT_ENTRIES) {
      auditTrail.shift();
    }

    // Log action
    logAdminAction('RISK_FLAGS_UPDATED', {
      changes,
      reason: req.body.reason,
    }, req);

    const newConfig = RiskFlags.getConfig();

    res.status(200).json({
      timestamp: now.toISOString(),
      success: true,
      changes,
      config: {
        riskyCities: newConfig.riskyCities,
        riskyCarriers: newConfig.riskyCarriers,
      },
      counts: {
        cities: newConfig.riskyCities.length,
        carriers: newConfig.riskyCarriers.length,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[RISK-FLAGS] Error:', message);
    res.status(500).json({ error: message });
  }
}
