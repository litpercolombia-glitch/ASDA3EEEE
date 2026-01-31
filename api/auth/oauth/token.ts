// api/auth/oauth/token.ts
// Vercel Serverless Function para intercambiar código OAuth por token
import type { VercelRequest, VercelResponse } from '@vercel/node';

const OAUTH_CONFIG = {
  google: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  microsoft: {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },
  apple: {
    tokenUrl: 'https://appleid.apple.com/auth/token',
    clientId: process.env.APPLE_CLIENT_ID || '',
    clientSecret: process.env.APPLE_CLIENT_SECRET || '',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, provider, redirect_uri } = req.body;

    if (!code || !provider || !redirect_uri) {
      return res.status(400).json({ error: 'Missing required fields: code, provider, redirect_uri' });
    }

    const providerLower = provider.toLowerCase() as keyof typeof OAUTH_CONFIG;
    const config = OAUTH_CONFIG[providerLower];

    if (!config) {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    if (!config.clientId || !config.clientSecret) {
      console.error(`OAuth ${provider}: credentials not configured`);
      return res.status(500).json({ error: `OAuth ${provider} not configured on server` });
    }

    // Preparar datos para el token exchange
    const tokenData = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri,
      grant_type: 'authorization_code',
    });

    // Llamar al endpoint de token del proveedor
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenData.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`OAuth ${provider} token exchange failed:`, errorText);
      return res.status(401).json({ error: 'Failed to exchange code for token' });
    }

    const tokens = await tokenResponse.json();

    console.log(`✅ OAuth ${provider} token exchange successful`);

    return res.status(200).json({
      access_token: tokens.access_token,
      token_type: tokens.token_type || 'Bearer',
      expires_in: tokens.expires_in || 3600,
      refresh_token: tokens.refresh_token || null,
      id_token: tokens.id_token || null,
    });

  } catch (error) {
    console.error('OAuth token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error during token exchange' });
  }
}
