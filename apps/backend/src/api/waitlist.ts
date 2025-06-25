import { zValidator } from "@hono/zod-validator";
import { getPatientWaitlistsSchema } from "@zerocancer/shared";
import type {
  TErrorResponse,
  TGetPatientWaitlistsResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { authMiddleware } from "src/middleware/auth.middleware";

export const waitlistApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Middleware to ensure user is authenticated as patient
waitlistApp.use(authMiddleware(["patient"]));

// Move to the appointment app if needed - it's particular to patients not the general api
// GET /api/waitlist - Get patient's waitlist entries
waitlistApp.get(
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
