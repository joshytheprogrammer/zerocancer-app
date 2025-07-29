import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { emailApp } from "./api/email";
import { THonoApp } from "./lib/types";

// Load environment variables
dotenv.config();

// Import API routes
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
// app.route("/api/waitlist", waitlistApi);
app.route("/api/email", emailApp);

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

console.log(
  `🚀 Starting ZeroCancer Compute Service. For NodeJS specific optimizations & heavy computations`
);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(
      `🌐 Compute Service running. Backend should set COMPUTE_SERVICE_URL=http://localhost:${info.port}🔗`
    );
  }
);
