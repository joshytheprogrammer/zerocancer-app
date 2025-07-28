import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { THonoApp } from "./lib/types";

// Load environment variables
dotenv.config();

// Import API routes
import analyticsApi from "./api/analytics";
// import waitlistApi from "./api/waitlist";
// import emailApi from "./api/email";
// import pdfApi from "./api/pdf";

const app = new Hono<THonoApp>();

// Global middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173", // Frontend dev
      "http://localhost:3000", // Frontend prod
      "http://localhost:8787", // Backend edge
      process.env.FRONTEND_URL || "http://localhost:5173",
    ].filter(Boolean),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "ZeroCancer Compute Service",
    runtime: "Node.js Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    status: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.route("/api/analytics", analyticsApi);
// app.route("/api/waitlist", waitlistApi);
// app.route("/api/email", emailApi);
// app.route("/api/pdf", pdfApi);

// 404 handler
app.notFound((c) => {
  return c.json({ ok: false, error: "Endpoint not found" }, 404);
});

// Error handler
app.onError((error, c) => {
  console.error("Compute Service error:", error);
  return c.json(
    {
      ok: false,
      error: "Internal server error",
      message: error.message,
    },
    500
  );
});

// Start server
const port = parseInt(process.env.PORT || "8788");

console.log(`🚀 Starting ZeroCancer Compute Service...`);
console.log(`📊 Analytics, waitlist matching, and heavy computations`);
console.log(`🌐 Server will be available at http://localhost:${port}`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`✅ Compute Service running on http://localhost:${info.port}`);
    console.log(
      `🔗 Backend should set COMPUTE_SERVICE_URL=http://localhost:${info.port}`
    );
  }
);

/**
 * // POST /api/donor/paystack-webhook - Handle Paystack webhook
donationApp.post(
  "/paystack-webhook",
  // Verify webhook signature
  async (c, next) => {
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

      c.set("jwtPayload", payload);

      console.log("Received Valid Paystack webhook!!!:", payload);

      await next();
    } catch (error) {
      console.error("Webhook verification error:", error);
      return c.json({ error: "Webhook verification failed" }, 401);
    }
  },
  async (c) => {
    try {
      console.log("Processing Paystack webhook...");

      // Get the database instance
      const db = getDB(c);
      const payload = c.get("jwtPayload") as unknown as z.infer<
        typeof paystackWebhookSchema
      >;

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
          await addToGeneralDonorPool(amount / 100, c);
        } else if (paymentType === "campaign_creation" && metadata) {
          console.log("Funding new campaign:", metadata);

          // Update campaign with initial funding
          const campaignId = metadata.campaign_id;
          // const initialFunding = metadata.funding_amount;

          if (campaignId) {
            await db.donationCampaign.update({
              where: { id: campaignId },
              data: {
                totalAmount: { increment: amount / 100 },
                availableAmount: { increment: amount / 100 },
                status: "ACTIVE",
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
                totalAmount: { increment: amount / 100 },
                availableAmount: { increment: amount / 100 },
                status: "ACTIVE",
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
              checkInCode: generateHexId(6).toUpperCase(),
              checkInCodeExpiresAt: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year expiry - since you paid, it shouldn't expire
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
 */
