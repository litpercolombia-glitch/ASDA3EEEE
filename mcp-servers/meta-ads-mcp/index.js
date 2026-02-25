#!/usr/bin/env node

// meta-ads-mcp - MCP server for Meta Ads (Facebook & Instagram) integration (Litper Pro)
// Zero dependencies - implements MCP protocol (JSON-RPC 2.0 over stdio) directly

import { createInterface } from "node:readline";

// ============================================
// MCP PROTOCOL LAYER
// ============================================

const SERVER_INFO = {
  name: "meta-ads-mcp",
  version: "1.0.0",
};

const CAPABILITIES = {
  tools: {},
  resources: {},
};

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: "2.0", id, result });
  process.stdout.write(msg + "\n");
}

function sendError(id, code, message) {
  const msg = JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: { code, message },
  });
  process.stdout.write(msg + "\n");
}

function tokenError() {
  return {
    content: [{ type: "text", text: JSON.stringify({
      status: "error",
      message: "META_ADS_ACCESS_TOKEN not configured. Set it in the environment variables or in .mcp.json env.",
    }) }],
    isError: true,
  };
}

async function metaApiFetch(path, accessToken) {
  const url = `https://graph.facebook.com/v21.0/${path}${path.includes("?") ? "&" : "?"}access_token=${accessToken}`;
  const response = await fetch(url);
  return response.json();
}

// ============================================
// TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: "get_ad_accounts",
    description: "List all ad accounts associated with the Meta Business account",
    inputSchema: {
      type: "object",
      properties: {
        businessId: { type: "string", description: "Meta Business ID (uses default if not provided)" },
      },
      required: [],
    },
  },
  {
    name: "get_campaigns",
    description: "Get campaigns for a Meta Ads account with performance metrics",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (format: act_XXXXXXXXX)" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED", "ALL"], default: "ALL", description: "Filter campaigns by status" },
        limit: { type: "number", default: 25, description: "Number of campaigns to return" },
      },
      required: ["adAccountId"],
    },
  },
  {
    name: "get_ad_insights",
    description: "Get performance insights/metrics for campaigns, ad sets, or ads",
    inputSchema: {
      type: "object",
      properties: {
        objectId: { type: "string", description: "ID of the campaign, ad set, or ad account (act_XXX)" },
        datePreset: { type: "string", enum: ["today", "yesterday", "last_7d", "last_14d", "last_30d", "this_month", "last_month", "this_quarter", "maximum"], default: "last_7d", description: "Date range preset" },
        metrics: {
          type: "array", items: { type: "string" },
          default: ["impressions", "clicks", "spend", "cpc", "cpm", "ctr", "conversions", "cost_per_action_type"],
          description: "Metrics to retrieve",
        },
        breakdowns: {
          type: "array", items: { type: "string", enum: ["age", "gender", "country", "platform_position", "publisher_platform"] },
          description: "Breakdown dimensions",
        },
        level: { type: "string", enum: ["account", "campaign", "adset", "ad"], default: "campaign", description: "Aggregation level" },
      },
      required: ["objectId"],
    },
  },
  {
    name: "get_daily_spend",
    description: "Get daily ad spend for a date range, useful for budget tracking and ROAS calculations",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (format: act_XXXXXXXXX)" },
        since: { type: "string", description: "Start date (YYYY-MM-DD)" },
        until: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
      required: ["adAccountId", "since", "until"],
    },
  },
  {
    name: "get_audiences",
    description: "Get custom and lookalike audiences for an ad account",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (format: act_XXXXXXXXX)" },
      },
      required: ["adAccountId"],
    },
  },
  {
    name: "calculate_roas",
    description: "Calculate Return on Ad Spend (ROAS) given revenue and ad spend data",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (format: act_XXXXXXXXX)" },
        since: { type: "string", description: "Start date (YYYY-MM-DD)" },
        until: { type: "string", description: "End date (YYYY-MM-DD)" },
        revenue: { type: "number", description: "Total revenue for the period (in local currency)" },
      },
      required: ["adAccountId", "since", "until", "revenue"],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

