import { zValidator } from "@hono/zod-validator";
import {
  anonymousDonationSchema,
  createCampaignSchema,
  fundCampaignSchema,
  getCampaignsSchema,
  paystackWebhookSchema,
  updateCampaignSchema,
} from "@zerocancer/shared";
import type {
  TAnonymousDonationResponse,
  TCreateCampaignResponse,
  TDonationCampaign,
  TErrorResponse,
  TFundCampaignResponse,
  TGetCampaignResponse,
  TGetCampaignsResponse,
  TUpdateCampaignResponse,
} from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { authMiddleware } from "src/middleware/auth.middleware";

export const donationApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// ========================================
// HELPER FUNCTIONS
// ========================================

// Helper function to initialize Paystack payment
async function initializePaystackPayment(data: {
  email: string;
  amount: number; // in kobo
  reference: string;
  metadata?: any;
}) {
  const { PAYSTACK_SECRET_KEY, FRONTEND_URL } = process.env;

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
        callback_url: `${FRONTEND_URL}/payment-callback`,
        metadata: data.metadata,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to initialize Paystack payment");
  }

  const result = await response.json();
  return result.data;
}

// Helper function to format campaign for API response
function formatCampaignForResponse(campaign: any): TDonationCampaign {
  // Map boolean targetGender to enum
  let targetGender: "MALE" | "FEMALE" | "ALL" | undefined;
  if (campaign.targetGender === null || campaign.targetGender === undefined) {
    targetGender = "ALL";
  } else if (campaign.targetGender === true) {
    targetGender = "MALE";
  } else {
    targetGender = "FEMALE";
  }

  return {
    id: campaign.id,
    donorId: campaign.donorId,
    title: campaign.purpose || "Untitled Campaign",
    description: campaign.purpose || "",
    targetAmount: campaign.initialAmount,
    initialAmount: campaign.initialAmount,
    availableAmount: campaign.availableAmount,
    reservedAmount: campaign.reservedAmount,
    usedAmount:
      campaign.initialAmount -
      campaign.availableAmount -
      campaign.reservedAmount,
    purpose: campaign.purpose,
    targetGender,
    targetAgeMin: campaign.targetAgeRange?.split("-")[0]
      ? parseInt(campaign.targetAgeRange.split("-")[0])
      : undefined,
    targetAgeMax: campaign.targetAgeRange?.split("-")[1]
      ? parseInt(campaign.targetAgeRange.split("-")[1])
      : undefined,
    targetStates: campaign.targetState?.split(",") || [],
    targetLgas: campaign.targetLga?.split(",") || [],
    status: campaign.status as "ACTIVE" | "COMPLETED" | "DELETED",
    expiryDate: campaign.createdAt.toISOString(), // TODO: Add proper expiry date field
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.createdAt.toISOString(), // TODO: Add updatedAt field
    donor: {
      id: campaign.donor.id,
      fullName: campaign.donor.fullName,
      email: campaign.donor.email,
      organizationName: campaign.donor.donorProfile?.organizationName,
    },
    screeningTypes: campaign.screeningTypes || [],
    patientsHelped: 0, // TODO: Calculate from allocations
    allocationsCount: campaign.allocations?.length || 0,
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
        initialAmount: amount,
        availableAmount: amount,
        reservedAmount: 0,
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
        initialAmount: { increment: amount },
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
      : process.env.ANONYMOUS_DONOR_EMAIL || "anon-donor@zerocancer.africa";

    // Generate unique reference
    const reference = `donation-anon-${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}`;

    try {
      // Initialize Paystack payment
      const paystackResponse = await initializePaystackPayment({
        email,
        amount: donationData.amount * 100, // Convert to kobo
        reference,
        metadata: {
          payment_type: "anonymous_donation",
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
    if (
      !campaignData.targetAmount ||
      !campaignData.initialFunding ||
      !campaignData.screeningTypeIds?.length
    ) {
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
          donorId: donorId,
          initialAmount: campaignData.targetAmount,
          availableAmount: 0, // Will be updated after payment
          reservedAmount: 0,
          purpose: campaignData.title,
          targetGender:
            campaignData.targetGender === "ALL"
              ? null
              : campaignData.targetGender === "MALE",
          targetAgeRange:
            campaignData.targetAgeMin && campaignData.targetAgeMax
              ? `${campaignData.targetAgeMin}-${campaignData.targetAgeMax}`
              : null,
          targetState: campaignData.targetStates?.join(",") || null,
          targetLga: campaignData.targetLgas?.join(",") || null,
          status: "ACTIVE",
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
        },
      });

      // Initialize Paystack payment for initial funding
      const paystackResponse = await initializePaystackPayment({
        email: donor.email,
        amount: campaignData.initialFunding * 100, // Convert to kobo
        reference,
        metadata: {
          payment_type: "campaign_creation",
          campaign_id: campaign.id,
          donor_id: donorId,
          initial_funding: campaignData.initialFunding,
        },
      });

      // Create pending transaction
      await db.transaction.create({
        data: {
          type: "DONATION",
          status: "PENDING",
          amount: campaignData.initialFunding,
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
            allocations: true,
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
          },
        },
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
      const paystackResponse = await initializePaystackPayment({
        email: donor.email,
        amount: fundData.amount * 100, // Convert to kobo
        reference,
        metadata: {
          payment_type: "campaign_funding",
          campaign_id: campaignId,
          donor_id: donorId,
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
        console.log(`Updating campaign ${campaignId} with existing allocations. Changes will only affect future matching.`);
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
        updateFields.targetGender = updateData.targetGender === "ALL" ? null : updateData.targetGender === "MALE";
      }
      
      if (updateData.targetAgeMin !== undefined && updateData.targetAgeMax !== undefined) {
        updateFields.targetAgeRange = `${updateData.targetAgeMin}-${updateData.targetAgeMax}`;
      } else if (updateData.targetAgeMin !== undefined || updateData.targetAgeMax !== undefined) {
        // If only one age limit is provided, we need to handle it carefully
        const currentRange = existingCampaign.targetAgeRange?.split("-");
        const currentMin = currentRange?.[0] ? parseInt(currentRange[0]) : undefined;
        const currentMax = currentRange?.[1] ? parseInt(currentRange[1]) : undefined;
        
        const newMin = updateData.targetAgeMin ?? currentMin;
        const newMax = updateData.targetAgeMax ?? currentMax;
        
        if (newMin !== undefined && newMax !== undefined) {
          updateFields.targetAgeRange = `${newMin}-${newMax}`;
        }
      }
      
      if (updateData.targetStates !== undefined) {
        updateFields.targetState = updateData.targetStates.length > 0 ? updateData.targetStates.join(",") : null;
      }
      
      if (updateData.targetLgas !== undefined) {
        updateFields.targetLga = updateData.targetLgas.length > 0 ? updateData.targetLgas.join(",") : null;
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
              connect: updateData.screeningTypeIds.map((id: string) => ({ id })),
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
            },
          },
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

// ========================================
// WEBHOOK ENDPOINTS
// ========================================

// POST /api/donor/paystack-webhook - Handle Paystack webhook
donationApp.post(
  "/paystack-webhook",
  zValidator("json", paystackWebhookSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const payload = c.req.valid("json");
    const signature = c.req.header("x-paystack-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (hash !== signature) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    try {
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
          await addToGeneralDonorPool(amount / 100);
        } else if (paymentType === "campaign_creation" && metadata) {
          // Update campaign with initial funding
          const campaignId = metadata.campaign_id;
          const initialFunding = metadata.initial_funding;

          if (campaignId && initialFunding) {
            await db.donationCampaign.update({
              where: { id: campaignId },
              data: {
                availableAmount: { increment: initialFunding },
              },
            });
          }

          // Trigger matching for this campaign
          // TODO: Call matching algorithm
        } else if (paymentType === "campaign_funding" && metadata) {
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
        }

        return c.json({ message: "Webhook processed successfully" });
      }

      return c.json({ message: "Event not handled" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return c.json({ error: "Webhook processing failed" }, 500);
    }
  }
);
