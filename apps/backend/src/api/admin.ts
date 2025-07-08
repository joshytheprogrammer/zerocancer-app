import { zValidator } from "@hono/zod-validator";
import {
  adminForgotPasswordSchema,
  adminLoginSchema,
  adminResetPasswordSchema,
  createAdminSchema,
} from "@zerocancer/shared";
import type {
  TAdminForgotPasswordResponse,
  TAdminLoginResponse,
  TAdminResetPasswordResponse,
  TCreateAdminResponse,
  TErrorResponse,
} from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { getDB } from "src/lib/db";
import { sendEmail } from "src/lib/email";
import { THonoAppVariables } from "src/lib/types";
import {
  comparePassword,
  createNotificationForUsers,
  hashPassword,
} from "src/lib/utils";
import { authMiddleware } from "src/middleware/auth.middleware";
import { z } from "zod";

export const adminApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// ========================================
// ADMIN AUTH ENDPOINTS (No auth required)
// ========================================

// POST /api/admin/login - Admin login
adminApp.post(
  "/login",
  zValidator("json", adminLoginSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");
    const db = getDB();
    const { email, password } = c.req.valid("json");

    try {
      // Find admin
      const admin = await db.admins.findUnique({
        where: { email },
      });

      if (!admin || !admin.passwordHash) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Invalid credentials" },
          401
        );
      }

      // Compare password
      const valid = await comparePassword(password!, admin.passwordHash!);
      if (!valid) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Invalid credentials" },
          401
        );
      }

      const payload = {
        id: admin.id,
        email: admin.email,
        profile: "ADMIN",
      };

      const token = await sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 }, // 8 hours
        JWT_TOKEN_SECRET
      );

      const refreshToken = await sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, // 7 days
        JWT_TOKEN_SECRET
      );

      // Set refresh token as httpOnly, secure cookie
      setCookie(c, "refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      });

      return c.json<TAdminLoginResponse>({
        ok: true,
        data: {
          token,
          user: {
            userId: admin.id,
            email: admin.email,
            fullName: admin.fullName,
            profile: "ADMIN",
          },
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Internal server error" },
        500
      );
    }
  }
);

// POST /api/admin/forgot-password - Admin forgot password
adminApp.post(
  "/forgot-password",
  zValidator("json", adminForgotPasswordSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { email } = c.req.valid("json");

    try {
      // Find admin
      const admin = await db.admins.findUnique({
        where: { email },
      });

      if (!admin) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Admin not found" },
          404
        );
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token
      await db.adminResetToken.create({
        data: {
          adminId: admin.id,
          token,
          expiresAt,
        },
      });

      // Send reset email
      const resetUrl = `${
        env<{ FRONTEND_URL: string }>(c, "node").FRONTEND_URL
      }/admin/reset-password?token=${token}`;

      await sendEmail({
        to: email!,
        subject: "Reset your Zerocancer Admin password",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      });

      return c.json<TAdminForgotPasswordResponse>({
        ok: true,
        data: { message: "Reset email sent" },
      });
    } catch (error) {
      console.error("Admin forgot password error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Internal server error" },
        500
      );
    }
  }
);

// POST /api/admin/reset-password - Admin reset password using token
adminApp.post(
  "/reset-password",
  zValidator("json", adminResetPasswordSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { token, password } = c.req.valid("json");

    try {
      // Find reset token
      const reset = await db.adminResetToken.findUnique({
        where: { token },
      });

      if (!reset || reset.expiresAt < new Date()) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Invalid or expired reset token" },
          400
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password!);

      // Update admin password
      await db.admins.update({
        where: { id: reset.adminId },
        data: { passwordHash },
      });

      // Invalidate token
      await db.adminResetToken.delete({ where: { token } });

      return c.json<TAdminResetPasswordResponse>({
        ok: true,
        data: { message: "Password reset successful" },
      });
    } catch (error) {
      console.error("Admin reset password error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Internal server error" },
        500
      );
    }
  }
);

// POST /api/admin/create - Create new admin (super admin only)
adminApp.post(
  "/create",
  authMiddleware(["admin"]), // Only existing admins can create new admins
  zValidator("json", createAdminSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { fullName, email, password } = c.req.valid("json");

    try {
      // Check if admin already exists
      const existingAdmin = await db.admins.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Admin with this email already exists" },
          409
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password!);

      // Create admin
      const admin = await db.admins.create({
        data: {
          fullName: fullName!,
          email: email!,
          passwordHash,
        },
      });

      return c.json<TCreateAdminResponse>({
        ok: true,
        data: {
          adminId: admin.id,
          email: admin.email,
          fullName: admin.fullName,
        },
      });
    } catch (error) {
      console.error("Create admin error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Internal server error" },
        500
      );
    }
  }
);

