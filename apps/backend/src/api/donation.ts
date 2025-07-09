import { zValidator } from "@hono/zod-validator";
import { Prisma } from "@prisma/client";
import {
  anonymousDonationSchema,
  createCampaignSchema,
  deleteCampaignSchema,
  fundCampaignSchema,
  getCampaignsSchema,
  paystackWebhookSchema,
  updateCampaignSchema,
} from "@zerocancer/shared";
import type {
  TAnonymousDonationResponse,
  TCreateCampaignResponse,
  TDeleteCampaignResponse,
  TDonationCampaign,
  TErrorResponse,
  TFundCampaignResponse,
  TGetCampaignResponse,
  TGetCampaignsResponse,
  TUpdateCampaignResponse,
} from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { getDB, TDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { createNotificationForUsers } from "src/lib/utils";
import { authMiddleware } from "src/middleware/auth.middleware";
import { z } from "zod";

export const donationApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// ========================================
// HELPER FUNCTIONS
// ========================================

// Helper function to initialize Paystack payment with context-aware callback URLs
export async function initializePaystackPayment(
  c: any,
  data: {
    email: string;
    amount: number; // in kobo
    reference: string;
    paymentType:
      | "anonymous_donation"
      | "campaign_creation"
      | "campaign_funding"
      | "appointment_booking";
    campaignId?: string; // Required for campaign-related payments
    patientId?: string; // Optional for appointment payments
    metadata?: any;
  }
) {
  const { PAYSTACK_SECRET_KEY, FRONTEND_URL } = env<{
    PAYSTACK_SECRET_KEY: string;
    FRONTEND_URL: string;
  }>(c, "node");

  // Generate context-aware callback URL based on payment type
  let callbackUrl: string;

  switch (data.paymentType) {
    case "anonymous_donation":
      callbackUrl = `${FRONTEND_URL}/donation/payment-status?ref=${data.reference}&type=anonymous`;
      break;
    case "campaign_creation":
      if (!data.campaignId)
        throw new Error("Campaign ID required for campaign creation");
      callbackUrl = `${FRONTEND_URL}/donor/campaigns/payment-status?ref=${data.reference}&type=create&campaignId=${data.campaignId}`;
      break;
    case "campaign_funding":
      if (!data.campaignId)
        throw new Error("Campaign ID required for campaign funding");
      callbackUrl = `${FRONTEND_URL}/donor/campaigns/${data.campaignId}/payment-status?ref=${data.reference}&type=fund`;
      break;
    case "appointment_booking":
      if (!data.patientId)
        throw new Error("Patient ID required for appointment payment");
      callbackUrl = `${FRONTEND_URL}/patient/book/payment-status?ref=${data.reference}&type=book&patientId=${data.patientId}`;
      break;
    default:
      throw new Error(`Unknown payment type: ${data.paymentType}`);
  }

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        callback_url: callbackUrl,
        metadata: {
          ...data.metadata,
          payment_type: data.paymentType,
          campaign_id: data.campaignId || null,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to initialize Paystack payment");
  }

  const result = await response.json();
  console.log("Paystack payment initialized:", result.data);
  return result.data;
}

/**
 * 
 * export type TDonationCampaign = {
  id: string;
  donorId: string;
  title: string;
  description: string;
  fundingAmount: number;
  usedAmount: number;
  purpose?: string;
  targetGender?: "MALE" | "FEMALE" | "ALL";
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetStates?: string[];
  targetLgas?: string[];
  status: "ACTIVE" | "COMPLETED" | "DELETED";
  expiryDate: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  donor: {
    id: string;
    fullName: string;
    email: string;
    organizationName?: string;
  };
  screeningTypes: Array<{
    id: string;
    name: string;
  }>;
  patientsHelped: number;
  allocationsCount: number;
}; 
 * 
 */

// Helper function to format campaign for API response
function formatCampaignForResponse(campaign: any): TDonationCampaign {
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

// Helper function to add funds to general donor pool
async function addToGeneralDonorPool(amount: number) {
  const db = getDB();

  // Find or create general donor pool campaign
  let generalPool = await db.donationCampaign.findFirst({
    where: { id: "general-donor-pool" },
  });

  if (!generalPool) {
    // Create general pool if it doesn't exist
    generalPool = await db.donationCampaign.create({
      data: {
        id: "general-donor-pool",
        donorId: "system", // System-managed campaign
        title: "General donation public pool",
        totalAmount: amount,
        availableAmount: amount,
        purpose: "General Donation Pool",
        status: "ACTIVE",
      },
    });
  } else {
    // Add to existing pool
    await db.donationCampaign.update({
      where: { id: "general-donor-pool" },
      data: {
        availableAmount: { increment: amount },
        totalAmount: { increment: amount },
      },
    });
  }
}

// ========================================
// ANONYMOUS DONATION ENDPOINTS
// ========================================

// POST /api/donor/donations/anonymous
donationApp.post(
  "/donations/anonymous",
  zValidator("json", anonymousDonationSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const donationData = c.req.valid("json");

    // Validate required fields
    if (!donationData.amount || donationData.amount < 100) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Invalid donation amount",
        },
        400
      );
    }

    // Determine email for Paystack
    const email = donationData.wantsReceipt
      ? donationData.email!
      : env<{ ANONYMOUS_DONOR_EMAIL: string }>(c, "node")
          .ANONYMOUS_DONOR_EMAIL || "anon-donor@zerocancer.africa";

    // Generate unique reference
    const reference = `donation-anon-${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}`;

    try {
      // Initialize Paystack payment
      const paystackResponse = await initializePaystackPayment(c, {
        email,
        amount: donationData.amount * 100, // Convert to kobo
        reference,
        paymentType: "anonymous_donation",
        metadata: {
          wants_receipt: donationData.wantsReceipt,
          actual_email: donationData.email || null,
          message: donationData.message || null,
        },
      });

      // Create pending transaction record
      await db.transaction.create({
        data: {
          type: "DONATION",
          status: "PENDING",
          amount: donationData.amount,
          paymentReference: reference,
          paymentChannel: "PAYSTACK",
          relatedDonationId: "general-donor-pool", // Anonymous donations go to general pool
        },
      });

      return c.json<TAnonymousDonationResponse>({
        ok: true,
        data: {
          transactionId: reference,
          reference: reference,
          authorizationUrl: paystackResponse.authorization_url,
          accessCode: paystackResponse.access_code,
        },
      });
    } catch (error) {
      console.error("Anonymous donation error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to initialize payment",
        },
        500
      );
    }
  }
);

