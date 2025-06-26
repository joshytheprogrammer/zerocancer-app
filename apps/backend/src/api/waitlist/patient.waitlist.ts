import { zValidator } from "@hono/zod-validator";
import { getPatientWaitlistsSchema, joinWaitlistSchema } from "@zerocancer/shared";
import type {
  TErrorResponse,
  TGetPatientWaitlistsResponse,
  TJoinWaitlistResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { canJoinWaitlist } from "src/lib/utils";
import { authMiddleware } from "src/middleware/auth.middleware";

export const patientWaitlistApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Middleware to ensure user is authenticated as patient
patientWaitlistApp.use(authMiddleware(["patient"]));

// GET /api/waitlist/patient - Get patient's waitlist entries
patientWaitlistApp.get(
  "/",
  zValidator("query", getPatientWaitlistsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    const patientId = payload?.id!;
    const { page = 1, pageSize = 20, status } = c.req.valid("query");

    const where: any = { patientId: patientId! };
    if (status) where.status = status;

    const [waitlists, total] = await Promise.all([
      db.waitlist.findMany({
        where,
        skip: (page! - 1) * pageSize!,
        take: pageSize!,
        orderBy: { joinedAt: "desc" },
        include: {
          screening: {
            select: { id: true, name: true },
          },
          allocation: {
            include: {
              campaign: {
                select: { id: true, purpose: true },
              },
            },
          },
        },
      }),
      db.waitlist.count({ where }),
    ]);

    const formattedWaitlists = waitlists.map((waitlist) => ({
      id: waitlist.id,
      screeningTypeId: waitlist.screeningTypeId,
      patientId: waitlist.patientId,
      status: waitlist.status.toString(),
      joinedAt: waitlist.joinedAt.toISOString(),
      claimedAt: waitlist.claimedAt ? waitlist.claimedAt.toISOString() : null,
      screeningType: {
        id: waitlist.screening.id,
        name: waitlist.screening.name,
      },
      allocation: waitlist.allocation
        ? {
            id: waitlist.allocation.id,
            campaign: {
              id: waitlist.allocation.campaign.id,
              purpose:
                waitlist.allocation.campaign.purpose || "General donation",
            },
          }
        : null,
    }));

    return c.json<TGetPatientWaitlistsResponse>({
      ok: true,
      data: {
        waitlists: formattedWaitlists!,
        page: page!,
        pageSize: pageSize!,
        total: total!,
        totalPages: Math.ceil(total / pageSize!),
      },
    });
  }
);

// POST /api/waitlist/patient/join
patientWaitlistApp.post(
  "/join",
  zValidator("json", joinWaitlistSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    console.log("join waitlist");
    const { screeningTypeId } = c.req.valid("json");

    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json({ ok: false, message: "Unauthorized" }, 401);
    }

    const patientId = payload.id!; // Assuming JWT payload contains userId
    if (!patientId) {
      return c.json({ ok: false, message: "User ID not found in token" }, 401);
    }

    // Check eligibility to join waitlist
    const canJoin = await canJoinWaitlist(db, patientId, screeningTypeId!);
    if (!canJoin) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error:
            "You already have an active waitlist entry for this screening type.",
          err_code: "WAITLIST_ALREADY_EXISTS",
        },
        400
      );
    }

    // Create waitlist entry
    const waitlist = await db.waitlist.create({
      data: {
        screeningTypeId: screeningTypeId!,
        patientId: patientId!,
        status: "PENDING",
      },
    });

    return c.json<TJoinWaitlistResponse>({ ok: true, data: { waitlist } });
  }
);
