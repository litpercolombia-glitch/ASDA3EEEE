#!/usr/bin/env node

// meta-ads-mcp v2.0 - Professional MCP server for Meta Ads (Facebook & Instagram)
// Zero dependencies - MCP protocol (JSON-RPC 2.0 over stdio) + Meta Graph API v21.0
// Litper Pro Colombia

import { createInterface } from "node:readline";

// ============================================
// MCP PROTOCOL LAYER
// ============================================

const SERVER_INFO = { name: "meta-ads-mcp", version: "2.0.0" };
const CAPABILITIES = { tools: {}, resources: {} };
const API_VERSION = "v21.0";
const API_BASE = `https://graph.facebook.com/${API_VERSION}`;

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}
function textResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function errorResult(msg) {
  return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: msg }, null, 2) }], isError: true };
}

// ============================================
// META API HELPERS
// ============================================

function getToken() {
  return process.env.META_ADS_ACCESS_TOKEN;
}

function requireToken() {
  const token = getToken();
  if (!token) throw new Error("META_ADS_ACCESS_TOKEN not configured. Set it in your environment or .mcp.json env.");
  return token;
}

async function metaGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${API_BASE}/${path}${sep}access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`Meta API Error: ${data.error.message} (code ${data.error.code})`);
  return data;
}

async function metaPost(path, body, token) {
  const url = `${API_BASE}/${path}?access_token=${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Meta API Error: ${data.error.message} (code ${data.error.code})`);
  return data;
}

async function metaDelete(path, token) {
  const url = `${API_BASE}/${path}?access_token=${token}`;
  const res = await fetch(url, { method: "DELETE" });
  const data = await res.json();
  if (data.error) throw new Error(`Meta API Error: ${data.error.message} (code ${data.error.code})`);
  return data;
}

// ============================================
// TOOL DEFINITIONS (30 total)
// ============================================

