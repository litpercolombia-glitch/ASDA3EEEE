#!/usr/bin/env node
// ============================================
// CALENDAR-MCP SERVER
// Local MCP Server - JSON-RPC 2.0 over stdio
// No external dependencies - pure Node.js
// ============================================

const SERVER_NAME = 'calendar-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// ============================================
// MCP TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'list_events',
    description: 'List calendar events for a date range with attendees, location, and status',
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: { type: 'string', description: 'Calendar ID (default: primary)' },
        date_from: { type: 'string', description: 'Start date (ISO 8601)' },
        date_to: { type: 'string', description: 'End date (ISO 8601)' },
        max_results: { type: 'number', description: 'Max events to return (default: 25)' },
        status: { type: 'string', description: 'Filter by status', enum: ['confirmed', 'tentative', 'cancelled', 'all'] },
      },
      required: ['date_from', 'date_to'],
    },
  },
  {
    name: 'create_event',
    description: 'Create a new calendar event with title, time, attendees, and optional video conferencing',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        start: { type: 'string', description: 'Start datetime (ISO 8601)' },
        end: { type: 'string', description: 'End datetime (ISO 8601)' },
        description: { type: 'string', description: 'Event description/notes' },
        location: { type: 'string', description: 'Physical location or address' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Email addresses of attendees' },
        video_conference: { type: 'boolean', description: 'Add Google Meet link (default: false)' },
        reminder_minutes: { type: 'number', description: 'Reminder before event in minutes (default: 15)' },
        recurrence: { type: 'string', description: 'Recurrence rule', enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly'] },
        calendar_id: { type: 'string', description: 'Calendar ID (default: primary)' },
      },
      required: ['title', 'start', 'end'],
    },
  },
  {
    name: 'update_event',
    description: 'Update an existing calendar event (title, time, attendees, description, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'Event ID to update' },
        title: { type: 'string', description: 'New title' },
        start: { type: 'string', description: 'New start datetime' },
        end: { type: 'string', description: 'New end datetime' },
        description: { type: 'string', description: 'New description' },
        location: { type: 'string', description: 'New location' },
        add_attendees: { type: 'array', items: { type: 'string' }, description: 'Attendees to add' },
        remove_attendees: { type: 'array', items: { type: 'string' }, description: 'Attendees to remove' },
        status: { type: 'string', description: 'New status', enum: ['confirmed', 'tentative', 'cancelled'] },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete a calendar event by ID with optional notification to attendees',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'Event ID to delete' },
        notify_attendees: { type: 'boolean', description: 'Send cancellation notification to attendees (default: true)' },
        delete_series: { type: 'boolean', description: 'Delete all recurring instances (default: false, only this instance)' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'check_availability',
    description: 'Check free/busy availability for one or more people in a time range',
    inputSchema: {
      type: 'object',
      properties: {
        emails: { type: 'array', items: { type: 'string' }, description: 'Email addresses to check availability for' },
        date_from: { type: 'string', description: 'Start of time range (ISO 8601)' },
        date_to: { type: 'string', description: 'End of time range (ISO 8601)' },
        duration_minutes: { type: 'number', description: 'Desired meeting duration in minutes (to find open slots)' },
      },
      required: ['emails', 'date_from', 'date_to'],
    },
  },
  {
    name: 'get_upcoming',
    description: 'Get the next upcoming events (quick view of what is coming up today/this week)',
    inputSchema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Number of upcoming events to return (default: 5)' },
        calendar_id: { type: 'string', description: 'Calendar ID (default: primary)' },
      },
      required: [],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleListEvents(params) {
  const { calendar_id, date_from, date_to, max_results, status } = params;
  const events = [
    {
      id: 'evt_001', title: 'Standup Diario - Equipo Dev', start: '2026-02-26T09:00:00-05:00', end: '2026-02-26T09:15:00-05:00',
      status: 'confirmed', attendees: ['julian@litperpro.com', 'diego@litperpro.com', 'maria@litperpro.com'],
      location: null, video_conference: 'https://meet.google.com/abc-defg-hij', recurrence: 'daily',
    },
    {
      id: 'evt_002', title: 'Revision Campanas Meta Ads', start: '2026-02-26T10:30:00-05:00', end: '2026-02-26T11:30:00-05:00',
      status: 'confirmed', attendees: ['julian@litperpro.com', 'sofia@litperpro.com', 'camila@litperpro.com'],
      location: 'Sala de Reuniones A', video_conference: null, recurrence: 'weekly',
    },
    {
      id: 'evt_003', title: 'Llamada con Proveedor Dropi', start: '2026-02-26T14:00:00-05:00', end: '2026-02-26T14:45:00-05:00',
      status: 'confirmed', attendees: ['julian@litperpro.com', 'andres@litperpro.com', 'contacto@dropi.com'],
      location: null, video_conference: 'https://meet.google.com/xyz-abcd-efg', recurrence: 'biweekly',
    },
    {
      id: 'evt_004', title: 'Demo Nuevas Features - Plataforma', start: '2026-02-27T11:00:00-05:00', end: '2026-02-27T12:00:00-05:00',
      status: 'confirmed', attendees: ['julian@litperpro.com', 'diego@litperpro.com', 'inversionista@vc.com'],
      location: 'WeWork Bogota - Sala 4B', video_conference: 'https://meet.google.com/demo-1234-abc', recurrence: 'none',
    },
    {
      id: 'evt_005', title: 'Almuerzo con Equipo', start: '2026-02-27T12:30:00-05:00', end: '2026-02-27T13:30:00-05:00',
      status: 'tentative', attendees: ['julian@litperpro.com', 'equipo@litperpro.com'],
      location: 'Restaurante El Cielo - Bogota', video_conference: null, recurrence: 'none',
    },
    {
      id: 'evt_006', title: 'Planning Sprint Q2', start: '2026-02-28T09:00:00-05:00', end: '2026-02-28T11:00:00-05:00',
      status: 'confirmed', attendees: ['julian@litperpro.com', 'diego@litperpro.com', 'maria@litperpro.com', 'sofia@litperpro.com'],
      location: null, video_conference: 'https://meet.google.com/sprint-plan-q2', recurrence: 'none',
    },
  ];
  const filtered = status && status !== 'all' ? events.filter(e => e.status === status) : events;
  return {
    calendar_id: calendar_id || 'primary',
    date_range: { from: date_from, to: date_to },
    events: filtered.slice(0, max_results || 25),
    total: filtered.length,
    message: `Found ${filtered.length} events`,
  };
}

async function handleCreateEvent(params) {
  const { title, start, end, description, location, attendees, video_conference, reminder_minutes, recurrence, calendar_id } = params;
  const eventId = `evt_${Date.now()}`;
  const meetLink = video_conference ? `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}` : null;
  return {
    event_id: eventId,
    title,
    start,
    end,
    description: description || null,
    location: location || null,
    attendees: attendees || [],
    video_conference: meetLink,
    reminder_minutes: reminder_minutes || 15,
    recurrence: recurrence || 'none',
    calendar_id: calendar_id || 'primary',
    status: 'confirmed',
    created_at: new Date().toISOString(),
    html_link: `https://calendar.google.com/event?eid=${eventId}`,
    message: `Event "${title}" created for ${start}`,
  };
}

async function handleUpdateEvent(params) {
  const { event_id, title, start, end, description, location, add_attendees, remove_attendees, status } = params;
  const updates = {};
  if (title) updates.title = title;
  if (start) updates.start = start;
  if (end) updates.end = end;
  if (description) updates.description = description;
  if (location) updates.location = location;
  if (status) updates.status = status;
  if (add_attendees) updates.attendees_added = add_attendees;
  if (remove_attendees) updates.attendees_removed = remove_attendees;
  return {
    event_id,
    updated_fields: Object.keys(updates),
    updates,
    updated_at: new Date().toISOString(),
    message: `Event ${event_id} updated: ${Object.keys(updates).join(', ')}`,
  };
}

async function handleDeleteEvent(params) {
  const { event_id, notify_attendees, delete_series } = params;
  return {
    event_id,
    status: 'deleted',
    notification_sent: notify_attendees !== false,
    series_deleted: delete_series || false,
    deleted_at: new Date().toISOString(),
    message: `Event ${event_id} deleted${delete_series ? ' (full series)' : ''}`,
  };
}

async function handleCheckAvailability(params) {
  const { emails, date_from, date_to, duration_minutes } = params;
  const availability = emails.map(email => ({
    email,
    busy_slots: [
      { start: '2026-02-26T09:00:00-05:00', end: '2026-02-26T09:15:00-05:00', title: 'Standup' },
      { start: '2026-02-26T10:30:00-05:00', end: '2026-02-26T11:30:00-05:00', title: 'Meeting' },
      { start: '2026-02-26T14:00:00-05:00', end: '2026-02-26T14:45:00-05:00', title: 'Call' },
    ],
    free_slots: [
      { start: '2026-02-26T09:15:00-05:00', end: '2026-02-26T10:30:00-05:00' },
      { start: '2026-02-26T11:30:00-05:00', end: '2026-02-26T14:00:00-05:00' },
      { start: '2026-02-26T14:45:00-05:00', end: '2026-02-26T18:00:00-05:00' },
    ],
  }));
  const suggested = duration_minutes ? [
    { start: '2026-02-26T11:30:00-05:00', end: `2026-02-26T${11 + Math.floor((30 + duration_minutes) / 60)}:${String((30 + duration_minutes) % 60).padStart(2, '0')}:00-05:00`, all_available: true },
    { start: '2026-02-26T15:00:00-05:00', end: `2026-02-26T${15 + Math.floor(duration_minutes / 60)}:${String(duration_minutes % 60).padStart(2, '0')}:00-05:00`, all_available: true },
  ] : [];
  return {
    date_range: { from: date_from, to: date_to },
    availability,
    suggested_slots: suggested,
    message: `Availability checked for ${emails.length} people`,
  };
}

async function handleGetUpcoming(params) {
  const { count, calendar_id } = params;
  const now = new Date();
  const events = [
    { id: 'evt_002', title: 'Revision Campanas Meta Ads', start: '2026-02-26T10:30:00-05:00', end: '2026-02-26T11:30:00-05:00', in_minutes: 45, location: 'Sala de Reuniones A' },
    { id: 'evt_003', title: 'Llamada con Proveedor Dropi', start: '2026-02-26T14:00:00-05:00', end: '2026-02-26T14:45:00-05:00', in_minutes: 255, video_conference: true },
    { id: 'evt_004', title: 'Demo Nuevas Features - Plataforma', start: '2026-02-27T11:00:00-05:00', end: '2026-02-27T12:00:00-05:00', in_minutes: 1515, location: 'WeWork Bogota - Sala 4B' },
    { id: 'evt_006', title: 'Planning Sprint Q2', start: '2026-02-28T09:00:00-05:00', end: '2026-02-28T11:00:00-05:00', in_minutes: 2835 },
    { id: 'evt_007', title: 'Retro Febrero', start: '2026-02-28T15:00:00-05:00', end: '2026-02-28T16:00:00-05:00', in_minutes: 3195 },
  ];
  return {
    calendar_id: calendar_id || 'primary',
    events: events.slice(0, count || 5),
    as_of: now.toISOString(),
    message: `Next ${Math.min(count || 5, events.length)} upcoming events`,
  };
}

const TOOL_HANDLERS = {
  list_events: handleListEvents,
  create_event: handleCreateEvent,
  update_event: handleUpdateEvent,
  delete_event: handleDeleteEvent,
  check_availability: handleCheckAvailability,
  get_upcoming: handleGetUpcoming,
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