// ========================================
// WEBHOOK ENDPOINTS
// ========================================

// POST /api/donor/paystack-webhook - Handle Paystack webhook
donationApp.post(
  "/paystack-webhook",
  // Verify webhook signature
  async (c) => {
    const db = getDB();

    try {
      console.log("Received Paystack webhook request");

      // Verify webhook signature
      const signature = c.req.header("x-paystack-signature");

      // Get the raw body
      const rawBody = await c.req.raw.arrayBuffer();
      const rawBodyBuffer = Buffer.from(rawBody);

      const { PAYSTACK_SECRET_KEY } = env<{ PAYSTACK_SECRET_KEY: string }>(
        c,
        "node"
      );

      const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(rawBodyBuffer)
        .digest("hex");

      if (hash !== signature) {
        return c.json({ error: "Invalid signature" }, 401);
      }

      console.log(JSON.parse(rawBodyBuffer.toString()));

      const payload = (await JSON.parse(rawBodyBuffer.toString())) as z.infer<
        typeof paystackWebhookSchema
      >;

      console.log("Received Valid Paystack webhook!!!:", payload);

      if (payload.event === "charge.success") {
        const { data } = payload;

        // Ensure data exists and has required properties
        if (!data || !data.reference || !data.amount) {
          return c.json({ error: "Invalid webhook data" }, 400);
        }

        const { reference, amount, metadata } = data;
        const paymentType = metadata?.payment_type;

        // Update transaction status
        await db.transaction.updateMany({
          where: { paymentReference: reference },
          data: { status: "COMPLETED" },
        });

        if (paymentType === "anonymous_donation") {
          // Add to general donor pool
          console.log("Adding to general donor pool:", amount / 100);
          await addToGeneralDonorPool(amount / 100);
        } else if (paymentType === "campaign_creation" && metadata) {
          console.log("Creating new campaign:", metadata);

          // Update campaign with initial funding
          const campaignId = metadata.campaign_id;
          // const initialFunding = metadata.funding_amount;

          if (campaignId) {
            await db.donationCampaign.update({
              where: { id: campaignId },
              data: {
                totalAmount: { increment: amount },
              },
            });
          }

          // Trigger matching for this campaign
          // TODO: Call matching algorithm
        } else if (paymentType === "campaign_funding" && metadata) {
          console.log("Adding funds to campaign:", metadata.campaign_id);

          // Add funds to existing campaign
          const campaignId = metadata.campaign_id;

          if (campaignId) {
            await db.donationCampaign.update({
              where: { id: campaignId },
              data: {
                availableAmount: { increment: amount / 100 },
              },
            });
          }
        } else if (paymentType === "appointment_booking" && metadata) {
          console.log("Processing appointment booking:", metadata);

          const appointmentId = metadata.appointmentId;

          await db.appointment.update({
            where: { id: appointmentId },
            data: {
              status: "SCHEDULED",
              checkInCode: crypto.randomBytes(6).toString("hex").toUpperCase(),
              checkInCodeExpiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ),
              // paymentReference: reference,
            },
          });
        }

        return c.json({ message: "Webhook processed successfully" });
      }

      return c.json(
        { message: "Event not handled", event: payload.event },
        200
      );
    } catch (error) {
      console.error("Webhook processing error:", error);
      return c.json({ error: "Webhook processing failed" }, 200);
    }
  }
);

