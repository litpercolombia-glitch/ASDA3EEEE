#!/usr/bin/env node
// ============================================
// META-ADS-MCP SERVER
// Local MCP Server - JSON-RPC 2.0 over stdio
// No external dependencies - pure Node.js
// ============================================

const SERVER_NAME = 'meta-ads-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// ============================================
// MCP TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'get_campaigns',
    description: 'List all advertising campaigns from Meta Ads account with status, budget, and performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: 'Meta Ads account ID' },
        status: { type: 'string', description: 'Filter by status (ACTIVE, PAUSED, ARCHIVED)', enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'ALL'] },
        limit: { type: 'number', description: 'Maximum number of campaigns to return (default: 25)' },
      },
      required: ['account_id'],
    },
  },
  {
    name: 'get_campaign_insights',
    description: 'Get detailed performance insights for a specific campaign (impressions, clicks, spend, conversions, ROAS)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID to get insights for' },
        date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        breakdown: { type: 'string', description: 'Breakdown dimension (age, gender, platform, placement)', enum: ['age', 'gender', 'platform', 'placement', 'none'] },
      },
      required: ['campaign_id', 'date_from', 'date_to'],
    },
  },
  {
    name: 'get_ad_spend',
    description: 'Get total advertising spend aggregated by day, campaign, or ad set for a date range',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: 'Meta Ads account ID' },
        date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        group_by: { type: 'string', description: 'Group results by (day, campaign, adset)', enum: ['day', 'campaign', 'adset'] },
      },
      required: ['account_id', 'date_from', 'date_to'],
    },
  },
  {
    name: 'get_audiences',
    description: 'List saved and custom audiences available in the Meta Ads account',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: 'Meta Ads account ID' },
        type: { type: 'string', description: 'Audience type filter', enum: ['saved', 'custom', 'lookalike', 'all'] },
      },
      required: ['account_id'],
    },
  },
  {
    name: 'get_ad_creatives',
    description: 'Get creative assets (images, videos, copy) for ads in a campaign or ad set',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID to get creatives for' },
        adset_id: { type: 'string', description: 'Ad set ID (optional, filters within campaign)' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'calculate_roas',
    description: 'Calculate Return on Ad Spend (ROAS) for campaigns, comparing ad spend vs revenue',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: 'Meta Ads account ID' },
        date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        revenue_data: {
          type: 'object',
          description: 'Revenue data to compare against spend',
          properties: {
            total_revenue: { type: 'number', description: 'Total revenue in the period' },
            currency: { type: 'string', description: 'Currency code (COP, USD, etc.)' },
          },
        },
      },
      required: ['account_id', 'date_from', 'date_to'],
    },
  },
];

// ============================================
// TOOL HANDLERS (Simulated - ready for real API integration)
// ============================================

async function handleGetCampaigns(params) {
  const { account_id, status, limit } = params;
  const maxResults = limit || 25;
  const filterStatus = status || 'ALL';

  // In production: call Meta Marketing API /act_{account_id}/campaigns
  return {
    account_id,
    filter: filterStatus,
    campaigns: [
      {
        id: 'camp_001',
        name: 'Black Friday 2025',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        daily_budget: 150000,
        lifetime_budget: null,
        spend_today: 145000,
        currency: 'COP',
        created_at: '2025-11-15T10:00:00Z',
      },
      {
        id: 'camp_002',
        name: 'Remarketing Carrito Abandonado',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        daily_budget: 80000,
        lifetime_budget: null,
        spend_today: 76500,
        currency: 'COP',
        created_at: '2025-10-01T08:00:00Z',
      },
      {
        id: 'camp_003',
        name: 'Prospecting Lookalike',
        status: 'PAUSED',
        objective: 'REACH',
        daily_budget: 100000,
        lifetime_budget: null,
        spend_today: 0,
        currency: 'COP',
        created_at: '2025-09-20T12:00:00Z',
      },
    ].filter(c => filterStatus === 'ALL' || c.status === filterStatus).slice(0, maxResults),
    total: 3,
    message: `Found campaigns for account ${account_id}`,
  };
}

async function handleGetCampaignInsights(params) {
  const { campaign_id, date_from, date_to, breakdown } = params;

  return {
    campaign_id,
    date_range: { from: date_from, to: date_to },
    breakdown: breakdown || 'none',
    metrics: {
      impressions: 245000,
      reach: 185000,
      clicks: 8500,
      ctr: 3.47,
      cpc: 58.82,
      cpm: 2040.82,
      spend: 500000,
      conversions: 156,
      cost_per_conversion: 3205.13,
      conversion_rate: 1.84,
      roas: 4.2,
      frequency: 1.32,
      currency: 'COP',
    },
    daily_breakdown: [
      { date: date_from, spend: 150000, impressions: 75000, clicks: 2600, conversions: 48 },
      { date: date_to, spend: 150000, impressions: 72000, clicks: 2500, conversions: 45 },
    ],
    message: `Insights for campaign ${campaign_id} from ${date_from} to ${date_to}`,
  };
}

