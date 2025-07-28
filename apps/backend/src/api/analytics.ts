import { zValidator } from "@hono/zod-validator";
import type {
  TCampaignAnalyticsResponse,
  TCenterPerformanceResponse,
  TDashboardMetricsResponse,
  TErrorResponse,
  TGeographicReportResponse,
  TTimeBasedReportResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { TEnvs, THonoApp } from "src/lib/types";
import { z } from "zod";
import { createComputeClient } from "../lib/compute-client";

const analyticsApp = new Hono<THonoApp>();

// Validation schemas
const timeReportQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const centerReportQuerySchema = z.object({
  centerId: z.string().optional(),
});

// GET /api/analytics/dashboard - Main dashboard metrics
analyticsApp.get("/dashboard", async (c) => {
  try {
    const { COMPUTE_SERVICE_URL } = env<TEnvs>(c);
    const computeClient = createComputeClient(
      COMPUTE_SERVICE_URL || "http://localhost:8788"
    );

    const response = await computeClient.getDashboardMetrics();
    return c.json(response);
  } catch (error) {
    console.error(
      "Failed to get dashboard metrics from compute service:",
      error
    );
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to fetch dashboard metrics",
      },
      500
    );
  }
});

// GET /api/analytics/reports/time - Time-based reports
analyticsApp.get(
  "/reports/time",
  zValidator("query", timeReportQuerySchema),
  async (c) => {
    try {
      const { period, from, to } = c.req.valid("query");
      const { COMPUTE_SERVICE_URL } = env<TEnvs>(c);
      const computeClient = createComputeClient(
        COMPUTE_SERVICE_URL || "http://localhost:8788"
      );

      const response = await computeClient.getTimeBasedReport({
        period,
        from,
        to,
      });

      return c.json(response);
    } catch (error) {
      console.error(
        "Failed to get time-based report from compute service:",
        error
      );
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to fetch time-based report",
        },
        500
      );
    }
  }
);

// GET /api/analytics/geographic - Geographic analytics
analyticsApp.get("/geographic", async (c) => {
  try {
    const { COMPUTE_SERVICE_URL } = env<TEnvs>(c);
    const computeClient = createComputeClient(
      COMPUTE_SERVICE_URL || "http://localhost:8788"
    );

    const response = await computeClient.getGeographicReport();
    return c.json(response);
  } catch (error) {
    console.error(
      "Failed to get geographic report from compute service:",
      error
    );
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to fetch geographic report",
      },
      500
    );
  }
});

// GET /api/analytics/centers - Center performance
analyticsApp.get(
  "/centers",
  zValidator("query", centerReportQuerySchema),
  async (c) => {
    try {
      const { centerId } = c.req.valid("query");
      const { COMPUTE_SERVICE_URL } = env<TEnvs>(c);
      const computeClient = createComputeClient(
        COMPUTE_SERVICE_URL || "http://localhost:8788"
      );

      const response = await computeClient.getCenterPerformanceReport({
        centerId,
      });

      return c.json(response);
    } catch (error) {
      console.error(
        "Failed to get center performance report from compute service:",
        error
      );
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to fetch center performance report",
        },
        500
      );
    }
  }
);

// GET /api/analytics/campaigns - Campaign analytics
analyticsApp.get("/campaigns", async (c) => {
  try {
    const { COMPUTE_SERVICE_URL } = env<TEnvs>(c);
    const computeClient = createComputeClient(
      COMPUTE_SERVICE_URL || "http://localhost:8788"
    );

    const response = await computeClient.getCampaignAnalytics();
    return c.json(response);
  } catch (error) {
    console.error(
      "Failed to get campaign analytics from compute service:",
      error
    );
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to fetch campaign analytics",
      },
      500
    );
  }
});

export default analyticsApp;
