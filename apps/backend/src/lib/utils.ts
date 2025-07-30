import { JsonObject } from "@prisma/client/runtime/library";
import { TDonationCampaign, TtriggerMatchingParams } from "@zerocancer/shared";
import bcrypt from "bcryptjs";
// import { createComputeClient } from "./compute-client";
import { getDB } from "./db";
import { sendNotificationEmail } from "./email";
import { waitlistMatcherAlg } from "./waitlistMatchingAlg";

export function generateHexId(length: number = 6) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
 * Utility to create a notification for one or more users.
 *
 * This function handles both in-app notifications and optional email notifications
 * for important events like successful matching between patients and donors.
 *
 * Notification Types:
 * - MATCHED: Patient successfully matched to a campaign
 * - PATIENT_MATCHED: Donor notified about patient match
 * - INFO: General information notifications
 * - WARNING: Important warnings requiring attention
 *
 * @param params.type Notification type (e.g., 'MATCHED', 'INFO', etc.)
 * @param params.title Notification title for display
 * @param params.message Detailed notification message
 * @param params.userIds Array of user IDs to notify
 * @param params.data Optional extra data (screening details, campaign info, etc.)
 * @param email Whether to send email notifications in addition to in-app
 * @returns Promise<Notification> Created notification object
 */
export async function createNotificationForUsers(
  c: any,
  {
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
  },
  email = false
) {
  const db = getDB(c);

  // Send emails if requested
  if (email) {
    try {
      // Fetch user emails
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, fullName: true },
      });

      const emails = users.map((u) => u.email).filter(Boolean);

      if (emails.length > 0) {
        sendNotificationEmail(c, {
          to: emails,
          type: "INFO",
          title: "New Notification",
          message: "You have a new notification.",
          data: { userIds },
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to send email notifications:", errorMessage);
      // Don't throw error here as we still want to create the notification
    }
  }

  // Create the notification in database
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

export async function triggerWaitlistMatching(
  c: any,
  customConfig?: TtriggerMatchingParams
) {
  /**
   * Create a compute client for triggering the matching algorithm.
   * 
    const computeClient = createComputeClient(c);
    // Trigger the algorithm with custom config (non-blocking)
    await computeClient.triggerMatching(customConfig);
   * 
   * 
   */

  await waitlistMatcherAlg(c, customConfig);

  return {
    ok: true,
    message: "Matching process triggered successfully",
  };
}

export async function getUserWithProfiles(
  c: any,
  { email }: { email: string }
) {
  const db = getDB(c);
  const user = await db.user.findUnique({
    where: { email: email! },
    include: {
      donorProfile: { select: { id: true, emailVerified: true } },
      patientProfile: { select: { id: true, emailVerified: true } },
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

// Helper function to format campaign for API response
export function formatCampaignForResponse(campaign: any): TDonationCampaign {
  let targetGender: "MALE" | "FEMALE" | "ALL" | undefined;

  if (campaign.targetGender === null || campaign.targetGender === undefined) {
    targetGender = "ALL";
  } else if (campaign.targetGender === "MALE") {
    targetGender = "MALE";
  } else {
    targetGender = "FEMALE";
  }

  const patientsHelped = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "COMPLETED" ? 1 : 0);
    },
    0
  );

  const patientAppointmentInProgress = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "IN_PROGRESS" ? 1 : 0);
    },
    0
  );

  const patientAppointmentScheduled = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "IN_PROGRESS" ? 1 : 0);
    },
    0
  );

  const patientPendingAcceptance = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "PENDING" ? 1 : 0);
    },
    0
  );

  return {
    id: campaign.id ?? "unknown-campaign-id",
    donorId: campaign.donorId,
    title: campaign.title || "Untitled Campaign",
    description: campaign.purpose || "",
    fundingAmount: campaign.totalAmount,
    usedAmount: campaign.totalAmount - (campaign.availableAmount || 0),
    targetGender,
    targetAgeMin: campaign.targetAgeRange?.split("-")[0]
      ? parseInt(campaign.targetAgeRange.split("-")[0])
      : undefined,
    targetAgeMax: campaign.targetAgeRange?.split("-")[1]
      ? parseInt(campaign.targetAgeRange.split("-")[1])
      : undefined,
    targetStates: campaign.targetStates || [],
    targetLgas: campaign.targetLgas || [],
    status: campaign.status as
      | "ACTIVE"
      | "COMPLETED"
      | "DELETED"
      | "PENDING"
      | "SUSPENDED",
    expiryDate: campaign.expiryDate?.toISOString() || null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.createdAt.toISOString(),
    donor: {
      id: campaign.donor.id,
      fullName: campaign.donor.fullName,
      email: campaign.donor.email,
      organizationName: campaign.donor.donorProfile?.organizationName,
    },
    screeningTypes: campaign.screeningTypes || [],
    patientAllocations: {
      patientsHelped,
      patientPendingAcceptance,
      patientAppointmentInProgress,
      patientAppointmentScheduled,
      allocationsCount: campaign.allocations?.length || 0,
    },
  };
}