// ========================================
// CAMPAIGN MANAGEMENT ENDPOINTS (DONOR AUTH REQUIRED)
// ========================================

// Apply donor authentication middleware for all campaign endpoints
donationApp.use("/campaigns/*", authMiddleware(["donor"]));

// POST /api/donor/campaigns - Create new campaign
donationApp.post(
  "/campaigns",
  zValidator("json", createCampaignSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const campaignData = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const donorId = payload?.id!;

    // Validate required fields
    if (!campaignData.fundingAmount || !campaignData.screeningTypeIds?.length) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Missing required campaign data",
        },
        400
      );
    }

    // Generate campaign reference for payment
    const reference = `campaign-create-${donorId}-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}`;

    try {
      // Get donor profile for email
      const donor = await db.user.findUnique({
        where: { id: donorId },
        include: { donorProfile: true },
      });

      if (!donor) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Donor not found",
          },
          404
        );
      }

      // Validate screening types exist
      const screeningTypes = await db.screeningType.findMany({
        where: { id: { in: campaignData.screeningTypeIds } },
      });

      if (screeningTypes.length !== campaignData.screeningTypeIds.length) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Some screening types not found",
          },
          400
        );
      }

      // Create pending campaign
      const campaign = await db.donationCampaign.create({
        data: {
          donorId: donorId!,
          totalAmount: 0,
          availableAmount: 0, // Will be updated after payment
          title: campaignData.title!,
          purpose: campaignData.description || "",
          targetGender:
            campaignData.targetGender === "ALL"
              ? null
              : campaignData.targetGender === "MALE"
              ? "MALE"
              : "FEMALE",
          targetAgeRange:
            campaignData.targetAgeMin && campaignData.targetAgeMax
              ? `${campaignData.targetAgeMin}-${campaignData.targetAgeMax}`
              : null,
          targetStates: campaignData.targetStates,
          targetLgas: campaignData.targetLgas,
          // Initial status
          status: "PENDING",
          screeningTypes: {
            connect: campaignData.screeningTypeIds.map((id: string) => ({
              id,
            })),
          },
        },
        include: {
          donor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              donorProfile: {
                select: { organizationName: true },
              },
            },
          },
          screeningTypes: {
            select: { id: true, name: true },
          },
          allocations: {
            include: {
              patient: {
                select: { id: true, fullName: true },
              },
              appointment: {
                where: {
                  status: {
                    notIn: ["PENDING", "CANCELLED"],
                  },
                },
              },
            },
          }, // Include allocations to calculate patients helped
        },
      });

      // Initialize Paystack payment for initial funding
      const paystackResponse = await initializePaystackPayment(c, {
        email: donor.email,
        amount: campaignData.fundingAmount * 100, // Convert to kobo
        reference,
        paymentType: "campaign_creation",
        campaignId: campaign.id,
        metadata: {
          donor_id: donorId,
          campaign_id: campaign.id,
          funding_amount: campaignData.fundingAmount,
        },
      });

      // Create pending transaction
      await db.transaction.create({
        data: {
          type: "DONATION",
          status: "PENDING",
          amount: campaignData.fundingAmount,
          paymentReference: reference,
          paymentChannel: "PAYSTACK",
          relatedDonationId: campaign.id,
        },
      });

      // Format response
      const formattedCampaign = formatCampaignForResponse(campaign);

      return c.json<TCreateCampaignResponse>({
        ok: true,
        data: {
          campaign: formattedCampaign,
          payment: {
            transactionId: reference,
            reference: reference,
            authorizationUrl: paystackResponse.authorization_url,
            accessCode: paystackResponse.access_code,
          },
        },
      });
    } catch (error) {
      console.error("Campaign creation error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to create campaign",
        },
        500
      );
    }
  }
);