async function handleGetAdSpend(params) {
  const { account_id, date_from, date_to, group_by } = params;
  const grouping = group_by || 'day';

  return {
    account_id,
    date_range: { from: date_from, to: date_to },
    group_by: grouping,
    total_spend: 1500000,
    currency: 'COP',
    breakdown: [
      { label: grouping === 'day' ? date_from : 'Black Friday 2025', spend: 500000, percentage: 33.3 },
      { label: grouping === 'day' ? date_to : 'Remarketing Carrito', spend: 400000, percentage: 26.7 },
      { label: grouping === 'day' ? '2025-12-03' : 'Prospecting Lookalike', spend: 600000, percentage: 40.0 },
    ],
    message: `Ad spend for account ${account_id} grouped by ${grouping}`,
  };
}

async function handleGetAudiences(params) {
  const { account_id, type } = params;
  const filterType = type || 'all';

  return {
    account_id,
    filter: filterType,
    audiences: [
      { id: 'aud_001', name: 'Compradores ultimos 30 dias', type: 'custom', size: 12500, source: 'pixel' },
      { id: 'aud_002', name: 'Lookalike Compradores 1%', type: 'lookalike', size: 450000, source: 'custom_audience' },
      { id: 'aud_003', name: 'Interes: Dropshipping Colombia', type: 'saved', size: 2800000, source: 'interest_targeting' },
      { id: 'aud_004', name: 'Visitantes Web 7 dias', type: 'custom', size: 8200, source: 'pixel' },
    ].filter(a => filterType === 'all' || a.type === filterType),
    message: `Audiences for account ${account_id}`,
  };
}

async function handleGetAdCreatives(params) {
  const { campaign_id, adset_id } = params;

  return {
    campaign_id,
    adset_id: adset_id || null,
    creatives: [
      {
        id: 'cre_001',
        name: 'Video Black Friday 15s',
        type: 'video',
        thumbnail_url: '/media/thumbnails/bf_video.jpg',
        headline: 'Hasta 70% OFF en todo!',
        body: 'Aprovecha los mejores descuentos del ano. Solo por tiempo limitado.',
        cta: 'SHOP_NOW',
        performance: { ctr: 4.2, cpc: 45, conversions: 89 },
      },
      {
        id: 'cre_002',
        name: 'Carousel Productos Top',
        type: 'carousel',
        cards: 5,
        headline: 'Los mas vendidos de la semana',
        body: 'Descubre los productos que todos estan comprando.',
        cta: 'LEARN_MORE',
        performance: { ctr: 2.8, cpc: 62, conversions: 45 },
      },
    ],
    message: `Creatives for campaign ${campaign_id}`,
  };
}

async function handleCalculateRoas(params) {
  const { account_id, date_from, date_to, revenue_data } = params;
  const totalSpend = 1500000;
  const totalRevenue = revenue_data?.total_revenue || 6750000;
  const currency = revenue_data?.currency || 'COP';
  const roas = totalRevenue / totalSpend;

  return {
    account_id,
    date_range: { from: date_from, to: date_to },
    total_spend: totalSpend,
    total_revenue: totalRevenue,
    roas: parseFloat(roas.toFixed(2)),
    currency,
    by_campaign: [
      { campaign: 'Black Friday 2025', spend: 500000, revenue: 2500000, roas: 5.0 },
      { campaign: 'Remarketing Carrito', spend: 400000, revenue: 2400000, roas: 6.0 },
      { campaign: 'Prospecting Lookalike', spend: 600000, revenue: 1850000, roas: 3.08 },
    ],
    recommendation: roas >= 4 ? 'ROAS saludable. Considera escalar presupuesto.' : roas >= 2 ? 'ROAS aceptable. Optimiza audiencias y creativos.' : 'ROAS bajo. Revisa segmentacion y funnel de conversion.',
    message: `ROAS calculation for account ${account_id}: ${roas.toFixed(2)}x`,
  };
}

const TOOL_HANDLERS = {
  get_campaigns: handleGetCampaigns,
  get_campaign_insights: handleGetCampaignInsights,
  get_ad_spend: handleGetAdSpend,
  get_audiences: handleGetAudiences,
  get_ad_creatives: handleGetAdCreatives,
  calculate_roas: handleCalculateRoas,
};

// ============================================
// JSON-RPC 2.0 OVER STDIO
// ============================================

function sendResponse(id, result) {
  const response = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(response + '\n');
}

function sendError(id, code, message, data) {
  const response = JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data ? { data } : {}) },
  });
  process.stdout.write(response + '\n');
}

async function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return sendResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      });

    case 'notifications/initialized':
      return;

    case 'tools/list':
      return sendResponse(id, { tools: TOOLS });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        return sendResponse(id, {
          content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
          isError: true,
        });
      }

      try {
        const result = await handler(toolArgs);
        return sendResponse(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        });
      } catch (error) {
        return sendResponse(id, {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        });
      }
    }

    case 'ping':
      return sendResponse(id, {});

    default:
      if (id !== undefined) {
        return sendError(id, -32601, `Method not found: ${method}`);
      }
  }
}

// ============================================
// STDIO TRANSPORT
// ============================================

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (line.length === 0) continue;

    try {
      const request = JSON.parse(line);
      handleRequest(request).catch((err) => {
        if (request.id !== undefined) {
          sendError(request.id, -32603, `Internal error: ${err.message}`);
        }
        process.stderr.write(`[${SERVER_NAME}] Error handling request: ${err.message}\n`);
      });
    } catch (parseError) {
      process.stderr.write(`[${SERVER_NAME}] JSON parse error: ${parseError.message}\n`);
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

process.stderr.write(`[${SERVER_NAME}] MCP server started (stdio, JSON-RPC 2.0)\n`);
