#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "meta-ads-mcp",
  version: "1.0.0",
  description: "MCP server for Meta Ads (Facebook & Instagram) integration - Litper Pro",
});

// ============================================
// TOOLS
// ============================================

server.tool(
  "get_ad_accounts",
  "List all ad accounts associated with the Meta Business account",
  {
    businessId: z
      .string()
      .optional()
      .describe("Meta Business ID (uses default if not provided)"),
  },
  async ({ businessId }) => {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message:
                "META_ADS_ACCESS_TOKEN not configured. Set it in the environment variables.",
            }),
          },
        ],
      };
    }

    try {
      const url = businessId
        ? `https://graph.facebook.com/v21.0/${businessId}/adaccounts?fields=id,name,account_status,currency,balance&access_token=${accessToken}`
        : `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status,currency,balance&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { status: "success", accounts: data.data || [], paging: data.paging },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: `Failed to fetch ad accounts: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_campaigns",
  "Get campaigns for a Meta Ads account with performance metrics",
  {
    adAccountId: z
      .string()
      .describe("Ad account ID (format: act_XXXXXXXXX)"),
    status: z
      .enum(["ACTIVE", "PAUSED", "ARCHIVED", "ALL"])
      .default("ALL")
      .describe("Filter campaigns by status"),
    limit: z.number().default(25).describe("Number of campaigns to return"),
  },
  async ({ adAccountId, status, limit }) => {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: "META_ADS_ACCESS_TOKEN not configured.",
            }),
          },
        ],
      };
    }

    try {
      const fields =
        "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time";
      let url = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

      if (status !== "ALL") {
        url += `&filtering=[{"field":"effective_status","operator":"IN","value":["${status}"]}]`;
      }

      const response = await fetch(url);
      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                adAccountId,
                campaigns: data.data || [],
                paging: data.paging,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: `Failed to fetch campaigns: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_ad_insights",
  "Get performance insights/metrics for campaigns, ad sets, or ads",
  {
    objectId: z
      .string()
      .describe("ID of the campaign, ad set, or ad account (act_XXX)"),
    datePreset: z
      .enum([
        "today",
        "yesterday",
        "last_7d",
        "last_14d",
        "last_30d",
        "this_month",
        "last_month",
        "this_quarter",
        "maximum",
      ])
      .default("last_7d")
      .describe("Date range preset"),
    metrics: z
      .array(z.string())
      .default([
        "impressions",
        "clicks",
        "spend",
        "cpc",
        "cpm",
        "ctr",
        "conversions",
        "cost_per_action_type",
      ])
      .describe("Metrics to retrieve"),
    breakdowns: z
      .array(z.enum(["age", "gender", "country", "platform_position", "publisher_platform"]))
      .optional()
      .describe("Breakdown dimensions"),
    level: z
      .enum(["account", "campaign", "adset", "ad"])
      .default("campaign")
      .describe("Aggregation level"),
  },
  async ({ objectId, datePreset, metrics, breakdowns, level }) => {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: "META_ADS_ACCESS_TOKEN not configured.",
            }),
          },
        ],
      };
    }

    try {
      const fields = metrics.join(",");
      let url = `https://graph.facebook.com/v21.0/${objectId}/insights?fields=${fields}&date_preset=${datePreset}&level=${level}&access_token=${accessToken}`;

      if (breakdowns && breakdowns.length > 0) {
        url += `&breakdowns=${breakdowns.join(",")}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                objectId,
                datePreset,
                level,
                insights: data.data || [],
                paging: data.paging,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: `Failed to fetch insights: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_daily_spend",
  "Get daily ad spend for a date range, useful for budget tracking and ROAS calculations",
  {
    adAccountId: z
      .string()
      .describe("Ad account ID (format: act_XXXXXXXXX)"),
    since: z.string().describe("Start date (YYYY-MM-DD)"),
    until: z.string().describe("End date (YYYY-MM-DD)"),
  },
  async ({ adAccountId, since, until }) => {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: "META_ADS_ACCESS_TOKEN not configured.",
            }),
          },
        ],
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${adAccountId}/insights?fields=spend,impressions,clicks,actions,cost_per_action_type&time_range={"since":"${since}","until":"${until}"}&time_increment=1&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      const dailyData = (data.data || []).map((day) => ({
        date: day.date_start,
        spend: parseFloat(day.spend || "0"),
        impressions: parseInt(day.impressions || "0"),
        clicks: parseInt(day.clicks || "0"),
        conversions: (day.actions || []).filter(
          (a) => a.action_type === "offsite_conversion"
        ).length,
      }));

      const totalSpend = dailyData.reduce((sum, d) => sum + d.spend, 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                adAccountId,
                dateRange: { since, until },
                totalSpend,
                currency: "COP",
                dailyBreakdown: dailyData,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: `Failed to fetch daily spend: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_audiences",
  "Get custom and lookalike audiences for an ad account",
  {
    adAccountId: z
      .string()
      .describe("Ad account ID (format: act_XXXXXXXXX)"),
  },
  async ({ adAccountId }) => {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: "META_ADS_ACCESS_TOKEN not configured.",
            }),
          },
        ],
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${adAccountId}/customaudiences?fields=id,name,approximate_count_lower_bound,approximate_count_upper_bound,subtype,time_created&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                adAccountId,
                audiences: data.data || [],
                paging: data.paging,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: `Failed to fetch audiences: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

server.tool(
  "calculate_roas",
  "Calculate Return on Ad Spend (ROAS) given revenue and ad spend data",
  {
    adAccountId: z
      .string()
      .describe("Ad account ID (format: act_XXXXXXXXX)"),
    since: z.string().describe("Start date (YYYY-MM-DD)"),
    until: z.string().describe("End date (YYYY-MM-DD)"),
    revenue: z.number().describe("Total revenue for the period (in local currency)"),
  },
  async ({ adAccountId, since, until, revenue }) => {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: "META_ADS_ACCESS_TOKEN not configured.",
            }),
          },
        ],
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${adAccountId}/insights?fields=spend&time_range={"since":"${since}","until":"${until}"}&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      const spend = parseFloat(data.data?.[0]?.spend || "0");
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                adAccountId,
                dateRange: { since, until },
                revenue,
                spend,
                roas: Math.round(roas * 100) / 100,
                roasPercentage: `${Math.round(roas * 100)}%`,
                profitable: roas > 1,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: `Failed to calculate ROAS: ${error.message}`,
            }),
          },
        ],
      };
    }
  }
);

// ============================================
// RESOURCES
// ============================================

server.resource(
  "meta-ads-config",
  "meta-ads://config",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          server: "meta-ads-mcp",
          version: "1.0.0",
          apiVersion: "v21.0",
          configured: !!process.env.META_ADS_ACCESS_TOKEN,
          requiredEnvVars: [
            "META_ADS_ACCESS_TOKEN",
            "META_ADS_APP_ID (optional)",
            "META_ADS_APP_SECRET (optional)",
          ],
        }),
      },
    ],
  })
);

server.resource(
  "available-metrics",
  "meta-ads://metrics",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          performance: [
            "impressions",
            "clicks",
            "spend",
            "reach",
            "frequency",
          ],
          engagement: ["cpc", "cpm", "ctr", "cpp"],
          conversions: [
            "conversions",
            "cost_per_action_type",
            "actions",
            "action_values",
          ],
          video: [
            "video_play_actions",
            "video_avg_time_watched_actions",
            "video_p25_watched_actions",
            "video_p50_watched_actions",
            "video_p75_watched_actions",
            "video_p100_watched_actions",
          ],
        }),
      },
    ],
  })
);

// ============================================
// START SERVER
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("meta-ads-mcp running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