// Middleware to ensure user is authenticated as admin for management endpoints
adminApp.use(authMiddleware(["admin"]));

// ========================================
// CENTER MANAGEMENT
// ========================================

// GET /api/admin/centers - List all centers with filtering
const getCentersSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  state: z.string().optional(),
  search: z.string().optional(),
});

adminApp.get(
  "/centers",
  zValidator("query", getCentersSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const {
      page = 1,
      pageSize = 20,
      status,
      state,
      search,
    } = c.req.valid("query");

    const where: any = {};
    if (status) where.status = status;
    if (state) where.state = state;
    if (search) {
      where.OR = [
        { centerName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    try {
      const [centers, total] = await Promise.all([
        db.serviceCenter.findMany({
          where,
          include: {
            staff: { select: { id: true, email: true, role: true } },
            services: { select: { id: true, name: true } },
            appointments: {
              select: { id: true, status: true },
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.serviceCenter.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          centers,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get centers error:", error);
      return c.json({ ok: false, error: "Failed to fetch centers" }, 500);
    }
  }
);

// PATCH /api/admin/centers/:id/status - Update center status
const updateCenterStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  reason: z.string().optional(),
});

adminApp.patch(
  "/centers/:id/status",
  zValidator("json", updateCenterStatusSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const centerId = c.req.param("id");
    const { status, reason } = c.req.valid("json");

    try {
      const center = await db.serviceCenter.findUnique({
        where: { id: centerId },
        select: { id: true, centerName: true, email: true, status: true },
      });

      if (!center) {
        return c.json({ ok: false, error: "Center not found" }, 404);
      }

      // Update center status
      const updatedCenter = await db.serviceCenter.update({
        where: { id: centerId },
        data: { status },
      });

      // Send notification to center staff about status change
      const staff = await db.centerStaff.findMany({
        where: { centerId },
        select: { id: true },
      });

      if (staff.length > 0) {
        const statusMessages = {
          ACTIVE: "Your screening center has been approved and is now active!",
          INACTIVE: "Your screening center has been temporarily deactivated.",
          SUSPENDED: `Your screening center has been suspended. ${
            reason || "Please contact support for more information."
          }`,
        };

        try {
          // Note: We need staff user IDs, not center staff IDs
          // This is a simplified version - in production you'd want to link center staff to users
          console.log(
            `Center ${center.centerName} status changed to ${status}`
          );
        } catch (notificationError) {
          console.error(
            "Failed to send status change notification:",
            notificationError
          );
        }
      }

      return c.json({
        ok: true,
        data: {
          centerId: updatedCenter.id,
          status: updatedCenter.status,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Update center status error:", error);
      return c.json(
        { ok: false, error: "Failed to update center status" },
        500
      );
    }
  }
);

// ========================================
// USER MANAGEMENT
// ========================================

// GET /api/admin/users - List all users with filtering
const getUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  profileType: z.enum(["PATIENT", "DONOR"]).optional(),
  search: z.string().optional(),
});

adminApp.get(
  "/users",
  zValidator("query", getUsersSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const {
      page = 1,
      pageSize = 20,
      profileType,
      search,
    } = c.req.valid("query");

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add profile type filtering
    if (profileType === "PATIENT") {
      where.patientProfile = { isNot: null };
    } else if (profileType === "DONOR") {
      where.donorProfile = { isNot: null };
    }

    try {
      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          include: {
            patientProfile: {
              select: {
                id: true,
                emailVerified: true,
                gender: true,
                dateOfBirth: true,
                city: true,
                state: true,
              },
            },
            donorProfile: {
              select: {
                id: true,
                emailVerified: true,
                organizationName: true,
                country: true,
              },
            },
            appointments: {
              select: { id: true, status: true, createdAt: true },
              take: 3,
              orderBy: { createdAt: "desc" },
            },
            donationCampaigns: {
              select: { id: true, status: true, totalAmount: true },
              take: 3,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.user.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          users,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      return c.json({ ok: false, error: "Failed to fetch users" }, 500);
    }
  }
);

// ========================================
// CAMPAIGN MANAGEMENT
// ========================================

// GET /api/admin/campaigns - List all campaigns with filtering
const getCampaignsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "DELETED"]).optional(),
  search: z.string().optional(),
});

adminApp.get(
  "/campaigns",
  zValidator("query", getCampaignsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { page = 1, pageSize = 20, status, search } = c.req.valid("query");

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { purpose: { contains: search, mode: "insensitive" } },
        { donor: { fullName: { contains: search, mode: "insensitive" } } },
      ];
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
              select: { id: true, claimedAt: true },
              take: 5,
            },
            transactions: {
              select: { id: true, amount: true, status: true, createdAt: true },
              take: 3,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.donationCampaign.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          campaigns,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get campaigns error:", error);
      return c.json({ ok: false, error: "Failed to fetch campaigns" }, 500);
    }
  }
);

// PATCH /api/admin/campaigns/:id/status - Update campaign status
const updateCampaignStatusSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "DELETED"]),
  reason: z.string().optional(),
});

