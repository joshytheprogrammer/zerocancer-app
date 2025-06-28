import { zValidator } from "@hono/zod-validator";
import type {
  TErrorResponse,
  TGetAllWaitlistsResponse,
  TGetPatientWaitlistsResponse,
  TJoinWaitlistResponse,
} from "@zerocancer/shared";
import {
  getAllWaitlistsSchema,
  getPatientWaitlistsSchema,
  joinWaitlistSchema,
} from "@zerocancer/shared";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { z } from "zod";
import { CryptoUtils } from "../lib/crypto.utils";
import { getDB } from "../lib/db";
import { THonoAppVariables } from "../lib/types";
import { waitlistMatcherAlg } from "../lib/utils";
import { authMiddleware } from "../middleware/auth.middleware";

export const waitlistApp = new Hono<{
  Variables: THonoAppVariables;
}>();

const db = getDB();

// Apply auth middleware to all patient routes
waitlistApp.use("/patient/*", authMiddleware(["patient"]));

// ========================================
// PATIENT WAITLIST MANAGEMENT
// ========================================

// GET /api/waitlist/patient - Get patient's waitlists
waitlistApp.get(
  "/patient",
  zValidator("query", getPatientWaitlistsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid query parameters" },
        400
      );
    }
  }),
  async (c) => {
    try {
      const payload = c.get("jwtPayload");
      const userId = payload?.id;
      const { page = 1, pageSize = 20, status } = c.req.valid("query");

      const where = {
        patientId: userId,
        ...(status && { status }),
      };

      const [waitlists, total] = await Promise.all([
        db.waitlist.findMany({
          where,
          include: {
            screening: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            allocation: {
              select: {
                id: true,
                claimedAt: true,
                campaign: {
                  select: {
                    id: true,
                    purpose: true,
                    donor: {
                      select: {
                        id: true,
                        fullName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { joinedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.waitlist.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return c.json<TGetPatientWaitlistsResponse>({
        ok: true,
        data: {
          waitlists: waitlists.map((w) => ({
            id: w.id,
            screeningTypeId: w.screeningTypeId,
            patientId: w.patientId,
            status: w.status,
            joinedAt: w.joinedAt.toISOString(),
            claimedAt: w.claimedAt?.toISOString() || null,
            screeningType: {
              id: w.screening.id,
              name: w.screening.name,
            },
            allocation: w.allocation
              ? {
                  id: w.allocation.id,
                  campaign: {
                    id: w.allocation.campaign.id,
                    purpose: w.allocation.campaign.purpose || "",
                    donor: {
                      id: w.allocation.campaign.donor.id,
                      fullName: w.allocation.campaign.donor.fullName,
                    },
                  },
                }
              : null,
          })),
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Get patient waitlists error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to fetch waitlists" },
        500
      );
    }
  }
);

// GET /api/waitlist/patient/:id - Get specific waitlist entry
waitlistApp.get("/patient/:waitlistId", async (c) => {
  try {
    const payload = c.get("jwtPayload");
    const userId = payload?.id;
    const { waitlistId } = c.req.param();

    const waitlist = await db.waitlist.findFirst({
      where: {
        id: waitlistId,
        patientId: userId,
      },
      include: {
        screening: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        allocation: {
          select: {
            id: true,
            claimedAt: true,
            campaign: {
              select: {
                id: true,
                purpose: true,
                donor: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!waitlist) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Waitlist entry not found" },
        404
      );
    }

    return c.json({
      ok: true,
      data: {
        waitlist: {
          id: waitlist.id,
          screeningTypeId: waitlist.screeningTypeId,
          patientId: waitlist.patientId,
          status: waitlist.status,
          joinedAt: waitlist.joinedAt.toISOString(),
          claimedAt: waitlist.claimedAt?.toISOString() || null,
          screeningType: {
            id: waitlist.screening.id,
            name: waitlist.screening.name,
          },
          allocation: waitlist.allocation
            ? {
                id: waitlist.allocation.id,
                campaign: {
                  id: waitlist.allocation.campaign.id,
                  purpose: waitlist.allocation.campaign.purpose || "",
                  donor: {
                    id: waitlist.allocation.campaign.donor.id,
                    fullName: waitlist.allocation.campaign.donor.fullName,
                  },
                },
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Get waitlist entry error:", error);
    return c.json<TErrorResponse>(
      { ok: false, error: "Failed to fetch waitlist entry" },
      500
    );
  }
});

// GET /api/waitlist/patient/status/:screeningTypeId - Check if patient is already in waitlist for a screening type
waitlistApp.get("/patient/status/:screeningTypeId", async (c) => {
  try {
    const payload = c.get("jwtPayload");
    const userId = payload?.id;
    const { screeningTypeId } = c.req.param();

    const existingWaitlist = await db.waitlist.findFirst({
      where: {
        patientId: userId,
        screeningTypeId,
        status: {
          in: ["PENDING", "MATCHED"],
        },
      },
      include: {
        screening: {
          select: {
            id: true,
            name: true,
          },
        },
        allocation: {
          select: {
            id: true,
            claimedAt: true,
          },
        },
      },
    });

    return c.json({
      ok: true,
      data: {
        inWaitlist: !!existingWaitlist,
        waitlist: existingWaitlist
          ? {
              id: existingWaitlist.id,
              screeningTypeId: existingWaitlist.screeningTypeId,
              patientId: existingWaitlist.patientId,
              status: existingWaitlist.status,
              joinedAt: existingWaitlist.joinedAt.toISOString(),
              claimedAt: existingWaitlist.claimedAt?.toISOString() || null,
              screeningType: {
                id: existingWaitlist.screening.id,
                name: existingWaitlist.screening.name,
              },
              allocation: existingWaitlist.allocation
                ? {
                    id: existingWaitlist.allocation.id,
                    campaign: null, // Simplified for status check
                  }
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Check waitlist status error:", error);
    return c.json<TErrorResponse>(
      { ok: false, error: "Failed to check waitlist status" },
      500
    );
  }
});

// POST /api/waitlist/patient/join - Join waitlist
waitlistApp.post(
  "/patient/join",
  zValidator("json", joinWaitlistSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid request data" },
        400
      );
    }
  }),
  async (c) => {
    try {
      const payload = c.get("jwtPayload");
      const userId = payload?.id;
      const { screeningTypeId } = c.req.valid("json");

      // Check if screening type exists
      const screeningType = await db.screeningType.findUnique({
        where: { id: screeningTypeId },
      });

      if (!screeningType) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Screening type not found" },
          404
        );
      }

      // Check if already in waitlist for this screening type
      const existingWaitlist = await db.waitlist.findFirst({
        where: {
          patientId: userId,
          screeningTypeId,
          status: {
            in: ["PENDING", "MATCHED"],
          },
        },
      });

      if (existingWaitlist) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Already in waitlist for this screening type",
          },
          400
        );
      }

      // Create waitlist entry
      const waitlist = await db.waitlist.create({
        data: {
          patientId: userId!,
          screeningTypeId: screeningTypeId!,
          status: "PENDING",
        },
        include: {
          screening: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      return c.json<TJoinWaitlistResponse>({
        ok: true,
        data: {
          waitlist: {
            id: waitlist.id,
            screeningTypeId: waitlist.screeningTypeId,
            patientId: waitlist.patientId,
            status: waitlist.status,
          },
        },
      });
    } catch (error) {
      console.error("Join waitlist error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to join waitlist" },
        500
      );
    }
  }
);

// ========================================
// PUBLIC WAITLIST BROWSING
// ========================================

// GET /api/waitlist - Get all waitlists (public endpoint for browsing)
waitlistApp.get(
  "/",
  zValidator("query", getAllWaitlistsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid query parameters" },
        400
      );
    }
  }),
  async (c) => {
    try {
      const {
        page = 1,
        pageSize = 20,
        demandOrder = "desc",
      } = c.req.valid("query");

      // Get waitlist aggregation by screening type
      const waitlistStats = await db.waitlist.groupBy({
        by: ["screeningTypeId"],
        where: {
          status: "PENDING",
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: demandOrder,
          },
        },
      });

      // Get screening type details for the aggregated data
      const screeningTypeIds = waitlistStats.map(
        (stat) => stat.screeningTypeId
      );
      const screeningTypes = await db.screeningType.findMany({
        where: {
          id: {
            in: screeningTypeIds,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      // Combine stats with screening type details
      const waitlistData = waitlistStats
        .map((stat) => {
          const screeningType = screeningTypes.find(
            (st) => st.id === stat.screeningTypeId
          );
          return screeningType
            ? {
                screeningTypeId: stat.screeningTypeId,
                screeningType: {
                  id: screeningType.id,
                  name: screeningType.name,
                },
                pendingCount: stat._count.id,
                totalCount: stat._count.id,
                demand: stat._count.id,
              }
            : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .slice((page - 1) * pageSize, page * pageSize);

      const total = waitlistStats.length;
      const totalPages = Math.ceil(total / pageSize);

      return c.json<TGetAllWaitlistsResponse>({
        ok: true,
        data: {
          waitlists: waitlistData,
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Get all waitlists error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to fetch waitlists" },
        500
      );
    }
  }
);

// ========================================
// WAITLIST MATCHING WEBHOOKS
// ========================================

// Webhook schema for triggering waitlist matching
const triggerMatchingSchema = z.object({
  signature: z.string().optional(),
  timestamp: z.string().optional(),
  force: z.boolean().optional().default(false),
});

// POST /api/waitlist/trigger-matching - Trigger waitlist matching algorithm
waitlistApp.post(
  "/trigger-matching",
  zValidator("json", triggerMatchingSchema),
  async (c) => {
    try {
      const { signature, timestamp, force } = c.req.valid("json");
      const { WAITLIST_WEBHOOK_SECRET } = env<{
        WAITLIST_WEBHOOK_SECRET?: string;
      }>(c, "node");

      // Verify webhook signature if secret is configured
      if (WAITLIST_WEBHOOK_SECRET && signature && timestamp) {
        const body = JSON.stringify(c.req.valid("json"));
        const isValid = CryptoUtils.verifyWebhookSignature(
          body,
          signature,
          WAITLIST_WEBHOOK_SECRET
        );

        if (!isValid) {
          return c.json(
            {
              ok: false,
              error: "Invalid webhook signature",
            },
            401
          );
        }

        // Check timestamp to prevent replay attacks (within 5 minutes)
        const requestTime = new Date(timestamp).getTime();
        const currentTime = Date.now();
        const timeDiff = Math.abs(currentTime - requestTime);

        if (timeDiff > 5 * 60 * 1000) {
          // 5 minutes
          return c.json(
            {
              ok: false,
              error: "Request timestamp too old",
            },
            401
          );
        }
      }

      console.log("Triggering waitlist matching algorithm...");
      const startTime = Date.now();

      // Run the matching algorithm
      await waitlistMatcherAlg();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Waitlist matching completed in ${duration}ms`);

      return c.json({
        ok: true,
        message: "Waitlist matching algorithm executed successfully",
        data: {
          executionTime: duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Waitlist matching error:", error);
      return c.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to execute waitlist matching",
        },
        500
      );
    }
  }
);

// GET /api/waitlist/matching-status - Get basic status/health check
waitlistApp.get("/matching-status", async (c) => {
  try {
    // Simple health check - could be extended to show last run time, stats, etc.
    return c.json({
      ok: true,
      status: "healthy",
      message: "Waitlist matching service is operational",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        ok: false,
        error: "Service unavailable",
      },
      500
    );
  }
});

// POST /api/waitlist/manual-trigger - Manual trigger for admins (with auth middleware)
waitlistApp.post("/manual-trigger", authMiddleware(["admin"]), async (c) => {
  try {
    const payload = c.get("jwtPayload");
    console.log(
      `Manual waitlist matching triggered by admin: ${payload?.email} (${payload?.id})`
    );

    const startTime = Date.now();
    await waitlistMatcherAlg();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Manual waitlist matching completed in ${duration}ms`);

    return c.json({
      ok: true,
      message: "Manual waitlist matching executed successfully",
      data: {
        executionTime: duration,
        timestamp: new Date().toISOString(),
        triggeredBy: {
          adminId: payload?.id || "unknown",
          adminEmail: payload?.email || "unknown",
        },
      },
    });
  } catch (error) {
    console.error("Manual waitlist matching error:", error);
    return c.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute manual waitlist matching",
      },
      500
    );
  }
});

// GET /api/waitlist/matching-stats - Get matching statistics for admin dashboard
waitlistApp.get("/matching-stats", authMiddleware(["admin"]), async (c) => {
  try {
    const [pendingCount, matchedCount, totalCampaigns, activeCampaigns] =
      await Promise.all([
        db.waitlist.count({ where: { status: "PENDING" } }),
        db.waitlist.count({ where: { status: "MATCHED" } }),
        db.donationCampaign.count(),
        db.donationCampaign.count({ where: { status: "ACTIVE" } }),
      ]);

    // Get recent matching activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentMatches = await db.waitlist.count({
      where: {
        status: "MATCHED",
        claimedAt: { gte: yesterday },
      },
    });

    return c.json({
      ok: true,
      data: {
        pending: pendingCount,
        matched: matchedCount,
        recentMatches,
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get matching stats error:", error);
    return c.json(
      {
        ok: false,
        error: "Failed to fetch matching statistics",
      },
      500
    );
  }
});

export default waitlistApp;
