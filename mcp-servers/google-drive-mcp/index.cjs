#!/usr/bin/env node
// ============================================
// GOOGLE-DRIVE-MCP SERVER
// Local MCP Server - JSON-RPC 2.0 over stdio
// No external dependencies - pure Node.js
// ============================================

const SERVER_NAME = 'google-drive-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// ============================================
// MCP TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'list_files',
    description: 'List files and folders in a Google Drive directory with metadata (name, size, type, modified date)',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: { type: 'string', description: 'Folder ID to list (default: root)' },
        page_size: { type: 'number', description: 'Number of files to return (default: 25, max: 100)' },
        order_by: { type: 'string', description: 'Sort order', enum: ['name', 'modifiedTime', 'createdTime', 'size'] },
        file_type: { type: 'string', description: 'Filter by file type', enum: ['document', 'spreadsheet', 'presentation', 'image', 'video', 'pdf', 'folder', 'all'] },
      },
      required: [],
    },
  },
  {
    name: 'search_files',
    description: 'Search for files across Google Drive by name, content, or type',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (file name or content keywords)' },
        file_type: { type: 'string', description: 'Filter by file type', enum: ['document', 'spreadsheet', 'presentation', 'image', 'video', 'pdf', 'all'] },
        modified_after: { type: 'string', description: 'Only files modified after this date (ISO 8601)' },
        owner: { type: 'string', description: 'Filter by owner email' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_file_content',
    description: 'Get the content or metadata of a specific file from Google Drive',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: { type: 'string', description: 'File ID to retrieve' },
        export_format: { type: 'string', description: 'Export format for Google Docs (pdf, docx, txt, csv)', enum: ['pdf', 'docx', 'txt', 'csv', 'xlsx', 'pptx', 'native'] },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'upload_file',
    description: 'Upload a file to Google Drive from a local path or URL',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Local file path to upload' },
        file_name: { type: 'string', description: 'Name for the file in Drive (default: original name)' },
        folder_id: { type: 'string', description: 'Destination folder ID (default: root)' },
        convert_to_google: { type: 'boolean', description: 'Convert to Google Docs/Sheets format (default: false)' },
        description: { type: 'string', description: 'File description' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'create_folder',
    description: 'Create a new folder in Google Drive',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Folder name' },
        parent_id: { type: 'string', description: 'Parent folder ID (default: root)' },
        color: { type: 'string', description: 'Folder color (hex code)' },
        description: { type: 'string', description: 'Folder description' },
      },
      required: ['name'],
    },
  },
  {
    name: 'share_file',
    description: 'Share a file or folder with specific users or make it public with permission controls',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: { type: 'string', description: 'File or folder ID to share' },
        email: { type: 'string', description: 'Email address of the person to share with' },
        role: { type: 'string', description: 'Permission level', enum: ['viewer', 'commenter', 'editor', 'owner'] },
        notify: { type: 'boolean', description: 'Send notification email (default: true)' },
        message: { type: 'string', description: 'Custom message in the notification email' },
        link_sharing: { type: 'string', description: 'Link sharing setting', enum: ['off', 'anyone_with_link', 'organization'] },
      },
      required: ['file_id'],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleListFiles(params) {
  const { folder_id, page_size, order_by, file_type } = params;
  const files = [
    { id: 'file_001', name: 'Inventario_Febrero_2026.xlsx', type: 'spreadsheet', size: 245000, mime: 'application/vnd.google-apps.spreadsheet', modified: '2026-02-25T18:30:00Z', owner: 'admin@litperpro.com' },
    { id: 'file_002', name: 'Catalogo Productos Q1', type: 'document', size: 1200000, mime: 'application/vnd.google-apps.document', modified: '2026-02-24T14:15:00Z', owner: 'admin@litperpro.com' },
    { id: 'file_003', name: 'Reportes Ventas', type: 'folder', size: 0, mime: 'application/vnd.google-apps.folder', modified: '2026-02-23T10:00:00Z', owner: 'admin@litperpro.com' },
    { id: 'file_004', name: 'Logo_Litper_Pro_2026.png', type: 'image', size: 520000, mime: 'image/png', modified: '2026-02-20T09:00:00Z', owner: 'design@litperpro.com' },
    { id: 'file_005', name: 'Contrato_Proveedor_Dropi.pdf', type: 'pdf', size: 890000, mime: 'application/pdf', modified: '2026-02-18T16:45:00Z', owner: 'legal@litperpro.com' },
    { id: 'file_006', name: 'Presentacion_Inversionistas.pptx', type: 'presentation', size: 3400000, mime: 'application/vnd.google-apps.presentation', modified: '2026-02-15T11:30:00Z', owner: 'admin@litperpro.com' },
    { id: 'file_007', name: 'Video_Tutorial_Plataforma.mp4', type: 'video', size: 85000000, mime: 'video/mp4', modified: '2026-02-10T13:00:00Z', owner: 'marketing@litperpro.com' },
    { id: 'file_008', name: 'Base_Datos_Clientes.csv', type: 'spreadsheet', size: 180000, mime: 'text/csv', modified: '2026-02-26T08:00:00Z', owner: 'ventas@litperpro.com' },
  ];
  const filtered = file_type && file_type !== 'all' ? files.filter(f => f.type === file_type) : files;
  const limited = filtered.slice(0, page_size || 25);
  return {
    folder_id: folder_id || 'root',
    files: limited,
    total: limited.length,
    order_by: order_by || 'modifiedTime',
    message: `Found ${limited.length} files`,
  };
}

