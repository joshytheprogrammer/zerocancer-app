import { zValidator } from "@hono/zod-validator";
import { getAllWaitlistsSchema } from "@zerocancer/shared";
import type {
  TErrorResponse,
  TGetAllWaitlistsResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { patientWaitlistApp } from "./patient.waitlist";

export const waitlistsApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Route to patient-specific waitlist endpoints
waitlistsApp.route("/patient", patientWaitlistApp);

// Future admin waitlist endpoints can be added here
// waitlistApp.route("/admin", adminWaitlistApp);

// GET /api/waitlist - List all waitlists with demand metrics (paginated)
waitlistsApp.get(
  "/",
  zValidator("query", getAllWaitlistsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const {
      page = 1,
      pageSize = 20,
      demandOrder = "desc",
    } = c.req.valid("query");

    // Get waitlist data grouped by screening type with demand metrics
    const waitlistsData = await db.waitlist.groupBy({
      by: ["screeningTypeId"],
      _count: {
        _all: true,
      },
      where: {
        status: "PENDING",
      },
    });

    // Sort by demand (pending count) and apply pagination
    const sortedWaitlists = waitlistsData.sort((a, b) => {
      const countA = a._count?._all || 0;
      const countB = b._count?._all || 0;
      return demandOrder === "desc" ? countB - countA : countA - countB;
    });

    // Apply pagination
    const paginatedWaitlists = sortedWaitlists.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    // Get total count for pagination
    const totalUniqueScreeningTypes = waitlistsData.length;

    // Get screening type details
    const screeningTypeIds = paginatedWaitlists.map((w) => w.screeningTypeId);
    const screeningTypes = await db.screeningType.findMany({
      where: {
        id: { in: screeningTypeIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Also get total counts (including all statuses) for each screening type
    const totalCounts = await db.waitlist.groupBy({
      by: ["screeningTypeId"],
      _count: {
        _all: true,
      },
      where: {
        screeningTypeId: { in: screeningTypeIds },
      },
    });

    // Format the response
    const formattedWaitlists = paginatedWaitlists.map((waitlist) => {
      const screeningType = screeningTypes.find(
        (st) => st.id === waitlist.screeningTypeId
      );
      const totalCount =
        totalCounts.find(
          (tc) => tc.screeningTypeId === waitlist.screeningTypeId
        )?._count?._all || 0;
      const pendingCount = waitlist._count?._all || 0;

      return {
        screeningTypeId: waitlist.screeningTypeId,
        screeningType: {
          id: screeningType?.id || waitlist.screeningTypeId,
          name: screeningType?.name || "Unknown Screening Type",
        },
        pendingCount,
        totalCount,
        demand: pendingCount, // Same as pendingCount for clarity
      };
    });

    return c.json<TGetAllWaitlistsResponse>({
      ok: true,
      data: {
        waitlists: formattedWaitlists,
        page,
        pageSize,
        total: totalUniqueScreeningTypes,
        totalPages: Math.ceil(totalUniqueScreeningTypes / pageSize),
      },
    });
  }
);
