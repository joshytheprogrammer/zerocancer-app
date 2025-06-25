import { PrismaClient } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";
import bcrypt from "bcryptjs";
import { getDB } from "./db";

export async function getUserWithProfiles({ email }: { email: string }) {
  const db = getDB();
  const user = await db.user.findUnique({
    where: { email: email! },
    include: {
      donorProfile: { select: { id: true } },
      patientProfile: { select: { id: true } },
    },
  });
  //   if (!user)
  //     return {
  //       user: null,
  //       profiles: [],
  //     };

  const userProfiles: ("PATIENT" | "DONOR")[] = [];
  if (user?.donorProfile) {
    userProfiles.push("DONOR");
  }
  if (user?.patientProfile) {
    userProfiles.push("PATIENT");
  }
  return { user, profiles: userProfiles };
}

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};



/**
 * Rules for waitlistMatcherAlg:
  ZeroCancer Matching Algorithm (Finalized)
    - For each screening type, get the first 10 PENDING waitlist entries (FCFS).
    - For each patient:
      - Skip if the patient already has 3 unclaimed (MATCHED, not CLAIMED) allocations.
      - Skip if the patient already has a MATCHED allocation for this screening type.
      - Find all ACTIVE campaigns that support this screening type (via the many-to-many relation).
    - Prioritize campaigns:
      - Most specific (campaigns with only this screening type > campaigns with multiple types).
      - If tied, pick the one with the highest availableAmount.
      - If still tied, pick the earliest created.
      - If no campaign matches, and the general pool campaign (id = 'general-donor-pool') exists and has availableAmount, match to the general pool.
      - Skip if no campaign (including general pool) can fund the screening.
    - If matched:
      - Update waitlist status to MATCHED.
      - Create a DonationAllocation.
      - Decrement availableAmount and increment reservedAmount on the campaign.
 */

/**
 * Matches patients on the waitlist to available donation campaigns.
 * Should be called periodically (e.g., every hour by a scheduler).
 *
 * - For each screening type, get all PENDING waitlist entries (FCFS order).
 * - For each, try to match to an ACTIVE campaign for that screening type.
 * - If matched, update waitlist status and create allocation.
 * - Honors max 3 unclaimed allocations per patient, skips if already matched for this screening type.
 * - Prioritizes most specific campaign, then highest availableAmount, then earliest created.
 * - Falls back to general pool if no specific campaign matches.
 */
export async function waitlistMatcherAlg() {
  const db = getDB();
  // Get all screening types
  const screeningTypes = await db.screeningType.findMany();
  for (const screening of screeningTypes) {
    // Get first 10 PENDING waitlist entries for this screening type
    const waitlistQueue = await db.waitlist.findMany({
      where: { screeningTypeId: screening.id, status: "PENDING" },
      orderBy: { joinedAt: "asc" },
      take: 10,
    });
    if (waitlistQueue.length === 0) continue;
    for (const waitlist of waitlistQueue) {
      // 1. Skip if patient has 3 unclaimed allocations
      /**
       * NOTE TO SELF: if all the 10 waitlist entries picked have 3 unclaimed allocations, this will skip all of them.
       * This is by design to prevent over-matching patients who already have allocations. So FIX this issue later.
       */
      const unclaimedCount = await db.donationAllocation.count({
        where: {
          patientId: waitlist.patientId,
          claimedAt: null,
        },
      });
      if (unclaimedCount >= 3) continue;
      // 2. Skip if already matched for this screening type
      const alreadyMatched = await db.waitlist.findFirst({
        where: {
          patientId: waitlist.patientId,
          screeningTypeId: screening.id,
          status: "MATCHED",
        },
      });
      if (alreadyMatched) continue;
      // 3. Find all active campaigns supporting this screening type
      const campaigns = await db.donationCampaign.findMany({
        where: {
          status: "ACTIVE",
          screeningTypes: { some: { id: screening.id } },
          availableAmount: { gt: 0 },
        },
        include: { screeningTypes: true },
        orderBy: [{ createdAt: "asc" }],
      });
      // 4. Prioritize: most specific (fewest screeningTypes), then highest availableAmount, then earliest created
      campaigns.sort((a, b) => {
        if (a.screeningTypes.length !== b.screeningTypes.length) {
          return a.screeningTypes.length - b.screeningTypes.length;
        }
        if (b.availableAmount !== a.availableAmount) {
          return b.availableAmount - a.availableAmount;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      let matchedCampaign = campaigns[0];
      // 5. If no campaign, try general pool
      if (!matchedCampaign) {
        const generalPool = await db.donationCampaign.findMany({
          where: {
            id: "general-donor-pool",
            status: "ACTIVE",
            availableAmount: { gt: 0 },
            screeningTypes: { some: { id: screening.id } },
          },
          include: { screeningTypes: true },
        });
        if (generalPool.length > 0) {
          matchedCampaign = generalPool[0];
        }
      }
      if (!matchedCampaign) continue;
      // 6. Use transaction to update campaign, waitlist, and create allocation
      await db.$transaction([
        db.donationCampaign.update({
          where: { id: matchedCampaign.id },
          data: {
            availableAmount: { decrement: 1 }, // TODO: use actual screening cost
            reservedAmount: { increment: 1 },
          },
        }),
        db.waitlist.update({
          where: { id: waitlist.id },
          data: { status: "MATCHED" },
        }),
        db.donationAllocation.create({
          data: {
            waitlistId: waitlist.id,
            patientId: waitlist.patientId,
            campaignId: matchedCampaign.id,
          },
        }),
      ]);
      await Promise.all([
        // Notify patient of match
        createNotificationForUsers({
          type: "MATCHED",
          title: "You have been matched to a donation campaign!",
          message: `You have been matched for a free screening: ${screening.name}. Please check your appointments for details.`,
          userIds: [waitlist.patientId],
          data: {
            screeningTypeId: screening.id,
            campaignId: matchedCampaign.id,
          },
        }),
        // Notify donor of match
        createNotificationForUsers({
          type: "PATIENT_MATCHED",
          title: "A patient has been matched to your campaign!",
          message: `A patient has been matched for a screening: ${screening.name}.`,
          userIds: [matchedCampaign.donorId],
          data: {
            screeningTypeId: screening.id,
            patientId: waitlist.patientId,
            allocation: true,
          },
        }),
      ]);
    }
  }
}

/**
 * Utility to create a notification for one or more users.
 * @param params.type Notification type (e.g., 'MATCHED', 'INFO', etc.)
 * @param params.title Notification title
 * @param params.message Notification message
 * @param params.userIds Array of user IDs to notify
 * @param params.data Optional extra data (object)
 */
export async function createNotificationForUsers({
  type,
  title,
  message,
  userIds,
  data,
}: {
  type: string;
  title: string;
  message: string;
  userIds: string[];
  data?: JsonObject | undefined;
}) {
  const db = getDB();
  return db.notification.create({
    data: {
      type,
      title,
      message,
      data,
      recipients: {
        create: userIds.map((userId) => ({ userId })),
      },
    },
  });
}
// Utility: check if patient can join waitlist for a screening type
export async function canJoinWaitlist(
  db: PrismaClient,
  patientId: string,
  screeningTypeId: string
) {
  // No active (PENDING or MATCHED) waitlist for this screening type
  const active = await db.waitlist.findFirst({
    where: {
      patientId,
      screeningTypeId,
      status: { in: ["PENDING", "MATCHED"] },
    },
  });
  return !active;
}