// GET /api/donor/campaigns - Get donor's campaigns
donationApp.get(
  "/campaigns",
  zValidator("query", getCampaignsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { page = 1, pageSize = 20, status, search } = c.req.valid("query");
    const payload = c.get("jwtPayload");
    const donorId = payload?.id!;

    const where: any = { donorId };
    if (status) where.status = status;
    if (search) {
      where.purpose = { contains: search, mode: "insensitive" };
    }

    try {
      const [campaigns, total] = await Promise.all([
        db.donationCampaign.findMany({
          where,
          include: {
            donor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                donorProfile: {
                  select: { organizationName: true },
                },
              },
            },
            screeningTypes: {
              select: { id: true, name: true },
            },
            allocations: {
              include: {
                patient: {
                  select: { id: true, fullName: true },
                },
                appointment: {
                  where: {
                    status: {
                      notIn: ["PENDING", "CANCELLED"],
                    },
                  },
                },
              },
            }, // Include allocations to calculate patients helped
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.donationCampaign.count({ where }),
      ]);

      const formattedCampaigns = campaigns.map(formatCampaignForResponse);

      return c.json<TGetCampaignsResponse>({
        ok: true,
        data: {
          campaigns: formattedCampaigns,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get campaigns error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to fetch campaigns",
        },
        500
      );
    }
  }
);

// GET /api/donor/campaigns/:id - Get specific campaign details
donationApp.get("/campaigns/:id", async (c) => {
  const db = getDB();
  const campaignId = c.req.param("id");
  const payload = c.get("jwtPayload");
  const donorId = payload?.id!;

  try {
    const campaign = await db.donationCampaign.findFirst({
      where: {
        id: campaignId,
        donorId: donorId,
      },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            donorProfile: {
              select: { organizationName: true },
            },
          },
        },
        screeningTypes: {
          select: { id: true, name: true },
        },
        allocations: {
          include: {
            patient: {
              select: { id: true, fullName: true },
            },
            appointment: {
              where: {
                status: {
                  notIn: ["PENDING", "CANCELLED"],
                },
              },
            },
          },
        }, // Include allocations to calculate patients helped
      },
    });

    if (!campaign) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Campaign not found",
        },
        404
      );
    }

    const formattedCampaign = formatCampaignForResponse(campaign);

    return c.json<TGetCampaignResponse>({
      ok: true,
      data: formattedCampaign,
    });
  } catch (error) {
    console.error("Get campaign error:", error);
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to fetch campaign",
      },
      500
    );
  }
});

// POST /api/donor/campaigns/:id/fund - Add funds to existing campaign
donationApp.post(
  "/campaigns/:id/fund",
  zValidator("json", fundCampaignSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const campaignId = c.req.param("id");
    const fundData = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const donorId = payload?.id!;

    // Validate required fields
    if (!fundData.amount || fundData.amount < 100) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Invalid funding amount",
        },
        400
      );
    }

    try {
      // Get donor profile for email
      const donor = await db.user.findUnique({
        where: { id: donorId },
        include: { donorProfile: true },
      });

      if (!donor) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Donor not found",
          },
          404
        );
      }

      // Verify campaign exists and belongs to donor
      const campaign = await db.donationCampaign.findFirst({
        where: {
          id: campaignId,
          donorId: donorId,
          status: "ACTIVE", // Only allow funding active campaigns
        },
      });

      if (!campaign) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Campaign not found or not active",
          },
          404
        );
      }

      // Generate funding reference for payment
      const reference = `campaign-fund-${campaignId}-${Date.now()}-${crypto
        .randomBytes(6)
        .toString("hex")}`;

      // Initialize Paystack payment for campaign funding
      const paystackResponse = await initializePaystackPayment(c, {
        email: donor.email,
        amount: fundData.amount * 100, // Convert to kobo
        reference,
        paymentType: "campaign_funding",
        campaignId: campaignId,
        metadata: {
          donor_id: donorId,
          campaign_id: campaignId,
          funding_amount: fundData.amount,
        },
      });

      // Create pending transaction
      await db.transaction.create({
        data: {
          type: "DONATION",
          status: "PENDING",
          amount: fundData.amount,
          paymentReference: reference,
          paymentChannel: "PAYSTACK",
          relatedDonationId: campaignId,
        },
      });

      return c.json<TFundCampaignResponse>({
        ok: true,
        data: {
          campaignId: campaignId,
          transactionId: reference,
          reference: reference,
          authorizationUrl: paystackResponse.authorization_url,
          accessCode: paystackResponse.access_code,
        },
      });
    } catch (error) {
      console.error("Campaign funding error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to initialize campaign funding",
        },
        500
      );
    }
  }
);

