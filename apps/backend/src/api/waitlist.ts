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
import { getDB } from "../lib/db";
import { THonoAppVariables } from "../lib/types";
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

export default waitlistApp;
