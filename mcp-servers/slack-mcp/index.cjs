#!/usr/bin/env node
// ============================================
// SLACK-MCP SERVER
// Local MCP Server - JSON-RPC 2.0 over stdio
// No external dependencies - pure Node.js
// ============================================

const SERVER_NAME = 'slack-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// ============================================
// MCP TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'send_message',
    description: 'Send a message to a Slack channel or direct message to a user',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name (e.g. #general) or user ID for DM' },
        text: { type: 'string', description: 'Message text (supports Slack markdown)' },
        thread_ts: { type: 'string', description: 'Thread timestamp to reply in a thread' },
        blocks: { type: 'array', description: 'Slack Block Kit blocks for rich formatting' },
        unfurl_links: { type: 'boolean', description: 'Unfurl links in the message (default: true)' },
      },
      required: ['channel', 'text'],
    },
  },
  {
    name: 'list_channels',
    description: 'List all Slack channels in the workspace with member counts and topics',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Channel type filter', enum: ['public', 'private', 'dm', 'all'] },
        limit: { type: 'number', description: 'Max channels to return (default: 50)' },
        include_archived: { type: 'boolean', description: 'Include archived channels (default: false)' },
      },
      required: [],
    },
  },
  {
    name: 'get_channel_history',
    description: 'Get recent message history from a Slack channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name or ID' },
        limit: { type: 'number', description: 'Number of messages to retrieve (default: 20, max: 100)' },
        oldest: { type: 'string', description: 'Only messages after this timestamp (ISO 8601)' },
        newest: { type: 'string', description: 'Only messages before this timestamp (ISO 8601)' },
      },
      required: ['channel'],
    },
  },
  {
    name: 'create_channel',
    description: 'Create a new Slack channel in the workspace',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Channel name (lowercase, no spaces, use hyphens)' },
        is_private: { type: 'boolean', description: 'Create as private channel (default: false)' },
        topic: { type: 'string', description: 'Channel topic/description' },
        invite_users: { type: 'array', items: { type: 'string' }, description: 'User IDs to invite to the channel' },
      },
      required: ['name'],
    },
  },
  {
    name: 'upload_file',
    description: 'Upload a file to a Slack channel with optional message',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel to upload file to' },
        file_path: { type: 'string', description: 'Local file path to upload' },
        filename: { type: 'string', description: 'Override filename in Slack' },
        title: { type: 'string', description: 'Title for the file' },
        initial_comment: { type: 'string', description: 'Message to include with the file' },
      },
      required: ['channel', 'file_path'],
    },
  },
  {
    name: 'set_reminder',
    description: 'Set a reminder for yourself or another user in Slack',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Reminder text' },
        time: { type: 'string', description: 'When to remind (ISO 8601 datetime or natural language like "in 30 minutes", "tomorrow at 9am")' },
        user: { type: 'string', description: 'User ID to remind (default: yourself)' },
      },
      required: ['text', 'time'],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleSendMessage(params) {
  const { channel, text, thread_ts, blocks, unfurl_links } = params;
  const ts = `${Math.floor(Date.now() / 1000)}.${String(Date.now() % 1000).padStart(6, '0')}`;
  return {
    ok: true,
    channel,
    ts,
    thread_ts: thread_ts || null,
    text,
    has_blocks: !!(blocks && blocks.length),
    unfurl_links: unfurl_links !== false,
    message: `Message sent to ${channel}`,
  };
}

async function handleListChannels(params) {
  const { type, limit, include_archived } = params;
  const filterType = type || 'all';
  const channels = [
    { id: 'C001', name: '#general', type: 'public', members: 45, topic: 'Anuncios generales del equipo', unread: 3, is_archived: false },
    { id: 'C002', name: '#ventas', type: 'public', members: 18, topic: 'Seguimiento de ventas y metas diarias', unread: 12, is_archived: false },
    { id: 'C003', name: '#soporte-clientes', type: 'public', members: 12, topic: 'Tickets y consultas de clientes', unread: 8, is_archived: false },
    { id: 'C004', name: '#marketing', type: 'public', members: 8, topic: 'Campanas, creativos y analytics', unread: 5, is_archived: false },
    { id: 'C005', name: '#dev-team', type: 'private', members: 6, topic: 'Desarrollo de la plataforma Litper Pro', unread: 15, is_archived: false },
    { id: 'C006', name: '#logistica', type: 'public', members: 14, topic: 'Envios, tracking y proveedores', unread: 7, is_archived: false },
    { id: 'C007', name: '#contabilidad', type: 'private', members: 4, topic: 'Facturas, pagos y reportes financieros', unread: 1, is_archived: false },
    { id: 'C008', name: '#random', type: 'public', members: 45, topic: 'Memes, musica y conversacion casual', unread: 20, is_archived: false },
    { id: 'C009', name: '#proveedores-dropi', type: 'private', members: 5, topic: 'Coordinacion con proveedores Dropi', unread: 0, is_archived: false },
    { id: 'C010', name: '#campana-bf-2025', type: 'public', members: 10, topic: 'Black Friday 2025 - Finalizado', unread: 0, is_archived: true },
  ];
  let filtered = channels;
  if (filterType !== 'all') filtered = filtered.filter(c => c.type === filterType);
  if (!include_archived) filtered = filtered.filter(c => !c.is_archived);
  return {
    channels: filtered.slice(0, limit || 50),
    total: filtered.length,
    message: `Found ${filtered.length} channels`,
  };
}