// PATCH /api/donor/campaigns/:id - Update campaign details (doesn't affect existing allocations)
donationApp.patch(
  "/campaigns/:id",
  zValidator("json", updateCampaignSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const campaignId = c.req.param("id");
    const updateData = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const donorId = payload?.id!;

    try {
      // Verify campaign exists and belongs to donor
      const existingCampaign = await db.donationCampaign.findFirst({
        where: {
          id: campaignId,
          donorId: donorId,
          status: "ACTIVE", // Only allow updating active campaigns
        },
        include: {
          screeningTypes: true,
          allocations: true,
        },
      });

      if (!existingCampaign) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Campaign not found or not active",
          },
          404
        );
      }

      // Check if any funds are already allocated
      const hasAllocations = existingCampaign.allocations.length > 0;
      if (hasAllocations) {
        // Log that this update won't affect existing allocations
        console.log(
          `Updating campaign ${campaignId} with existing allocations. Changes will only affect future matching.`
        );
      }

      // Validate screening types if provided
      if (updateData.screeningTypeIds?.length) {
        const screeningTypes = await db.screeningType.findMany({
          where: { id: { in: updateData.screeningTypeIds } },
        });

        if (screeningTypes.length !== updateData.screeningTypeIds.length) {
          return c.json<TErrorResponse>(
            {
              ok: false,
              error: "Some screening types not found",
            },
            400
          );
        }
      }

      // Prepare update data
      const updateFields: any = {};

      if (updateData.title !== undefined) {
        updateFields.purpose = updateData.title; // Map title to purpose field
      }

      if (updateData.targetGender !== undefined) {
        updateFields.targetGender =
          updateData.targetGender === "ALL"
            ? null
            : updateData.targetGender === "MALE";
      }

      if (
        updateData.targetAgeMin !== undefined &&
        updateData.targetAgeMax !== undefined
      ) {
        updateFields.targetAgeRange = `${updateData.targetAgeMin}-${updateData.targetAgeMax}`;
      } else if (
        updateData.targetAgeMin !== undefined ||
        updateData.targetAgeMax !== undefined
      ) {
        // If only one age limit is provided, we need to handle it carefully
        const currentRange = existingCampaign.targetAgeRange?.split("-");
        const currentMin = currentRange?.[0]
          ? parseInt(currentRange[0])
          : undefined;
        const currentMax = currentRange?.[1]
          ? parseInt(currentRange[1])
          : undefined;

        const newMin = updateData.targetAgeMin ?? currentMin;
        const newMax = updateData.targetAgeMax ?? currentMax;

        if (newMin !== undefined && newMax !== undefined) {
          updateFields.targetAgeRange = `${newMin}-${newMax}`;
        }
      }

      if (updateData.targetStates !== undefined) {
        updateFields.targetState =
          updateData.targetStates.length > 0
            ? updateData.targetStates.join(",")
            : null;
      }

      if (updateData.targetLgas !== undefined) {
        updateFields.targetLga =
          updateData.targetLgas.length > 0
            ? updateData.targetLgas.join(",")
            : null;
      }

      // Update campaign with new data
      const updatedCampaign = await db.donationCampaign.update({
        where: { id: campaignId },
        data: {
          ...updateFields,
          // Update screening types if provided
          ...(updateData.screeningTypeIds && {
            screeningTypes: {
              set: [], // Clear existing relationships
              connect: updateData.screeningTypeIds.map((id: string) => ({
                id,
              })),
            },
          }),
        },
        include: {
          donor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              donorProfile: {
                select: { organizationName: true },
              },
            },
          },
          screeningTypes: {
            select: { id: true, name: true },
          },
          allocations: {
            include: {
              patient: {
                select: { id: true, fullName: true },
              },
              appointment: {
                where: {
                  status: {
                    notIn: ["PENDING", "CANCELLED"],
                  },
                },
              },
            },
          }, // Include allocations to calculate patients helped
        },
      });

      // Format response
      const formattedCampaign = formatCampaignForResponse(updatedCampaign);

      return c.json<TUpdateCampaignResponse>({
        ok: true,
        data: {
          campaign: formattedCampaign,
        },
      });
    } catch (error) {
      console.error("Campaign update error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to update campaign",
        },
        500
      );
    }
  }
);