adminApp.patch(
  "/campaigns/:id/status",
  zValidator("json", updateCampaignStatusSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const campaignId = c.req.param("id");
    const { status, reason } = c.req.valid("json");

    try {
      const campaign = await db.donationCampaign.findUnique({
        where: { id: campaignId },
        include: {
          donor: { select: { id: true, fullName: true } },
        },
      });

      if (!campaign) {
        return c.json({ ok: false, error: "Campaign not found" }, 404);
      }

      // Update campaign status
      const updatedCampaign = await db.donationCampaign.update({
        where: { id: campaignId },
        data: { status },
      });

      // Send notification to donor about status change
      const statusMessages = {
        ACTIVE: "Your campaign has been approved and is now active!",
        COMPLETED: "Your campaign has been marked as completed.",
        DELETED: `Your campaign has been deleted by admin. ${
          reason || "Please contact support for more information."
        }`,
      };

      try {
        await createNotificationForUsers({
          type: "CAMPAIGN_STATUS_CHANGED",
          title: "Campaign Status Updated",
          message: statusMessages[status],
          userIds: [campaign.donor.id],
          data: {
            campaignId: campaign.id,
            newStatus: status,
            reason: reason || null,
          },
        });
      } catch (notificationError) {
        console.error(
          "Failed to send campaign status notification:",
          notificationError
        );
      }

      return c.json({
        ok: true,
        data: {
          campaignId: updatedCampaign.id,
          status: updatedCampaign.status,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Update campaign status error:", error);
      return c.json(
        { ok: false, error: "Failed to update campaign status" },
        500
      );
    }
  }
);

// ========================================
// APPOINTMENT MONITORING
// ========================================

// GET /api/admin/appointments - Global view of appointments
const getAppointmentsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
  centerId: z.string().uuid().optional(),
  isDonation: z.coerce.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

adminApp.get(
  "/appointments",
  zValidator("query", getAppointmentsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const {
      page = 1,
      pageSize = 20,
      status,
      centerId,
      isDonation,
      dateFrom,
      dateTo,
    } = c.req.valid("query");

    const where: any = {};
    if (status) where.status = status;
    if (centerId) where.centerId = centerId;
    if (isDonation !== undefined) where.isDonation = isDonation;

    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) where.appointmentDate.gte = new Date(dateFrom);
      if (dateTo) where.appointmentDate.lte = new Date(dateTo);
    }

    try {
      const [appointments, total] = await Promise.all([
        db.appointment.findMany({
          where,
          include: {
            patient: {
              select: { id: true, fullName: true, email: true },
            },
            center: {
              select: { id: true, centerName: true, state: true, lga: true },
            },
            screeningType: {
              select: { id: true, name: true },
            },
            transaction: {
              select: { id: true, amount: true, status: true },
            },
            result: {
              select: { id: true, uploadedAt: true, notes: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.appointment.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          appointments,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get appointments error:", error);
      return c.json({ ok: false, error: "Failed to fetch appointments" }, 500);
    }
  }
);

// ========================================
// TRANSACTION MONITORING
// ========================================

// GET /api/admin/transactions - View all transactions
const getTransactionsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  type: z.enum(["DONATION", "APPOINTMENT", "PAYOUT", "REFUND"]).optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

adminApp.get(
  "/transactions",
  zValidator("query", getTransactionsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const {
      page = 1,
      pageSize = 20,
      type,
      status,
      dateFrom,
      dateTo,
    } = c.req.valid("query");

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    try {
      const [transactions, total] = await Promise.all([
        db.transaction.findMany({
          where,
          include: {
            donation: {
              select: {
                id: true,
                purpose: true,
                donor: {
                  select: { id: true, fullName: true },
                },
              },
            },
            appointments: {
              select: {
                id: true,
                patient: {
                  select: { id: true, fullName: true },
                },
              },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.transaction.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          transactions,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      return c.json({ ok: false, error: "Failed to fetch transactions" }, 500);
    }
  }
);

// ========================================
// WAITLIST ANALYTICS
// ========================================

// GET /api/admin/waitlist - View waitlist statistics
const getWaitlistSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["PENDING", "MATCHED", "CLAIMED", "EXPIRED"]).optional(),
  screeningTypeId: z.string().uuid().optional(),
  state: z.string().optional(),
  groupBy: z.enum(["state", "screening_type", "status"]).optional(),
});

adminApp.get(
  "/waitlist",
  zValidator("query", getWaitlistSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const {
      page = 1,
      pageSize = 20,
      status,
      screeningTypeId,
      state,
      groupBy,
    } = c.req.valid("query");

    try {
      // If groupBy is specified, return aggregated data
      if (groupBy) {
        let groupByField = "";
        let selectField = "";

        switch (groupBy) {
          case "state":
            groupByField = "patient.patientProfile.state";
            selectField = "state";
            break;
          case "screening_type":
            groupByField = "screening.name";
            selectField = "screeningType";
            break;
          case "status":
            groupByField = "status";
            selectField = "status";
            break;
        }

        // This would need raw SQL for complex grouping - simplified version
        const waitlistEntries = await db.waitlist.findMany({
          include: {
            patient: {
              include: {
                patientProfile: {
                  select: { state: true },
                },
              },
            },
            screening: {
              select: { name: true },
            },
          },
        });

        // Simple aggregation in JavaScript (in production, use raw SQL)
        const aggregated = waitlistEntries.reduce((acc: any, entry) => {
          let key = "";
          switch (groupBy) {
            case "state":
              key = entry.patient.patientProfile?.state || "Unknown";
              break;
            case "screening_type":
              key = entry.screening.name;
              break;
            case "status":
              key = entry.status;
              break;
          }

          if (!acc[key]) {
            acc[key] = { count: 0, [selectField]: key };
          }
          acc[key].count++;
          return acc;
        }, {});

        return c.json({
          ok: true,
          data: {
            aggregation: Object.values(aggregated),
            groupBy,
          },
        });
      }

      // Regular waitlist listing
      const where: any = {};
      if (status) where.status = status;
      if (screeningTypeId) where.screeningTypeId = screeningTypeId;

      const [waitlistEntries, total] = await Promise.all([
        db.waitlist.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                patientProfile: {
                  select: { state: true, city: true },
                },
              },
            },
            screening: {
              select: { id: true, name: true },
            },
            allocation: {
              select: { id: true, claimedAt: true },
            },
          },
          orderBy: { joinedAt: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.waitlist.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          waitlistEntries,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get waitlist error:", error);
      return c.json({ ok: false, error: "Failed to fetch waitlist data" }, 500);
    }
  }
);

// ========================================
// STORE MANAGEMENT
// ========================================

// GET /api/admin/store/products - List store products
const getProductsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
});

adminApp.get(
  "/store/products",
  zValidator("query", getProductsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { page = 1, pageSize = 20, search } = c.req.valid("query");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    try {
      const [products, total] = await Promise.all([
        db.storeProduct.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.storeProduct.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          products,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get products error:", error);
      return c.json({ ok: false, error: "Failed to fetch products" }, 500);
    }
  }
);

// POST /api/admin/store/products - Add new product
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  stock: z.number().int().min(0, "Stock must be non-negative integer"),
});

adminApp.post(
  "/store/products",
  zValidator("json", createProductSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const productData = c.req.valid("json");

    try {
      const product = await db.storeProduct.create({
        data: productData,
      });

      return c.json({
        ok: true,
        data: product,
      });
    } catch (error) {
      console.error("Create product error:", error);
      return c.json({ ok: false, error: "Failed to create product" }, 500);
    }
  }
);

// PATCH /api/admin/store/products/:id - Update product
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
});

adminApp.patch(
  "/store/products/:id",
  zValidator("json", updateProductSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const productId = c.req.param("id");
    const updateData = c.req.valid("json");

    try {
      const product = await db.storeProduct.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return c.json({ ok: false, error: "Product not found" }, 404);
      }

      const updatedProduct = await db.storeProduct.update({
        where: { id: productId },
        data: updateData,
      });

      return c.json({
        ok: true,
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Update product error:", error);
      return c.json({ ok: false, error: "Failed to update product" }, 500);
    }
  }
);
