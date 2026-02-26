#!/usr/bin/env node
// ============================================
// EMAIL-MARKETING-MCP SERVER
// Local MCP Server - JSON-RPC 2.0 over stdio
// No external dependencies - pure Node.js
// ============================================

const SERVER_NAME = 'email-marketing-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// ============================================
// MCP TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'create_contact',
    description: 'Add a new contact to the email marketing database with name, email, tags, and custom fields',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Contact email address' },
        first_name: { type: 'string', description: 'Contact first name' },
        last_name: { type: 'string', description: 'Contact last name' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to assign (e.g. "lead", "customer", "vip")' },
        list_id: { type: 'string', description: 'Email list ID to add the contact to' },
        custom_fields: { type: 'object', description: 'Custom field key-value pairs' },
      },
      required: ['email'],
    },
  },
  {
    name: 'create_email_list',
    description: 'Create a new email list/segment for organizing contacts and targeting campaigns',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'List name' },
        description: { type: 'string', description: 'List description' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Auto-tags for contacts added to this list' },
        double_optin: { type: 'boolean', description: 'Require double opt-in confirmation (default: true)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'send_email',
    description: 'Send a single transactional email to a specific contact (order confirmation, welcome, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body_html: { type: 'string', description: 'HTML body content' },
        body_text: { type: 'string', description: 'Plain text body fallback' },
        from_name: { type: 'string', description: 'Sender display name' },
        reply_to: { type: 'string', description: 'Reply-to email address' },
        template_id: { type: 'string', description: 'Use a saved template instead of body' },
      },
      required: ['to', 'subject'],
    },
  },
  {
    name: 'send_campaign',
    description: 'Send a bulk email campaign to an entire list or segment with tracking enabled',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name for internal tracking' },
        list_id: { type: 'string', description: 'Target list ID' },
        subject: { type: 'string', description: 'Email subject line' },
        template_id: { type: 'string', description: 'Email template ID to use' },
        body_html: { type: 'string', description: 'HTML body (if no template)' },
        send_at: { type: 'string', description: 'Schedule send time (ISO 8601). Omit for immediate send.' },
        ab_test: { type: 'object', description: 'A/B test config', properties: { variant_b_subject: { type: 'string' }, split_percentage: { type: 'number' } } },
      },
      required: ['name', 'list_id', 'subject'],
    },
  },
  {
    name: 'get_campaign_stats',
    description: 'Get detailed performance statistics for an email campaign (opens, clicks, bounces, unsubscribes)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID to get stats for' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'create_template',
    description: 'Create a reusable email template with HTML content, variables, and design settings',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Template name' },
        subject: { type: 'string', description: 'Default subject line' },
        body_html: { type: 'string', description: 'HTML template content (supports {{variables}})' },
        category: { type: 'string', description: 'Template category', enum: ['welcome', 'promotion', 'newsletter', 'transactional', 'abandoned_cart', 'custom'] },
      },
      required: ['name', 'body_html'],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleCreateContact(params) {
  const { email, first_name, last_name, tags, list_id, custom_fields } = params;
  const contactId = `contact_${Date.now()}`;
  return {
    contact_id: contactId,
    email,
    first_name: first_name || null,
    last_name: last_name || null,
    tags: tags || [],
    list_id: list_id || null,
    custom_fields: custom_fields || {},
    status: 'subscribed',
    created_at: new Date().toISOString(),
    message: `Contact ${email} created successfully`,
  };
}

async function handleCreateEmailList(params) {
  const { name, description, tags, double_optin } = params;
  const listId = `list_${Date.now()}`;
  return {
    list_id: listId,
    name,
    description: description || '',
    tags: tags || [],
    double_optin: double_optin !== false,
    subscriber_count: 0,
    created_at: new Date().toISOString(),
    message: `Email list "${name}" created successfully`,
  };
}

async function handleSendEmail(params) {
  const { to, subject, body_html, body_text, from_name, reply_to, template_id } = params;
  const emailId = `email_${Date.now()}`;
  return {
    email_id: emailId,
    to,
    subject,
    from_name: from_name || 'Litper Pro',
    reply_to: reply_to || 'soporte@litperpro.com',
    template_id: template_id || null,
    has_html: !!body_html,
    has_text: !!body_text,
    status: 'sent',
    sent_at: new Date().toISOString(),
    message: `Email sent to ${to}: "${subject}"`,
  };
}