// DELETE /api/donor/campaigns/:id - Delete campaign and recycle funds
donationApp.delete(
  "/campaigns/:id",
  zValidator("json", deleteCampaignSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const campaignId = c.req.param("id");
    const deleteData = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const donorId = payload?.id!;

    try {
      // Verify campaign exists and belongs to donor
      const existingCampaign = await db.donationCampaign.findFirst({
        where: {
          id: campaignId,
          donorId: donorId,
          status: "ACTIVE", // Only allow deleting active campaigns
        },
        include: {
          allocations: {
            include: {
              appointment: {
                select: { id: true, status: true },
              },
            },
          },
        },
      });

      if (!existingCampaign) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Campaign not found or not active",
          },
          404
        );
      }

      // Calculate total funds to transfer (available + reserved)
      const fundsToTransfer = existingCampaign.totalAmount;

      if (fundsToTransfer <= 0) {
        // If no funds to transfer, just mark as deleted
        await db.donationCampaign.update({
          where: { id: campaignId },
          data: { status: "DELETED" },
        });

        return c.json<TDeleteCampaignResponse>({
          ok: true,
          data: {
            campaignId: campaignId,
            action: "recycle_to_general",
            amountProcessed: 0,
            message: "Campaign deleted successfully. No funds to transfer.",
          },
        });
      }

      // Generate transaction reference
      const reference = `campaign-deletion-${campaignId}-${Date.now()}-${crypto
        .randomBytes(6)
        .toString("hex")}`;

      // Check if there are ongoing appointments that would be affected
      const ongoingAllocations = existingCampaign.allocations.filter(
        (allocation) =>
          allocation.appointment &&
          ["SCHEDULED", "IN_PROGRESS"].includes(allocation.appointment.status)
      );

      // Perform the transfer in a transaction
      await db.$transaction(async (tx) => {
        // Mark campaign as deleted and zero out funds
        await tx.donationCampaign.update({
          where: { id: campaignId },
          data: {
            status: "DELETED",
            availableAmount: 0,
            totalAmount: 0,
          },
        });

        // Add funds to general donor pool
        await addToGeneralDonorPool(fundsToTransfer);

        // Create transaction record for the fund transfer
        await tx.transaction.create({
          data: {
            type: "REFUND", // Using REFUND type for fund recycling
            status: "COMPLETED",
            amount: fundsToTransfer,
            paymentReference: reference,
            paymentChannel: "INTERNAL_TRANSFER",
            relatedDonationId: "general-donor-pool",
          },
        });

        // Update all affected allocations to point to the general-donor-pool campaign
        if (ongoingAllocations.length > 0) {
          const allocationIds = ongoingAllocations.map(
            (allocations) => allocations.id
          );

          await tx.donationAllocation.updateMany({
            where: { id: { in: allocationIds } },
            data: { campaignId: "general-donor-pool" },
          });
        }
      });

      // Send notification to donor about campaign deletion
      try {
        await Promise.all([
          createNotificationForUsers({
            type: "CAMPAIGN_DELETED",
            title: "Campaign Deleted Successfully",
            message: `Your campaign has been deleted and ₦${fundsToTransfer.toFixed(
              2
            )} has been transferred to the general donation pool to help other patients.`,
            userIds: [donorId],
            data: {
              campaignId: campaignId,
              transferredAmount: fundsToTransfer,
              transferReference: reference,
            },
          }),
          createNotificationForUsers({
            type: "CAMPAIGN_DELETED_ALLOCATION_MOVED",
            title: "Campaign Deleted - Allocation Moved",
            message: `The campaign you were allocated to has been deleted. Your allocation has been moved to the general donation pool and you will still receive support.`,
            userIds: ongoingAllocations
              .map((allocation) => allocation.patientId)
              .filter(Boolean),
            data: {
              campaignId: campaignId,
              transferredAmount: fundsToTransfer,
              transferReference: reference,
            },
          }),
        ]);
      } catch (error) {
        // Log the error but don't fail the request
        console.error("Failed to send campaign deletion notification:", error);
      }

      return c.json<TDeleteCampaignResponse>({
        ok: true,
        data: {
          campaignId: campaignId,
          action: "recycle_to_general",
          amountProcessed: fundsToTransfer,
          message: `Campaign deleted successfully. ₦${fundsToTransfer.toFixed(
            2
          )} transferred to general donation pool.`,
        },
      });
    } catch (error) {
      console.error("Campaign deletion error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to delete campaign",
        },
        500
      );
    }
  }
);