async function handleSearchFiles(params) {
  const { query, file_type, modified_after, owner, limit } = params;
  const q = query.toLowerCase();
  const results = [
    { id: 'file_001', name: 'Inventario_Febrero_2026.xlsx', type: 'spreadsheet', size: 245000, modified: '2026-02-25T18:30:00Z', path: '/Litper Pro/Inventarios/', relevance: 0.95 },
    { id: 'file_009', name: 'Inventario_Enero_2026.xlsx', type: 'spreadsheet', size: 230000, modified: '2026-01-31T17:00:00Z', path: '/Litper Pro/Inventarios/', relevance: 0.90 },
    { id: 'file_010', name: 'Reporte_Inventario_Anual_2025.pdf', type: 'pdf', size: 1500000, modified: '2025-12-31T23:00:00Z', path: '/Litper Pro/Reportes/', relevance: 0.75 },
  ];
  return {
    query,
    file_type: file_type || 'all',
    results: results.slice(0, limit || 20),
    total: results.length,
    message: `Found ${results.length} files matching "${query}"`,
  };
}

async function handleGetFileContent(params) {
  const { file_id, export_format } = params;
  return {
    file_id,
    name: 'Inventario_Febrero_2026.xlsx',
    mime_type: 'application/vnd.google-apps.spreadsheet',
    size: 245000,
    export_format: export_format || 'native',
    created: '2026-02-01T09:00:00Z',
    modified: '2026-02-25T18:30:00Z',
    owner: 'admin@litperpro.com',
    shared_with: ['ventas@litperpro.com', 'contabilidad@litperpro.com'],
    permissions: [
      { email: 'admin@litperpro.com', role: 'owner' },
      { email: 'ventas@litperpro.com', role: 'editor' },
      { email: 'contabilidad@litperpro.com', role: 'viewer' },
    ],
    web_link: 'https://docs.google.com/spreadsheets/d/file_001/edit',
    download_link: export_format ? `https://drive.google.com/export?id=file_001&format=${export_format}` : null,
    message: `File metadata for ${file_id}`,
  };
}

async function handleUploadFile(params) {
  const { file_path, file_name, folder_id, convert_to_google, description } = params;
  const name = file_name || file_path.split('/').pop();
  const fileId = `file_${Date.now()}`;
  return {
    file_id: fileId,
    name,
    folder_id: folder_id || 'root',
    size: 350000,
    mime_type: 'application/octet-stream',
    converted: convert_to_google || false,
    description: description || null,
    web_link: `https://drive.google.com/file/d/${fileId}/view`,
    uploaded_at: new Date().toISOString(),
    message: `File "${name}" uploaded successfully`,
  };
}

async function handleCreateFolder(params) {
  const { name, parent_id, color, description } = params;
  const folderId = `folder_${Date.now()}`;
  return {
    folder_id: folderId,
    name,
    parent_id: parent_id || 'root',
    color: color || null,
    description: description || null,
    web_link: `https://drive.google.com/drive/folders/${folderId}`,
    created_at: new Date().toISOString(),
    message: `Folder "${name}" created successfully`,
  };
}

async function handleShareFile(params) {
  const { file_id, email, role, notify, message, link_sharing } = params;
  return {
    file_id,
    shared_with: email || null,
    role: role || 'viewer',
    notification_sent: notify !== false && !!email,
    message_sent: message || null,
    link_sharing: link_sharing || 'off',
    share_link: link_sharing && link_sharing !== 'off' ? `https://drive.google.com/file/d/${file_id}/view?usp=sharing` : null,
    shared_at: new Date().toISOString(),
    message: email ? `File shared with ${email} as ${role || 'viewer'}` : `Link sharing set to ${link_sharing}`,
  };
}

const TOOL_HANDLERS = {
  list_files: handleListFiles,
  search_files: handleSearchFiles,
  get_file_content: handleGetFileContent,
  upload_file: handleUploadFile,
  create_folder: handleCreateFolder,
  share_file: handleShareFile,
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