const TOOL_HANDLERS = {
  async get_ad_accounts(args) {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) return tokenError();

    try {
      const path = args.businessId
        ? `${args.businessId}/adaccounts?fields=id,name,account_status,currency,balance`
        : `me/adaccounts?fields=id,name,account_status,currency,balance`;
      const data = await metaApiFetch(path, accessToken);
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "success", accounts: data.data || [], paging: data.paging }, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to fetch ad accounts: ${error.message}` }) }],
        isError: true,
      };
    }
  },

  async get_campaigns(args) {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) return tokenError();

    try {
      const { adAccountId, status = "ALL", limit = 25 } = args;
      const fields = "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time";
      let path = `${adAccountId}/campaigns?fields=${fields}&limit=${limit}`;
      if (status !== "ALL") {
        path += `&filtering=[{"field":"effective_status","operator":"IN","value":["${status}"]}]`;
      }
      const data = await metaApiFetch(path, accessToken);
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "success", adAccountId, campaigns: data.data || [], paging: data.paging }, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to fetch campaigns: ${error.message}` }) }],
        isError: true,
      };
    }
  },

  async get_ad_insights(args) {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) return tokenError();

    try {
      const {
        objectId,
        datePreset = "last_7d",
        metrics = ["impressions", "clicks", "spend", "cpc", "cpm", "ctr"],
        breakdowns,
        level = "campaign",
      } = args;
      const fields = metrics.join(",");
      let path = `${objectId}/insights?fields=${fields}&date_preset=${datePreset}&level=${level}`;
      if (breakdowns && breakdowns.length > 0) {
        path += `&breakdowns=${breakdowns.join(",")}`;
      }
      const data = await metaApiFetch(path, accessToken);
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "success", objectId, datePreset, level, insights: data.data || [], paging: data.paging }, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to fetch insights: ${error.message}` }) }],
        isError: true,
      };
    }
  },

  async get_daily_spend(args) {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) return tokenError();

    try {
      const { adAccountId, since, until } = args;
      const path = `${adAccountId}/insights?fields=spend,impressions,clicks,actions,cost_per_action_type&time_range={"since":"${since}","until":"${until}"}&time_increment=1`;
      const data = await metaApiFetch(path, accessToken);

      const dailyData = (data.data || []).map((day) => ({
        date: day.date_start,
        spend: parseFloat(day.spend || "0"),
        impressions: parseInt(day.impressions || "0"),
        clicks: parseInt(day.clicks || "0"),
        conversions: (day.actions || []).filter((a) => a.action_type === "offsite_conversion").length,
      }));
      const totalSpend = dailyData.reduce((sum, d) => sum + d.spend, 0);

      return {
        content: [{ type: "text", text: JSON.stringify({ status: "success", adAccountId, dateRange: { since, until }, totalSpend, currency: "COP", dailyBreakdown: dailyData }, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to fetch daily spend: ${error.message}` }) }],
        isError: true,
      };
    }
  },

  async get_audiences(args) {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) return tokenError();

    try {
      const { adAccountId } = args;
      const path = `${adAccountId}/customaudiences?fields=id,name,approximate_count_lower_bound,approximate_count_upper_bound,subtype,time_created`;
      const data = await metaApiFetch(path, accessToken);
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "success", adAccountId, audiences: data.data || [], paging: data.paging }, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to fetch audiences: ${error.message}` }) }],
        isError: true,
      };
    }
  },

  async calculate_roas(args) {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) return tokenError();

    try {
      const { adAccountId, since, until, revenue } = args;
      const path = `${adAccountId}/insights?fields=spend&time_range={"since":"${since}","until":"${until}"}`;
      const data = await metaApiFetch(path, accessToken);

      const spend = parseFloat(data.data?.[0]?.spend || "0");
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        content: [{ type: "text", text: JSON.stringify({
          status: "success", adAccountId, dateRange: { since, until },
          revenue, spend,
          roas: Math.round(roas * 100) / 100,
          roasPercentage: `${Math.round(roas * 100)}%`,
          profitable: roas > 1,
        }, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Failed to calculate ROAS: ${error.message}` }) }],
        isError: true,
      };
    }
  },
};

// ============================================
// RESOURCE DEFINITIONS
// ============================================

const RESOURCES = [
  { uri: "meta-ads://config", name: "meta-ads-config", description: "Server configuration and status", mimeType: "application/json" },
  { uri: "meta-ads://metrics", name: "available-metrics", description: "List of available Meta Ads metrics", mimeType: "application/json" },
];

const RESOURCE_HANDLERS = {
  "meta-ads://config": () => ({
    contents: [{
      uri: "meta-ads://config", mimeType: "application/json",
      text: JSON.stringify({
        server: SERVER_INFO.name, version: SERVER_INFO.version, apiVersion: "v21.0",
        configured: !!process.env.META_ADS_ACCESS_TOKEN,
        requiredEnvVars: ["META_ADS_ACCESS_TOKEN", "META_ADS_APP_ID (optional)", "META_ADS_APP_SECRET (optional)"],
      }),
    }],
  }),
  "meta-ads://metrics": () => ({
    contents: [{
      uri: "meta-ads://metrics", mimeType: "application/json",
      text: JSON.stringify({
        performance: ["impressions", "clicks", "spend", "reach", "frequency"],
        engagement: ["cpc", "cpm", "ctr", "cpp"],
        conversions: ["conversions", "cost_per_action_type", "actions", "action_values"],
        video: ["video_play_actions", "video_avg_time_watched_actions", "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions", "video_p100_watched_actions"],
      }),
    }],
  }),
};

// ============================================
// REQUEST HANDLER
// ============================================

async function handleRequest(method, params, id) {
  switch (method) {
    case "initialize":
      sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: CAPABILITIES,
        serverInfo: SERVER_INFO,
      });
      break;

    case "notifications/initialized":
      break;

    case "tools/list":
      sendResponse(id, { tools: TOOLS });
      break;

    case "tools/call": {
      const { name, arguments: args } = params;
      const handler = TOOL_HANDLERS[name];
      if (!handler) {
        sendError(id, -32602, `Unknown tool: ${name}`);
        return;
      }
      try {
        const result = await handler(args || {});
        sendResponse(id, result);
      } catch (err) {
        sendResponse(id, {
          content: [{ type: "text", text: JSON.stringify({ status: "error", message: err.message }) }],
          isError: true,
        });
      }
      break;
    }

    case "resources/list":
      sendResponse(id, { resources: RESOURCES });
      break;

    case "resources/read": {
      const { uri } = params;
      const resHandler = RESOURCE_HANDLERS[uri];
      if (!resHandler) {
        sendError(id, -32602, `Unknown resource: ${uri}`);
        return;
      }
      sendResponse(id, resHandler());
      break;
    }

    case "ping":
      sendResponse(id, {});
      break;

    default:
      if (id !== undefined) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
  }
}

// ============================================
// STDIO TRANSPORT
// ============================================

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    handleRequest(msg.method, msg.params || {}, msg.id);
  } catch (err) {
    sendError(null, -32700, `Parse error: ${err.message}`);
  }
});

rl.on("close", () => process.exit(0));

process.stderr.write("meta-ads-mcp running on stdio\n");