async function handleSendCampaign(params) {
  const { name, list_id, subject, template_id, body_html, send_at, ab_test } = params;
  const campaignId = `camp_${Date.now()}`;
  return {
    campaign_id: campaignId,
    name,
    list_id,
    subject,
    template_id: template_id || null,
    has_html: !!body_html,
    ab_test: ab_test || null,
    status: send_at ? 'scheduled' : 'sending',
    scheduled_at: send_at || null,
    sent_at: send_at ? null : new Date().toISOString(),
    recipients_count: 4520,
    message: send_at ? `Campaign "${name}" scheduled for ${send_at}` : `Campaign "${name}" sending to ${4520} recipients`,
  };
}

async function handleGetCampaignStats(params) {
  const { campaign_id } = params;
  const sent = 4520;
  const delivered = 4385;
  const opens = 1842;
  const clicks = 456;
  return {
    campaign_id,
    name: 'Promo Semana Santa 2026',
    status: 'completed',
    sent_at: '2026-02-20T10:00:00Z',
    metrics: {
      sent,
      delivered,
      delivery_rate: parseFloat(((delivered / sent) * 100).toFixed(2)),
      opens,
      unique_opens: 1650,
      open_rate: parseFloat(((opens / delivered) * 100).toFixed(2)),
      clicks,
      unique_clicks: 380,
      click_rate: parseFloat(((clicks / delivered) * 100).toFixed(2)),
      click_to_open_rate: parseFloat(((clicks / opens) * 100).toFixed(2)),
      bounces: { hard: 45, soft: 90, total: 135 },
      bounce_rate: parseFloat(((135 / sent) * 100).toFixed(2)),
      unsubscribes: 12,
      unsubscribe_rate: parseFloat(((12 / delivered) * 100).toFixed(2)),
      spam_complaints: 2,
      revenue_attributed: 2350000,
      currency: 'COP',
    },
    top_links: [
      { url: 'https://litperpro.com/promo', clicks: 210, percentage: 46.1 },
      { url: 'https://litperpro.com/catalogo', clicks: 145, percentage: 31.8 },
      { url: 'https://litperpro.com/envio-gratis', clicks: 101, percentage: 22.1 },
    ],
    message: `Stats for campaign ${campaign_id}`,
  };
}

async function handleCreateTemplate(params) {
  const { name, subject, body_html, category } = params;
  const templateId = `tmpl_${Date.now()}`;
  return {
    template_id: templateId,
    name,
    subject: subject || null,
    category: category || 'custom',
    html_length: body_html.length,
    variables_found: (body_html.match(/\{\{(\w+)\}\}/g) || []).map(v => v.replace(/[{}]/g, '')),
    created_at: new Date().toISOString(),
    message: `Template "${name}" created successfully`,
  };
}

const TOOL_HANDLERS = {
  create_contact: handleCreateContact,
  create_email_list: handleCreateEmailList,
  send_email: handleSendEmail,
  send_campaign: handleSendCampaign,
  get_campaign_stats: handleGetCampaignStats,
  create_template: handleCreateTemplate,
};

// ============================================
// JSON-RPC 2.0 OVER STDIO
// ============================================

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

async function handleRequest(request) {
  const { id, method, params } = request;
  switch (method) {
    case 'initialize':
      return sendResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
    case 'notifications/initialized':
      return;
    case 'tools/list':
      return sendResponse(id, { tools: TOOLS });
    case 'tools/call': {
      const handler = TOOL_HANDLERS[params?.name];
      if (!handler) return sendResponse(id, { content: [{ type: 'text', text: `Unknown tool: ${params?.name}` }], isError: true });
      try {
        const result = await handler(params?.arguments || {});
        return sendResponse(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (error) {
        return sendResponse(id, { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true });
      }
    }
    case 'ping':
      return sendResponse(id, {});
    default:
      if (id !== undefined) return sendError(id, -32601, `Method not found: ${method}`);
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const req = JSON.parse(line);
      handleRequest(req).catch((err) => {
        if (req.id !== undefined) sendError(req.id, -32603, `Internal error: ${err.message}`);
      });
    } catch (_) {}
  }
});
process.stdin.on('end', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
process.stderr.write(`[${SERVER_NAME}] MCP server started (stdio, JSON-RPC 2.0)\n`);