const TOOLS = [
  // === ORIGINAL 6 (READ) ===
  {
    name: "get_ad_accounts",
    description: "List all ad accounts associated with the Meta Business account",
    inputSchema: {
      type: "object",
      properties: {
        businessId: { type: "string", description: "Meta Business ID (uses default if not provided)" },
        limit: { type: "number", default: 50, description: "Max results" },
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
        status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED", "DELETED", "ALL"], default: "ALL" },
        limit: { type: "number", default: 50 },
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
        datePreset: { type: "string", enum: ["today", "yesterday", "last_7d", "last_14d", "last_30d", "this_month", "last_month", "this_quarter", "maximum"], default: "last_7d" },
        metrics: { type: "array", items: { type: "string" }, default: ["impressions", "clicks", "spend", "cpc", "cpm", "ctr", "conversions", "cost_per_action_type"] },
        breakdowns: { type: "array", items: { type: "string", enum: ["age", "gender", "country", "platform_position", "publisher_platform", "device_platform", "impression_device"] } },
        level: { type: "string", enum: ["account", "campaign", "adset", "ad"], default: "campaign" },
        timeIncrement: { type: "string", enum: ["1", "7", "monthly", "all_days"], default: "all_days", description: "Time increment for breakdown" },
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
        limit: { type: "number", default: 100 },
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

  // === 24 NEW PROFESSIONAL TOOLS ===

  // --- Campaign Management (CRUD) ---
  {
    name: "create_campaign",
    description: "Create a new Meta Ads campaign with objective, budget, and targeting",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        name: { type: "string", description: "Campaign name" },
        objective: { type: "string", enum: ["OUTCOME_AWARENESS", "OUTCOME_TRAFFIC", "OUTCOME_ENGAGEMENT", "OUTCOME_LEADS", "OUTCOME_APP_PROMOTION", "OUTCOME_SALES"], description: "Campaign objective" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED"], default: "PAUSED" },
        dailyBudget: { type: "number", description: "Daily budget in cents (e.g., 5000 = $50.00)" },
        lifetimeBudget: { type: "number", description: "Lifetime budget in cents (overrides dailyBudget)" },
        bidStrategy: { type: "string", enum: ["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP"], default: "LOWEST_COST_WITHOUT_CAP" },
        specialAdCategories: { type: "array", items: { type: "string", enum: ["NONE", "EMPLOYMENT", "HOUSING", "CREDIT", "ISSUES_ELECTIONS_POLITICS"] }, default: ["NONE"] },
      },
      required: ["adAccountId", "name", "objective"],
    },
  },
  {
    name: "update_campaign",
    description: "Update an existing campaign's name, budget, status, or bid strategy",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID" },
        name: { type: "string" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED"] },
        dailyBudget: { type: "number", description: "New daily budget in cents" },
        lifetimeBudget: { type: "number", description: "New lifetime budget in cents" },
        bidStrategy: { type: "string", enum: ["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP"] },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "pause_campaign",
    description: "Pause an active campaign",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string", description: "Campaign ID to pause" } },
      required: ["campaignId"],
    },
  },
  {
    name: "delete_campaign",
    description: "Delete/archive a campaign (sets status to DELETED)",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string", description: "Campaign ID to delete" } },
      required: ["campaignId"],
    },
  },
  {
    name: "duplicate_campaign",
    description: "Duplicate an existing campaign with all its ad sets and ads",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string", description: "Campaign ID to duplicate" },
        newName: { type: "string", description: "Name for the duplicate campaign" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED"], default: "PAUSED" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "bulk_update_campaigns",
    description: "Update multiple campaigns at once (bulk status change, budget update)",
    inputSchema: {
      type: "object",
      properties: {
        campaignIds: { type: "array", items: { type: "string" }, description: "Array of campaign IDs" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED"] },
        dailyBudget: { type: "number", description: "New daily budget in cents (applied to all)" },
      },
      required: ["campaignIds"],
    },
  },

  // --- Ad Set Management ---
  {
    name: "create_ad_set",
    description: "Create a new ad set within a campaign with targeting, placement, and scheduling",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        campaignId: { type: "string", description: "Parent campaign ID" },
        name: { type: "string", description: "Ad set name" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED"], default: "PAUSED" },
        dailyBudget: { type: "number", description: "Daily budget in cents" },
        billingEvent: { type: "string", enum: ["IMPRESSIONS", "LINK_CLICKS", "POST_ENGAGEMENT", "THRUPLAY"], default: "IMPRESSIONS" },
        optimizationGoal: { type: "string", enum: ["REACH", "IMPRESSIONS", "LINK_CLICKS", "LANDING_PAGE_VIEWS", "LEAD_GENERATION", "CONVERSIONS", "VALUE"], default: "LINK_CLICKS" },
        targetingCountries: { type: "array", items: { type: "string" }, default: ["CO"], description: "ISO country codes" },
        targetingAgeMin: { type: "number", default: 18 },
        targetingAgeMax: { type: "number", default: 65 },
        targetingGenders: { type: "array", items: { type: "number", enum: [0, 1, 2] }, default: [0], description: "0=all, 1=male, 2=female" },
        targetingInterests: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } }, description: "Interest targeting" },
        placements: { type: "string", enum: ["automatic", "manual"], default: "automatic" },
        startTime: { type: "string", description: "Start time (ISO 8601)" },
        endTime: { type: "string", description: "End time (ISO 8601)" },
      },
      required: ["adAccountId", "campaignId", "name"],
    },
  },
  {
    name: "update_ad_set",
    description: "Update an existing ad set's targeting, budget, status, or schedule",
    inputSchema: {
      type: "object",
      properties: {
        adSetId: { type: "string", description: "Ad set ID" },
        name: { type: "string" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED"] },
        dailyBudget: { type: "number" },
        targetingCountries: { type: "array", items: { type: "string" } },
        targetingAgeMin: { type: "number" },
        targetingAgeMax: { type: "number" },
        endTime: { type: "string" },
      },
      required: ["adSetId"],
    },
  },

  // --- Ad Creative Management ---
  {
    name: "create_ad",
    description: "Create a new ad within an ad set with creative content",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        adSetId: { type: "string", description: "Parent ad set ID" },
        name: { type: "string", description: "Ad name" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED"], default: "PAUSED" },
        creativeId: { type: "string", description: "Existing creative ID to use" },
        pageId: { type: "string", description: "Facebook Page ID for the ad" },
        message: { type: "string", description: "Ad copy / primary text" },
        headline: { type: "string", description: "Ad headline" },
        description: { type: "string", description: "Ad description" },
        linkUrl: { type: "string", description: "Destination URL" },
        imageHash: { type: "string", description: "Image hash (from ad account images)" },
        videoId: { type: "string", description: "Video ID for video ads" },
        callToAction: { type: "string", enum: ["LEARN_MORE", "SHOP_NOW", "SIGN_UP", "BOOK_NOW", "CONTACT_US", "DOWNLOAD", "GET_OFFER", "GET_QUOTE", "SUBSCRIBE", "APPLY_NOW", "BUY_NOW", "SEND_MESSAGE", "WATCH_MORE"], default: "LEARN_MORE" },
      },
      required: ["adAccountId", "adSetId", "name"],
    },
  },
  {
    name: "update_ad_creative",
    description: "Update an existing ad's creative content (copy, image, video, CTA)",
    inputSchema: {
      type: "object",
      properties: {
        adId: { type: "string", description: "Ad ID" },
        name: { type: "string" },
        status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
        creativeId: { type: "string", description: "New creative ID" },
      },
      required: ["adId"],
    },
  },
  {
    name: "get_ad_preview",
    description: "Get a preview/mockup URL of how an ad will look on different placements",
    inputSchema: {
      type: "object",
      properties: {
        adId: { type: "string", description: "Ad ID to preview" },
        adFormat: { type: "string", enum: ["DESKTOP_FEED_STANDARD", "MOBILE_FEED_STANDARD", "INSTAGRAM_STANDARD", "INSTAGRAM_STORY", "RIGHT_COLUMN_STANDARD", "MARKETPLACE_MOBILE"], default: "MOBILE_FEED_STANDARD" },
      },
      required: ["adId"],
    },
  },

  // --- Advanced Analytics ---
  {
    name: "get_conversion_data",
    description: "Get detailed conversion/action data for campaigns including purchase, lead, and custom events",
    inputSchema: {
      type: "object",
      properties: {
        objectId: { type: "string", description: "Campaign, ad set, or ad account ID" },
        datePreset: { type: "string", enum: ["today", "yesterday", "last_7d", "last_14d", "last_30d", "this_month", "last_month"], default: "last_30d" },
        actionBreakdowns: { type: "array", items: { type: "string", enum: ["action_type", "action_target_id", "action_destination"] }, default: ["action_type"] },
        level: { type: "string", enum: ["account", "campaign", "adset", "ad"], default: "campaign" },
      },
      required: ["objectId"],
    },
  },
  {
    name: "get_attribution_report",
    description: "Get attribution report with different attribution windows (1d, 7d, 28d click/view)",
    inputSchema: {
      type: "object",
      properties: {
        objectId: { type: "string", description: "Campaign or ad account ID" },
        datePreset: { type: "string", enum: ["last_7d", "last_14d", "last_30d", "this_month", "last_month"], default: "last_30d" },
        attributionWindows: { type: "array", items: { type: "string", enum: ["1d_click", "7d_click", "28d_click", "1d_view", "7d_view"] }, default: ["7d_click", "1d_view"] },
      },
      required: ["objectId"],
    },
  },
  {
    name: "get_placement_breakdown",
    description: "Get performance breakdown by placement (Feed, Stories, Reels, Marketplace, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        objectId: { type: "string" },
        datePreset: { type: "string", default: "last_30d" },
      },
      required: ["objectId"],
    },
  },
  {
    name: "get_device_breakdown",
    description: "Get performance breakdown by device (mobile, desktop, tablet)",
    inputSchema: {
      type: "object",
      properties: {
        objectId: { type: "string" },
        datePreset: { type: "string", default: "last_30d" },
      },
      required: ["objectId"],
    },
  },
  {
    name: "get_demographic_breakdown",
    description: "Get performance breakdown by age, gender, and country",
    inputSchema: {
      type: "object",
      properties: {
        objectId: { type: "string" },
        datePreset: { type: "string", default: "last_30d" },
        breakdownType: { type: "string", enum: ["age_gender", "country", "region"], default: "age_gender" },
      },
      required: ["objectId"],
    },
  },
  {
    name: "compare_campaigns",
    description: "Compare performance metrics of multiple campaigns side by side",
    inputSchema: {
      type: "object",
      properties: {
        campaignIds: { type: "array", items: { type: "string" }, description: "Campaign IDs to compare" },
        datePreset: { type: "string", default: "last_30d" },
        metrics: { type: "array", items: { type: "string" }, default: ["impressions", "clicks", "spend", "cpc", "cpm", "ctr", "conversions"] },
      },
      required: ["campaignIds"],
    },
  },
  {
    name: "ab_test_analysis",
    description: "Analyze A/B test results between two campaigns or ad sets with statistical significance",
    inputSchema: {
      type: "object",
      properties: {
        controlId: { type: "string", description: "Control group campaign/ad set ID" },
        variantId: { type: "string", description: "Variant group campaign/ad set ID" },
        datePreset: { type: "string", default: "last_30d" },
        primaryMetric: { type: "string", enum: ["ctr", "cpc", "conversions", "cost_per_action_type", "roas"], default: "ctr" },
      },
      required: ["controlId", "variantId"],
    },
  },
  {
    name: "export_report_csv",
    description: "Generate a CSV report of campaign performance data",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        datePreset: { type: "string", default: "last_30d" },
        level: { type: "string", enum: ["account", "campaign", "adset", "ad"], default: "campaign" },
        metrics: { type: "array", items: { type: "string" }, default: ["campaign_name", "impressions", "clicks", "spend", "cpc", "cpm", "ctr"] },
        breakdowns: { type: "array", items: { type: "string" } },
      },
      required: ["adAccountId"],
    },
  },
  {
    name: "get_budget_recommendations",
    description: "Get budget recommendations and delivery estimates for campaigns",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID" },
        campaignId: { type: "string", description: "Campaign ID for specific recommendations" },
      },
      required: ["adAccountId"],
    },
  },

  // --- Audiences ---
  {
    name: "create_custom_audience",
    description: "Create a custom audience from customer data, website visitors, or app users",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        name: { type: "string", description: "Audience name" },
        description: { type: "string", description: "Audience description" },
        subtype: { type: "string", enum: ["CUSTOM", "WEBSITE", "APP", "OFFLINE", "ENGAGEMENT", "VIDEO", "LOOKALIKE"], default: "CUSTOM" },
        retentionDays: { type: "number", default: 30, description: "Data retention window in days" },
        rule: { type: "string", description: "JSON rule for website/app audiences (pixel-based)" },
        pixelId: { type: "string", description: "Pixel ID for website custom audience" },
      },
      required: ["adAccountId", "name"],
    },
  },
  {
    name: "create_lookalike_audience",
    description: "Create a lookalike audience based on a source custom audience",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        name: { type: "string", description: "Lookalike audience name" },
        sourceAudienceId: { type: "string", description: "Source custom audience ID" },
        targetCountries: { type: "array", items: { type: "string" }, default: ["CO"], description: "Target country codes" },
        ratio: { type: "number", default: 0.01, description: "Lookalike ratio (0.01=1% most similar, up to 0.20=20%)" },
      },
      required: ["adAccountId", "name", "sourceAudienceId"],
    },
  },

  // --- Pixel & Conversions ---
  {
    name: "get_pixel_events",
    description: "Get pixel events and their stats for an ad account",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        pixelId: { type: "string", description: "Specific pixel ID (optional, lists all if omitted)" },
      },
      required: ["adAccountId"],
    },
  },
  {
    name: "create_custom_conversion",
    description: "Create a custom conversion rule for tracking specific events",
    inputSchema: {
      type: "object",
      properties: {
        adAccountId: { type: "string", description: "Ad account ID (act_XXXXXXXXX)" },
        name: { type: "string", description: "Custom conversion name" },
        pixelId: { type: "string", description: "Pixel ID" },
        eventName: { type: "string", enum: ["Purchase", "Lead", "CompleteRegistration", "AddToCart", "InitiateCheckout", "ViewContent", "Search", "AddPaymentInfo", "AddToWishlist", "Subscribe", "StartTrial"], description: "Standard event name" },
        rule: { type: "string", description: "JSON rule (e.g., URL contains '/thank-you')" },
        defaultConversionValue: { type: "number", description: "Default monetary value for this conversion" },
      },
      required: ["adAccountId", "name", "pixelId"],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

const TOOL_HANDLERS = {
  // === ORIGINAL 6 ===

  async get_ad_accounts({ businessId, limit = 50 }) {
    const token = requireToken();
    const path = businessId
      ? `${businessId}/adaccounts?fields=id,name,account_status,currency,balance,amount_spent,business_name,timezone_name&limit=${limit}`
      : `me/adaccounts?fields=id,name,account_status,currency,balance,amount_spent,business_name,timezone_name&limit=${limit}`;
    const data = await metaGet(path, token);
    const statusMap = { 1: "ACTIVE", 2: "DISABLED", 3: "UNSETTLED", 7: "PENDING_RISK_REVIEW", 8: "PENDING_SETTLEMENT", 9: "IN_GRACE_PERIOD", 100: "PENDING_CLOSURE", 101: "CLOSED", 201: "ANY_ACTIVE", 202: "ANY_CLOSED" };
    const accounts = (data.data || []).map(a => ({ ...a, account_status_label: statusMap[a.account_status] || "UNKNOWN" }));
    return textResult({ status: "success", accounts, total: accounts.length, paging: data.paging });
  },

  async get_campaigns({ adAccountId, status = "ALL", limit = 50 }) {
    const token = requireToken();
    const fields = "id,name,status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining,bid_strategy,start_time,stop_time,created_time,updated_time";
    let path = `${adAccountId}/campaigns?fields=${fields}&limit=${limit}`;
    if (status !== "ALL") path += `&filtering=[{"field":"effective_status","operator":"IN","value":["${status}"]}]`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", adAccountId, campaigns: data.data || [], total: (data.data || []).length, paging: data.paging });
  },

  async get_ad_insights({ objectId, datePreset = "last_7d", metrics = ["impressions", "clicks", "spend", "cpc", "cpm", "ctr"], breakdowns, level = "campaign", timeIncrement = "all_days" }) {
    const token = requireToken();
    const fields = metrics.join(",");
    let path = `${objectId}/insights?fields=${fields}&date_preset=${datePreset}&level=${level}`;
    if (timeIncrement !== "all_days") path += `&time_increment=${timeIncrement}`;
    if (breakdowns?.length) path += `&breakdowns=${breakdowns.join(",")}`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", objectId, datePreset, level, insights: data.data || [], paging: data.paging });
  },

  async get_daily_spend({ adAccountId, since, until }) {
    const token = requireToken();
    const path = `${adAccountId}/insights?fields=spend,impressions,clicks,actions,cost_per_action_type&time_range={"since":"${since}","until":"${until}"}&time_increment=1`;
    const data = await metaGet(path, token);
    const dailyData = (data.data || []).map(d => ({
      date: d.date_start, spend: parseFloat(d.spend || "0"),
      impressions: parseInt(d.impressions || "0"), clicks: parseInt(d.clicks || "0"),
      conversions: (d.actions || []).filter(a => a.action_type === "offsite_conversion").length,
    }));
    const totalSpend = dailyData.reduce((s, d) => s + d.spend, 0);
    return textResult({ status: "success", adAccountId, dateRange: { since, until }, totalSpend, currency: "COP", dailyBreakdown: dailyData, daysTracked: dailyData.length });
  },

  async get_audiences({ adAccountId, limit = 100 }) {
    const token = requireToken();
    const path = `${adAccountId}/customaudiences?fields=id,name,description,approximate_count_lower_bound,approximate_count_upper_bound,subtype,time_created,time_updated,delivery_status,operation_status&limit=${limit}`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", adAccountId, audiences: data.data || [], total: (data.data || []).length, paging: data.paging });
  },

  async calculate_roas({ adAccountId, since, until, revenue }) {
    const token = requireToken();
    const path = `${adAccountId}/insights?fields=spend,impressions,clicks,actions&time_range={"since":"${since}","until":"${until}"}`;
    const data = await metaGet(path, token);
    const spend = parseFloat(data.data?.[0]?.spend || "0");
    const clicks = parseInt(data.data?.[0]?.clicks || "0");
    const impressions = parseInt(data.data?.[0]?.impressions || "0");
    const roas = spend > 0 ? revenue / spend : 0;
    const costPerConversion = clicks > 0 ? spend / clicks : 0;
    return textResult({
      status: "success", adAccountId, dateRange: { since, until },
      revenue, spend, roas: Math.round(roas * 100) / 100, roasPercentage: `${Math.round(roas * 100)}%`,
      profitable: roas > 1, impressions, clicks,
      costPerClick: clicks > 0 ? (spend / clicks).toFixed(2) : "N/A",
      recommendation: roas > 3 ? "Excellent ROAS! Consider scaling budget." : roas > 1.5 ? "Good ROAS. Monitor and optimize." : roas > 1 ? "Marginal ROAS. Optimize targeting and creatives." : "Negative ROAS. Review strategy urgently.",
    });
  },

  // === NEW TOOLS ===

  async create_campaign({ adAccountId, name, objective, status = "PAUSED", dailyBudget, lifetimeBudget, bidStrategy = "LOWEST_COST_WITHOUT_CAP", specialAdCategories = ["NONE"] }) {
    const token = requireToken();
    const body = { name, objective, status, bid_strategy: bidStrategy, special_ad_categories: specialAdCategories };
    if (dailyBudget) body.daily_budget = dailyBudget;
    if (lifetimeBudget) body.lifetime_budget = lifetimeBudget;
    const data = await metaPost(`${adAccountId}/campaigns`, body, token);
    return textResult({ status: "success", message: "Campaign created", campaignId: data.id, name, objective, adStatus: status });
  },

  async update_campaign({ campaignId, name, status, dailyBudget, lifetimeBudget, bidStrategy }) {
    const token = requireToken();
    const body = {};
    if (name) body.name = name;
    if (status) body.status = status;
    if (dailyBudget) body.daily_budget = dailyBudget;
    if (lifetimeBudget) body.lifetime_budget = lifetimeBudget;
    if (bidStrategy) body.bid_strategy = bidStrategy;
    const data = await metaPost(campaignId, body, token);
    return textResult({ status: "success", message: "Campaign updated", campaignId, updates: body, result: data });
  },

  async pause_campaign({ campaignId }) {
    const token = requireToken();
    const data = await metaPost(campaignId, { status: "PAUSED" }, token);
    return textResult({ status: "success", message: "Campaign paused", campaignId, result: data });
  },

  async delete_campaign({ campaignId }) {
    const token = requireToken();
    const data = await metaPost(campaignId, { status: "DELETED" }, token);
    return textResult({ status: "success", message: "Campaign deleted (archived)", campaignId, result: data });
  },

  async duplicate_campaign({ campaignId, newName, status = "PAUSED" }) {
    const token = requireToken();
    const body = { status_option: status };
    if (newName) body.rename_options = { rename_suffix: ` - ${newName}` };
    const data = await metaPost(`${campaignId}/copies`, body, token);
    return textResult({ status: "success", message: "Campaign duplicated", originalId: campaignId, newCampaignId: data.copied_campaign_id || data.id, status });
  },

  async bulk_update_campaigns({ campaignIds, status, dailyBudget }) {
    const token = requireToken();
    const results = [];
    for (const id of campaignIds) {
      try {
        const body = {};
        if (status) body.status = status;
        if (dailyBudget) body.daily_budget = dailyBudget;
        const data = await metaPost(id, body, token);
        results.push({ campaignId: id, status: "success", result: data });
      } catch (err) {
        results.push({ campaignId: id, status: "error", message: err.message });
      }
    }
    return textResult({ status: "success", message: `Bulk update completed`, total: campaignIds.length, succeeded: results.filter(r => r.status === "success").length, failed: results.filter(r => r.status === "error").length, results });
  },

  async create_ad_set({ adAccountId, campaignId, name, status = "PAUSED", dailyBudget, billingEvent = "IMPRESSIONS", optimizationGoal = "LINK_CLICKS", targetingCountries = ["CO"], targetingAgeMin = 18, targetingAgeMax = 65, targetingGenders = [0], targetingInterests, placements = "automatic", startTime, endTime }) {
    const token = requireToken();
    const targeting = {
      geo_locations: { countries: targetingCountries },
      age_min: targetingAgeMin,
      age_max: targetingAgeMax,
    };
    if (targetingGenders[0] !== 0) targeting.genders = targetingGenders;
    if (targetingInterests?.length) targeting.interests = targetingInterests;

    const body = { campaign_id: campaignId, name, status, billing_event: billingEvent, optimization_goal: optimizationGoal, targeting };
    if (dailyBudget) body.daily_budget = dailyBudget;
    if (startTime) body.start_time = startTime;
    if (endTime) body.end_time = endTime;

    const data = await metaPost(`${adAccountId}/adsets`, body, token);
    return textResult({ status: "success", message: "Ad set created", adSetId: data.id, name, campaignId, targeting: { countries: targetingCountries, age: `${targetingAgeMin}-${targetingAgeMax}` } });
  },

  async update_ad_set({ adSetId, name, status, dailyBudget, targetingCountries, targetingAgeMin, targetingAgeMax, endTime }) {
    const token = requireToken();
    const body = {};
    if (name) body.name = name;
    if (status) body.status = status;
    if (dailyBudget) body.daily_budget = dailyBudget;
    if (endTime) body.end_time = endTime;
    if (targetingCountries || targetingAgeMin || targetingAgeMax) {
      body.targeting = {};
      if (targetingCountries) body.targeting.geo_locations = { countries: targetingCountries };
      if (targetingAgeMin) body.targeting.age_min = targetingAgeMin;
      if (targetingAgeMax) body.targeting.age_max = targetingAgeMax;
    }
    const data = await metaPost(adSetId, body, token);
    return textResult({ status: "success", message: "Ad set updated", adSetId, updates: body, result: data });
  },

  async create_ad({ adAccountId, adSetId, name, status = "PAUSED", creativeId, pageId, message, headline, description, linkUrl, imageHash, videoId, callToAction = "LEARN_MORE" }) {
    const token = requireToken();
    const body = { adset_id: adSetId, name, status };

    if (creativeId) {
      body.creative = { creative_id: creativeId };
    } else {
      const creative = {};
      const objectStorySpec = { page_id: pageId };

      if (videoId) {
        objectStorySpec.video_data = {
          video_id: videoId,
          message: message || "",
          title: headline || "",
          call_to_action: { type: callToAction, value: { link: linkUrl } },
        };
      } else {
        objectStorySpec.link_data = {
          link: linkUrl || "",
          message: message || "",
          name: headline || "",
          description: description || "",
          call_to_action: { type: callToAction },
        };
        if (imageHash) objectStorySpec.link_data.image_hash = imageHash;
      }
      creative.object_story_spec = objectStorySpec;
      body.creative = creative;
    }

    const data = await metaPost(`${adAccountId}/ads`, body, token);
    return textResult({ status: "success", message: "Ad created", adId: data.id, name, adSetId });
  },

  async update_ad_creative({ adId, name, status, creativeId }) {
    const token = requireToken();
    const body = {};
    if (name) body.name = name;
    if (status) body.status = status;
    if (creativeId) body.creative = { creative_id: creativeId };
    const data = await metaPost(adId, body, token);
    return textResult({ status: "success", message: "Ad updated", adId, updates: body, result: data });
  },

  async get_ad_preview({ adId, adFormat = "MOBILE_FEED_STANDARD" }) {
    const token = requireToken();
    const data = await metaGet(`${adId}/previews?ad_format=${adFormat}`, token);
    return textResult({ status: "success", adId, adFormat, previews: data.data || [] });
  },

  async get_conversion_data({ objectId, datePreset = "last_30d", actionBreakdowns = ["action_type"], level = "campaign" }) {
    const token = requireToken();
    const fields = "actions,action_values,cost_per_action_type,cost_per_unique_action_type,conversions,conversion_values,spend";
    const path = `${objectId}/insights?fields=${fields}&date_preset=${datePreset}&level=${level}&action_breakdowns=${actionBreakdowns.join(",")}`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", objectId, datePreset, level, conversionData: data.data || [], paging: data.paging });
  },

  async get_attribution_report({ objectId, datePreset = "last_30d", attributionWindows = ["7d_click", "1d_view"] }) {
    const token = requireToken();
    const attributionSetting = attributionWindows.join(",");
    const fields = "actions,action_values,cost_per_action_type,spend,impressions,clicks";
    const path = `${objectId}/insights?fields=${fields}&date_preset=${datePreset}&action_attribution_windows=${attributionSetting}`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", objectId, datePreset, attributionWindows, attributionData: data.data || [], paging: data.paging });
  },

  async get_placement_breakdown({ objectId, datePreset = "last_30d" }) {
    const token = requireToken();
    const fields = "impressions,clicks,spend,cpc,cpm,ctr,actions,publisher_platform,platform_position";
    const path = `${objectId}/insights?fields=${fields}&date_preset=${datePreset}&breakdowns=publisher_platform,platform_position`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", objectId, datePreset, breakdown: "placement", data: data.data || [], paging: data.paging });
  },

  async get_device_breakdown({ objectId, datePreset = "last_30d" }) {
    const token = requireToken();
    const fields = "impressions,clicks,spend,cpc,cpm,ctr,actions,impression_device";
    const path = `${objectId}/insights?fields=${fields}&date_preset=${datePreset}&breakdowns=impression_device`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", objectId, datePreset, breakdown: "device", data: data.data || [], paging: data.paging });
  },

  async get_demographic_breakdown({ objectId, datePreset = "last_30d", breakdownType = "age_gender" }) {
    const token = requireToken();
    const fields = "impressions,clicks,spend,cpc,cpm,ctr,actions";
    const breakdownMap = { age_gender: "age,gender", country: "country", region: "region" };
    const path = `${objectId}/insights?fields=${fields}&date_preset=${datePreset}&breakdowns=${breakdownMap[breakdownType]}`;
    const data = await metaGet(path, token);
    return textResult({ status: "success", objectId, datePreset, breakdown: breakdownType, data: data.data || [], paging: data.paging });
  },

  async compare_campaigns({ campaignIds, datePreset = "last_30d", metrics = ["impressions", "clicks", "spend", "cpc", "cpm", "ctr", "conversions"] }) {
    const token = requireToken();
    const results = [];
    for (const id of campaignIds) {
      try {
        const infoData = await metaGet(`${id}?fields=name,status,objective`, token);
        const fields = metrics.join(",");
        const insightsData = await metaGet(`${id}/insights?fields=${fields}&date_preset=${datePreset}`, token);
        results.push({ campaignId: id, name: infoData.name, status: infoData.status, objective: infoData.objective, metrics: insightsData.data?.[0] || {} });
      } catch (err) {
        results.push({ campaignId: id, status: "error", message: err.message });
      }
    }

    // Rank by spend efficiency
    const ranked = results.filter(r => r.metrics?.ctr).sort((a, b) => parseFloat(b.metrics.ctr) - parseFloat(a.metrics.ctr));
    return textResult({ status: "success", datePreset, comparison: results, rankedByCTR: ranked.map(r => ({ id: r.campaignId, name: r.name, ctr: r.metrics.ctr })), totalCampaigns: campaignIds.length });
  },

  async ab_test_analysis({ controlId, variantId, datePreset = "last_30d", primaryMetric = "ctr" }) {
    const token = requireToken();
    const fields = "impressions,clicks,spend,cpc,cpm,ctr,actions,conversions,cost_per_action_type";

    const [controlInfo, variantInfo] = await Promise.all([
      metaGet(`${controlId}?fields=name,status`, token),
      metaGet(`${variantId}?fields=name,status`, token),
    ]);
    const [controlData, variantData] = await Promise.all([
      metaGet(`${controlId}/insights?fields=${fields}&date_preset=${datePreset}`, token),
      metaGet(`${variantId}/insights?fields=${fields}&date_preset=${datePreset}`, token),
    ]);

    const c = controlData.data?.[0] || {};
    const v = variantData.data?.[0] || {};
    const cMetric = parseFloat(c[primaryMetric] || "0");
    const vMetric = parseFloat(v[primaryMetric] || "0");
    const lift = cMetric > 0 ? ((vMetric - cMetric) / cMetric * 100).toFixed(2) : "N/A";

    // Simplified statistical significance (z-test for proportions)
    const cImp = parseInt(c.impressions || "0");
    const vImp = parseInt(v.impressions || "0");
    const cClicks = parseInt(c.clicks || "0");
    const vClicks = parseInt(v.clicks || "0");
    let significant = "insufficient_data";
    if (cImp > 100 && vImp > 100) {
      const p1 = cClicks / cImp;
      const p2 = vClicks / vImp;
      const pPool = (cClicks + vClicks) / (cImp + vImp);
      const se = Math.sqrt(pPool * (1 - pPool) * (1 / cImp + 1 / vImp));
      const z = se > 0 ? Math.abs(p2 - p1) / se : 0;
      significant = z > 1.96 ? "yes (95% confidence)" : z > 1.645 ? "marginal (90% confidence)" : "no";
    }

    return textResult({
      status: "success", datePreset, primaryMetric,
      control: { id: controlId, name: controlInfo.name, metrics: c },
      variant: { id: variantId, name: variantInfo.name, metrics: v },
      analysis: {
        controlValue: cMetric, variantValue: vMetric,
        liftPercentage: lift, winner: vMetric > cMetric ? "variant" : cMetric > vMetric ? "control" : "tie",
        statisticallySignificant: significant,
      },
      recommendation: vMetric > cMetric && significant.startsWith("yes")
        ? "Variant is the clear winner. Scale the variant."
        : significant === "no"
        ? "No significant difference yet. Continue testing with more data."
        : "Results are marginal. Consider extending the test duration.",
    });
  },

  async export_report_csv({ adAccountId, datePreset = "last_30d", level = "campaign", metrics = ["campaign_name", "impressions", "clicks", "spend", "cpc", "cpm", "ctr"], breakdowns }) {
    const token = requireToken();
    const insightMetrics = metrics.filter(m => m !== "campaign_name" && m !== "adset_name" && m !== "ad_name");
    const fields = [...insightMetrics, "campaign_name", "adset_name", "ad_name"].join(",");
    let path = `${adAccountId}/insights?fields=${fields}&date_preset=${datePreset}&level=${level}&limit=500`;
    if (breakdowns?.length) path += `&breakdowns=${breakdowns.join(",")}`;
    const data = await metaGet(path, token);
    const rows = data.data || [];

    if (rows.length === 0) return textResult({ status: "success", message: "No data for the selected period", csv: "", rowCount: 0 });

    const headers = metrics;
    const csvLines = [headers.join(",")];
    for (const row of rows) {
      const values = headers.map(h => {
        const val = row[h] ?? "";
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      });
      csvLines.push(values.join(","));
    }
    const csv = csvLines.join("\n");
    return textResult({ status: "success", adAccountId, datePreset, level, rowCount: rows.length, csv, message: `CSV report generated with ${rows.length} rows` });
  },

  async get_budget_recommendations({ adAccountId, campaignId }) {
    const token = requireToken();
    if (campaignId) {
      const data = await metaGet(`${campaignId}?fields=name,daily_budget,lifetime_budget,budget_remaining,recommendations`, token);
      return textResult({ status: "success", campaignId, data });
    }
    const data = await metaGet(`${adAccountId}/campaigns?fields=name,daily_budget,lifetime_budget,budget_remaining,recommendations&limit=20&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]`, token);
    return textResult({ status: "success", adAccountId, activeCampaigns: data.data || [], total: (data.data || []).length });
  },

  async create_custom_audience({ adAccountId, name, description, subtype = "CUSTOM", retentionDays = 30, rule, pixelId }) {
    const token = requireToken();
    const body = { name, subtype, customer_file_source: "USER_PROVIDED_ONLY" };
    if (description) body.description = description;

    if (subtype === "WEBSITE" && pixelId) {
      body.rule = rule || JSON.stringify({ inclusions: { operator: "or", rules: [{ event_sources: [{ id: pixelId, type: "pixel" }], retention_seconds: retentionDays * 86400 }] } });
      body.pixel_id = pixelId;
    }

    const data = await metaPost(`${adAccountId}/customaudiences`, body, token);
    return textResult({ status: "success", message: "Custom audience created", audienceId: data.id, name, subtype });
  },

  async create_lookalike_audience({ adAccountId, name, sourceAudienceId, targetCountries = ["CO"], ratio = 0.01 }) {
    const token = requireToken();
    const body = {
      name,
      subtype: "LOOKALIKE",
      origin_audience_id: sourceAudienceId,
      lookalike_spec: JSON.stringify({
        type: "similarity",
        country: targetCountries[0],
        ratio,
        starting_ratio: 0,
      }),
    };
    const data = await metaPost(`${adAccountId}/customaudiences`, body, token);
    return textResult({ status: "success", message: "Lookalike audience created", audienceId: data.id, name, source: sourceAudienceId, ratio: `${ratio * 100}%`, countries: targetCountries });
  },

  async get_pixel_events({ adAccountId, pixelId }) {
    const token = requireToken();
    if (pixelId) {
      const data = await metaGet(`${pixelId}?fields=id,name,code,last_fired_time,is_unavailable,data_use_setting`, token);
      const stats = await metaGet(`${pixelId}/stats?aggregation=event`, token);
      return textResult({ status: "success", pixel: data, eventStats: stats.data || [] });
    }
    const data = await metaGet(`${adAccountId}/adspixels?fields=id,name,code,last_fired_time,is_unavailable,data_use_setting`, token);
    return textResult({ status: "success", adAccountId, pixels: data.data || [], total: (data.data || []).length });
  },

  async create_custom_conversion({ adAccountId, name, pixelId, eventName, rule, defaultConversionValue }) {
    const token = requireToken();
    const body = { name, pixel_id: pixelId, custom_event_type: eventName || "OTHER" };
    if (rule) body.rule = rule;
    if (defaultConversionValue) body.default_conversion_value = defaultConversionValue;
    if (eventName) body.event_source_type = "WEB";
    const data = await metaPost(`${adAccountId}/customconversions`, body, token);
    return textResult({ status: "success", message: "Custom conversion created", conversionId: data.id, name, eventName: eventName || "OTHER", pixelId });
  },
};

// ============================================
// RESOURCES
// ============================================

const RESOURCES = [
  { uri: "meta-ads://config", name: "meta-ads-config", description: "Server configuration and status", mimeType: "application/json" },
  { uri: "meta-ads://metrics", name: "available-metrics", description: "All available Meta Ads metrics", mimeType: "application/json" },
  { uri: "meta-ads://objectives", name: "campaign-objectives", description: "Available campaign objectives", mimeType: "application/json" },
];

const RESOURCE_HANDLERS = {
  "meta-ads://config": () => ({
    contents: [{
      uri: "meta-ads://config", mimeType: "application/json",
      text: JSON.stringify({
        server: SERVER_INFO.name, version: SERVER_INFO.version, apiVersion: API_VERSION,
        configured: !!getToken(), totalTools: TOOLS.length,
        categories: {
          read: ["get_ad_accounts", "get_campaigns", "get_ad_insights", "get_daily_spend", "get_audiences", "get_pixel_events", "get_ad_preview"],
          analytics: ["calculate_roas", "get_conversion_data", "get_attribution_report", "get_placement_breakdown", "get_device_breakdown", "get_demographic_breakdown", "compare_campaigns", "ab_test_analysis", "export_report_csv", "get_budget_recommendations"],
          campaign_management: ["create_campaign", "update_campaign", "pause_campaign", "delete_campaign", "duplicate_campaign", "bulk_update_campaigns"],
          ad_set_management: ["create_ad_set", "update_ad_set"],
          ad_management: ["create_ad", "update_ad_creative"],
          audiences: ["create_custom_audience", "create_lookalike_audience"],
          pixel_conversions: ["create_custom_conversion"],
        },
        requiredEnvVars: ["META_ADS_ACCESS_TOKEN"],
        optionalEnvVars: ["META_ADS_APP_ID", "META_ADS_APP_SECRET", "META_ADS_PIXEL_ID"],
      }),
    }],
  }),
  "meta-ads://metrics": () => ({
    contents: [{
      uri: "meta-ads://metrics", mimeType: "application/json",
      text: JSON.stringify({
        performance: ["impressions", "clicks", "spend", "reach", "frequency", "unique_clicks", "unique_impressions"],
        engagement: ["cpc", "cpm", "ctr", "cpp", "unique_ctr", "cost_per_unique_click"],
        conversions: ["conversions", "conversion_values", "cost_per_action_type", "actions", "action_values", "cost_per_unique_action_type"],
        video: ["video_play_actions", "video_avg_time_watched_actions", "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions", "video_p100_watched_actions", "video_thruplay_watched_actions"],
        attribution: ["1d_click", "7d_click", "28d_click", "1d_view", "7d_view"],
        breakdowns: { demographic: ["age", "gender", "country", "region"], placement: ["publisher_platform", "platform_position"], device: ["impression_device", "device_platform"] },
      }),
    }],
  }),
  "meta-ads://objectives": () => ({
    contents: [{
      uri: "meta-ads://objectives", mimeType: "application/json",
      text: JSON.stringify({
        objectives: [
          { id: "OUTCOME_AWARENESS", name: "Awareness", description: "Reach people who are most likely to remember your ads" },
          { id: "OUTCOME_TRAFFIC", name: "Traffic", description: "Send people to a destination like a website or app" },
          { id: "OUTCOME_ENGAGEMENT", name: "Engagement", description: "Get more messages, video views, post engagement, or Page likes" },
          { id: "OUTCOME_LEADS", name: "Leads", description: "Collect leads for your business via instant forms, messages, calls, or signups" },
          { id: "OUTCOME_APP_PROMOTION", name: "App Promotion", description: "Get people to install or take action in your app" },
          { id: "OUTCOME_SALES", name: "Sales", description: "Find people likely to purchase your product or service" },
        ],
        bidStrategies: ["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP"],
        billingEvents: ["IMPRESSIONS", "LINK_CLICKS", "POST_ENGAGEMENT", "THRUPLAY"],
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
      sendResponse(id, { protocolVersion: "2024-11-05", capabilities: CAPABILITIES, serverInfo: SERVER_INFO });
      break;
    case "notifications/initialized": break;
    case "tools/list":
      sendResponse(id, { tools: TOOLS });
      break;
    case "tools/call": {
      const { name, arguments: args } = params;
      const handler = TOOL_HANDLERS[name];
      if (!handler) { sendError(id, -32602, `Unknown tool: ${name}`); return; }
      try {
        const result = await handler(args || {});
        sendResponse(id, result);
      } catch (err) {
        sendResponse(id, errorResult(`${name} failed: ${err.message}`));
      }
      break;
    }
    case "resources/list":
      sendResponse(id, { resources: RESOURCES });
      break;
    case "resources/read": {
      const { uri } = params;
      const h = RESOURCE_HANDLERS[uri];
      if (!h) { sendError(id, -32602, `Unknown resource: ${uri}`); return; }
      sendResponse(id, h());
      break;
    }
    case "ping": sendResponse(id, {}); break;
    default: if (id !== undefined) sendError(id, -32601, `Method not found: ${method}`);
  }
}

// ============================================
// STDIO TRANSPORT
// ============================================

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on("line", (line) => {
  if (!line.trim()) return;
  try { const msg = JSON.parse(line); handleRequest(msg.method, msg.params || {}, msg.id); }
  catch (err) { sendError(null, -32700, `Parse error: ${err.message}`); }
});
rl.on("close", () => process.exit(0));
process.stderr.write(`${SERVER_INFO.name} v${SERVER_INFO.version} running on stdio (${TOOLS.length} tools)\n`);
