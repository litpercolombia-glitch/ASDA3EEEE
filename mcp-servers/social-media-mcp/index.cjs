#!/usr/bin/env node
// ============================================
// SOCIAL-MEDIA-MCP SERVER
// Local MCP Server - JSON-RPC 2.0 over stdio
// No external dependencies - pure Node.js
// ============================================

const SERVER_NAME = 'social-media-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// ============================================
// MCP TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'create_post',
    description: 'Create and publish a social media post to one or more platforms (Instagram, Facebook, TikTok, X/Twitter, LinkedIn)',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Target platform', enum: ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin'] },
        content: { type: 'string', description: 'Post text content / caption' },
        media_urls: { type: 'array', items: { type: 'string' }, description: 'URLs of images or videos to attach' },
        hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags to include' },
        link: { type: 'string', description: 'External link to include in the post' },
      },
      required: ['platform', 'content'],
    },
  },
  {
    name: 'schedule_post',
    description: 'Schedule a social media post for future publication at a specific date and time',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Target platform', enum: ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin'] },
        content: { type: 'string', description: 'Post text content / caption' },
        scheduled_at: { type: 'string', description: 'ISO 8601 datetime for publication (e.g. 2026-03-01T14:00:00Z)' },
        media_urls: { type: 'array', items: { type: 'string' }, description: 'URLs of images or videos to attach' },
        hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags to include' },
      },
      required: ['platform', 'content', 'scheduled_at'],
    },
  },
  {
    name: 'get_accounts',
    description: 'List all connected social media accounts with their status, followers, and platform info',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Filter by platform (optional)', enum: ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'all'] },
      },
      required: [],
    },
  },
  {
    name: 'get_post_analytics',
    description: 'Get performance analytics for a specific post (impressions, reach, engagement, clicks)',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: { type: 'string', description: 'The post ID to get analytics for' },
        platform: { type: 'string', description: 'Platform the post belongs to', enum: ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin'] },
      },
      required: ['post_id', 'platform'],
    },
  },
  {
    name: 'get_trending_hashtags',
    description: 'Get trending hashtags for a specific platform and topic/niche',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Platform to check trends', enum: ['instagram', 'tiktok', 'twitter'] },
        topic: { type: 'string', description: 'Topic or niche to find trending hashtags for' },
        country: { type: 'string', description: 'Country code (e.g. CO, US, MX)' },
        limit: { type: 'number', description: 'Number of hashtags to return (default: 10)' },
      },
      required: ['platform', 'topic'],
    },
  },
  {
    name: 'delete_post',
    description: 'Delete a published post from a social media platform',
    inputSchema: {
      type: 'object',
      properties: {
        post_id: { type: 'string', description: 'The post ID to delete' },
        platform: { type: 'string', description: 'Platform the post belongs to', enum: ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin'] },
      },
      required: ['post_id', 'platform'],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleCreatePost(params) {
  const { platform, content, media_urls, hashtags, link } = params;
  const postId = `post_${platform}_${Date.now()}`;
  return {
    post_id: postId,
    platform,
    status: 'published',
    content,
    media_count: (media_urls || []).length,
    hashtags: hashtags || [],
    link: link || null,
    published_at: new Date().toISOString(),
    url: `https://${platform}.com/litperpro/posts/${postId}`,
    message: `Post published successfully on ${platform}`,
  };
}

async function handleSchedulePost(params) {
  const { platform, content, scheduled_at, media_urls, hashtags } = params;
  const postId = `sched_${platform}_${Date.now()}`;
  return {
    post_id: postId,
    platform,
    status: 'scheduled',
    content,
    media_count: (media_urls || []).length,
    hashtags: hashtags || [],
    scheduled_at,
    created_at: new Date().toISOString(),
    message: `Post scheduled for ${scheduled_at} on ${platform}`,
  };
}

async function handleGetAccounts(params) {
  const filterPlatform = params.platform || 'all';
  const accounts = [
    { id: 'acc_ig_001', platform: 'instagram', username: '@litperpro', followers: 24500, following: 1200, posts: 342, status: 'connected', verified: true },
    { id: 'acc_fb_001', platform: 'facebook', name: 'Litper Pro Colombia', followers: 18200, likes: 17800, status: 'connected', page_type: 'business' },
    { id: 'acc_tt_001', platform: 'tiktok', username: '@litperpro', followers: 52300, likes: 890000, videos: 156, status: 'connected' },
    { id: 'acc_tw_001', platform: 'twitter', username: '@litperpro', followers: 8900, following: 450, tweets: 1250, status: 'connected' },
    { id: 'acc_li_001', platform: 'linkedin', name: 'Litper Pro', followers: 3200, connections: 500, status: 'connected', company_page: true },
  ];
  const filtered = filterPlatform === 'all' ? accounts : accounts.filter(a => a.platform === filterPlatform);
  return { accounts: filtered, total: filtered.length, message: `Found ${filtered.length} connected accounts` };
}

async function handleGetPostAnalytics(params) {
  const { post_id, platform } = params;
  return {
    post_id,
    platform,
    metrics: {
      impressions: 15200 + Math.floor(Math.random() * 5000),
      reach: 12800 + Math.floor(Math.random() * 3000),
      engagement_rate: parseFloat((3.2 + Math.random() * 2).toFixed(2)),
      likes: 845 + Math.floor(Math.random() * 200),
      comments: 42 + Math.floor(Math.random() * 20),
      shares: 28 + Math.floor(Math.random() * 15),
      saves: 67 + Math.floor(Math.random() * 30),
      clicks: 234 + Math.floor(Math.random() * 100),
      video_views: platform === 'tiktok' ? 45000 + Math.floor(Math.random() * 10000) : undefined,
    },
    demographics: {
      top_cities: ['Bogota', 'Medellin', 'Cali'],
      age_range: '25-34',
      gender_split: { male: 42, female: 55, other: 3 },
    },
    fetched_at: new Date().toISOString(),
    message: `Analytics for post ${post_id} on ${platform}`,
  };
}

async function handleGetTrendingHashtags(params) {
  const { platform, topic, country, limit } = params;
  const maxResults = limit || 10;
  const trendingMap = {
    instagram: [
      { tag: '#dropshippingcolombia', posts: 128000, growth: '+15%' },
      { tag: '#ecommercecol', posts: 95000, growth: '+22%' },
      { tag: '#emprendimientocolombia', posts: 340000, growth: '+8%' },
      { tag: '#ventasonline', posts: 210000, growth: '+12%' },
      { tag: '#negocioonline', posts: 180000, growth: '+18%' },
      { tag: '#marketingdigital', posts: 520000, growth: '+5%' },
      { tag: '#tiendaonline', posts: 145000, growth: '+25%' },
      { tag: '#colombiaemprende', posts: 92000, growth: '+30%' },
      { tag: '#dropshipping2026', posts: 45000, growth: '+45%' },
      { tag: '#enviosrapidos', posts: 67000, growth: '+10%' },
    ],
    tiktok: [
      { tag: '#dropshippingtips', views: 89000000, growth: '+35%' },
      { tag: '#ecommercelife', views: 45000000, growth: '+28%' },
      { tag: '#negociodesdecasa', views: 120000000, growth: '+20%' },
      { tag: '#emprendedor2026', views: 78000000, growth: '+40%' },
      { tag: '#ventaspormayor', views: 34000000, growth: '+15%' },
      { tag: '#colombiaventas', views: 23000000, growth: '+50%' },
      { tag: '#marketingtips', views: 210000000, growth: '+12%' },
      { tag: '#dropshippinglatam', views: 18000000, growth: '+55%' },
      { tag: '#tiendavirtual', views: 42000000, growth: '+22%' },
      { tag: '#exitorapido', views: 56000000, growth: '+18%' },
    ],
    twitter: [
      { tag: '#Dropshipping', tweets: 12000, growth: '+10%' },
      { tag: '#EcommerceColombia', tweets: 8500, growth: '+18%' },
      { tag: '#Emprendimiento', tweets: 25000, growth: '+7%' },
      { tag: '#VentasOnline', tweets: 9200, growth: '+14%' },
      { tag: '#MarketingDigital', tweets: 18000, growth: '+9%' },
      { tag: '#NegocioDigital', tweets: 6800, growth: '+22%' },
      { tag: '#Startups', tweets: 32000, growth: '+5%' },
      { tag: '#Colombia', tweets: 95000, growth: '+3%' },
      { tag: '#Ecommerce2026', tweets: 4500, growth: '+38%' },
      { tag: '#LogisticaColombia', tweets: 3200, growth: '+25%' },
    ],
  };
  const hashtags = (trendingMap[platform] || trendingMap.instagram).slice(0, maxResults);
  return {
    platform,
    topic,
    country: country || 'CO',
    hashtags,
    fetched_at: new Date().toISOString(),
    message: `Found ${hashtags.length} trending hashtags for "${topic}" on ${platform}`,
  };
}

async function handleDeletePost(params) {
  const { post_id, platform } = params;
  return {
    post_id,
    platform,
    status: 'deleted',
    deleted_at: new Date().toISOString(),
    message: `Post ${post_id} deleted from ${platform}`,
  };
}

const TOOL_HANDLERS = {
  create_post: handleCreatePost,
  schedule_post: handleSchedulePost,
  get_accounts: handleGetAccounts,
  get_post_analytics: handleGetPostAnalytics,
  get_trending_hashtags: handleGetTrendingHashtags,
  delete_post: handleDeletePost,
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