// ========================================
// PAYMENT VERIFICATION ENDPOINT
// ========================================

// GET /api/donor/verify-payment/:reference - Verify payment status with Paystack
donationApp.get("/verify-payment/:reference", async (c) => {
  const db = getDB();
  const reference = c.req.param("reference");
  const { PAYSTACK_SECRET_KEY } = env<{ PAYSTACK_SECRET_KEY: string }>(
    c,
    "node"
  );

  try {
    // Verify payment with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to verify payment with Paystack",
        },
        500
      );
    }

    const paystackData = await response.json();
    const { data: paymentData } = paystackData;

    if (!paymentData) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Payment not found",
        },
        404
      );
    }

    // Get local transaction record
    const transaction = await db.transaction.findFirst({
      where: { paymentReference: reference },
      include: {
        donation: {
          include: {
            donor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                donorProfile: {
                  select: { organizationName: true },
                },
              },
            },
            screeningTypes: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Determine payment context from metadata
    const metadata = paymentData.metadata || {};
    const paymentType = metadata.payment_type;
    const campaignId = metadata.campaign_id;

    // Prepare response data based on payment type and status
    const responseData: any = {
      reference: paymentData.reference,
      amount: paymentData.amount / 100, // Convert from kobo
      status: paymentData.status, // success, failed, abandoned
      paymentType,
      paidAt: paymentData.paid_at,
      channel: paymentData.channel,
      currency: paymentData.currency,
      transactionDate: paymentData.transaction_date,
    };

    // Add context-specific data
    if (paymentType === "anonymous_donation") {
      responseData.context = {
        type: "anonymous_donation",
        wantsReceipt: metadata.wants_receipt || false,
        message: metadata.message || null,
      };
    } else if (paymentType === "campaign_creation" && campaignId) {
      // Get campaign details
      const campaign = transaction?.donation;
      responseData.context = {
        type: "campaign_creation",
        campaignId,
        campaign: campaign ? formatCampaignForResponse(campaign) : null,
        initialFunding: metadata.funding_amount,
      };
    } else if (paymentType === "campaign_funding" && campaignId) {
      // Get campaign details
      const campaign = transaction?.donation;
      responseData.context = {
        type: "campaign_funding",
        campaignId,
        campaign: campaign ? formatCampaignForResponse(campaign) : null,
        fundingAmount: metadata.funding_amount,
      };
    } else if (
      paymentType === "appointment_booking" &&
      metadata.appointmentId
    ) {
      // Get appointment details
      const appointment = await db.appointment.findUnique({
        where: { id: metadata.appointmentId },
        include: {
          patient: {
            select: { id: true, fullName: true },
          },
        },
      });

      responseData.context = {
        type: "appointment_booking",
        appointmentId: metadata.appointmentId,
        appointment: appointment
          ? {
              id: appointment.id,
              patientId: appointment.patient.id,
              patientName: appointment.patient.fullName,
              status: appointment.status,
              checkInCode: appointment.checkInCode,
              checkInCodeExpiresAt: appointment.checkInCodeExpiresAt,
            }
          : null,
      };
    }

    return c.json({
      ok: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to verify payment",
      },
      500
    );
  }
});
