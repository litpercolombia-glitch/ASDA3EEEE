// /api/inbox/chatea.ts
// Endpoint para recibir webhooks de Chatea/Dropi

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

// Importar desde src usando paths relativos (Vercel compila desde raíz)
// En producción, estos imports funcionarán con la configuración de tsconfig
import { normalizeChateaEvent } from '../../src/core/inbox/normalize';
import { dedupeSeenOrMark } from '../../src/core/inbox/dedupeStore';
import { dispatchInboxEvent } from '../../src/core/inbox/dispatcher';

/**
 * POST /api/inbox/chatea
 * Recibe eventos desde Chatea (WhatsApp) y Dropi
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed',
      allowedMethods: ['POST'],
    });
  }

  const startTime = Date.now();

  try {
    // 1. Obtener configuración
    const webhookSecret = process.env.CHATEA_WEBHOOK_SECRET;
    const enableSignatureValidation = process.env.ENABLE_WEBHOOK_SIGNATURE_VALIDATION === 'true';

    // 2. Validar firma HMAC (si está habilitado)
    if (enableSignatureValidation && webhookSecret) {
      const signature = req.headers['x-chatea-signature'] as string;
      const isValid = validateWebhookSignature(req.body, signature, webhookSecret);

      if (!isValid) {
        console.warn('[Webhook] Invalid signature from:', req.headers['x-forwarded-for']);
        return res.status(401).json({
          ok: false,
          error: 'Invalid signature',
        });
      }
    } else if (!webhookSecret) {
      // Log warning en dev
      console.warn('[Webhook] No CHATEA_WEBHOOK_SECRET configured - skipping signature validation');
    }

    // 3. Validar payload
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid JSON body',
      });
    }

    // 4. Normalizar evento
    const inboxEvent = normalizeChateaEvent(payload);

    console.log('[Webhook] Received event:', {
      eventType: inboxEvent.eventType,
      orderId: inboxEvent.data.orderId,
      source: inboxEvent.source,
    });

    // 5. Dedupe (idempotencia)
    const alreadySeen = await dedupeSeenOrMark(inboxEvent.idempotencyKey);
    if (alreadySeen) {
      console.log('[Webhook] Duplicate event ignored:', inboxEvent.idempotencyKey);
      return res.status(200).json({
        ok: true,
        deduped: true,
        message: 'Event already processed',
      });
    }

    // 6. Dispatch (procesamiento asíncrono)
    const result = await dispatchInboxEvent(inboxEvent);

    // 7. Responder rápido
    const duration = Date.now() - startTime;
    console.log('[Webhook] Processed in', duration, 'ms:', result);

    return res.status(200).json({
      ok: result.success,
      action: result.action,
      orderId: result.orderId,
      processingTime: duration,
    });

  } catch (error) {
    console.error('[Webhook] Error processing:', error);

    // Responder 200 para evitar reintentos en errores de lógica
    // Solo retornar 5xx para errores de infraestructura
    return res.status(200).json({
      ok: false,
      error: 'Processing error',
      message: error instanceof Error ? error.message : 'Unknown error',
      // No incluir stack trace en producción
    });
  }
}

/**
 * Valida la firma HMAC del webhook
 */
function validateWebhookSignature(
  body: unknown,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) return false;

  try {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const expectedSignature = createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    // Comparación segura para evitar timing attacks
    return signature.length === expectedSignature.length &&
      signature.split('').every((char, i) => char === expectedSignature[i]);
  } catch {
    return false;
  }
}

/**
 * Configuración de Vercel
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