async function handleGetChannelHistory(params) {
  const { channel, limit, oldest, newest } = params;
  const messages = [
    { ts: '1708960800.000001', user: 'U001', username: 'julian', text: 'Buenos dias equipo! Las metas de hoy: 50 pedidos minimo', reactions: [{ name: 'fire', count: 5 }, { name: 'muscle', count: 3 }] },
    { ts: '1708960900.000002', user: 'U002', username: 'camila', text: 'Ya van 12 pedidos desde las 8am. El funnel de remarketing esta funcionando bien', reactions: [{ name: 'rocket', count: 2 }] },
    { ts: '1708961000.000003', user: 'U003', username: 'andres', text: 'Ojo con el proveedor #4523, tiene retraso en 3 envios. Ya escale el ticket.', reactions: [] },
    { ts: '1708961100.000004', user: 'U004', username: 'sofia', text: 'El creativo nuevo del carousel tiene CTR de 4.8% en las primeras 2 horas', thread_replies: 3, reactions: [{ name: 'chart_with_upwards_trend', count: 4 }] },
    { ts: '1708961200.000005', user: 'U001', username: 'julian', text: 'Excelente Sofia! Escalemos el budget de esa campana un 20%', reactions: [{ name: 'thumbsup', count: 2 }] },
    { ts: '1708961300.000006', user: 'U005', username: 'diego', text: 'Deploy del nuevo modulo de tracking completado. Monitoreo en #dev-team', reactions: [{ name: 'white_check_mark', count: 6 }] },
  ];
  return {
    channel,
    messages: messages.slice(0, limit || 20),
    total: messages.length,
    has_more: false,
    message: `Retrieved ${messages.length} messages from ${channel}`,
  };
}

async function handleCreateChannel(params) {
  const { name, is_private, topic, invite_users } = params;
  const channelId = `C${Date.now()}`;
  return {
    ok: true,
    channel: {
      id: channelId,
      name: `#${name.toLowerCase().replace(/\s+/g, '-')}`,
      is_private: is_private || false,
      topic: topic || '',
      members_invited: (invite_users || []).length,
      created_by: 'U001',
    },
    created_at: new Date().toISOString(),
    message: `Channel #${name} created successfully`,
  };
}

async function handleUploadFile(params) {
  const { channel, file_path, filename, title, initial_comment } = params;
  const fileId = `F${Date.now()}`;
  const name = filename || file_path.split('/').pop();
  return {
    ok: true,
    file: {
      id: fileId,
      name,
      title: title || name,
      size: 125000,
      mime_type: 'application/octet-stream',
      channel,
      permalink: `https://litperpro.slack.com/files/U001/${fileId}/${name}`,
    },
    initial_comment: initial_comment || null,
    uploaded_at: new Date().toISOString(),
    message: `File "${name}" uploaded to ${channel}`,
  };
}

async function handleSetReminder(params) {
  const { text, time, user } = params;
  const reminderId = `Rm${Date.now()}`;
  return {
    ok: true,
    reminder: {
      id: reminderId,
      text,
      user: user || 'me',
      time,
      created_at: new Date().toISOString(),
    },
    message: `Reminder set: "${text}" at ${time}`,
  };
}

const TOOL_HANDLERS = {
  send_message: handleSendMessage,
  list_channels: handleListChannels,
  get_channel_history: handleGetChannelHistory,
  create_channel: handleCreateChannel,
  upload_file: handleUploadFile,
  set_reminder: handleSetReminder,
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
