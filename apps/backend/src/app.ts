import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { adminApp } from "./api/admin";
import { appointmentApp } from "./api/appointments";
import { authApp } from "./api/auth";
import { centerApp } from "./api/center";
import { donationApp } from "./api/donation";
import { notificationApp } from "./api/notification";
import { registerApp } from "./api/registration";
import { screeningTypesApp } from "./api/screening-types";
import { waitlistApp } from "./api/waitlist";

// Create the main app (no basePath for root)
const app = new Hono();

// Create API app (no basePath since we'll mount it at /api/v1)
const apiApp = new Hono();

app.use(logger());

// Environment-aware setup
app.use("*", async (c, next) => {
  const { NODE_ENV, FRONTEND_URL } = env<{
    NODE_ENV?: string;
    FRONTEND_URL: string;
  }>(c, "node");

  const corsMiddlewareHandler = cors({
    origin: [
      FRONTEND_URL,
      // "https://zerocancer.africa",
      // "https://zerocancer-frontend.vercel.app",
      // "http://localhost:3000",
    ],
  });
  return corsMiddlewareHandler(c, next);
});

// ========================================
// PRODUCTION: SERVE STATIC FILES
// ========================================

// In production, serve the built frontend files using Hono's serveStatic
app.use("*", async (c, next) => {
  const { NODE_ENV } = env<{ NODE_ENV?: string }>(c, "node");

  // Only serve static files in production
  if (NODE_ENV === "production") {
    // Skip static file serving for API routes
    if (c.req.path.startsWith("/api/")) {
      await next();
      return;
    }

    // Use Hono's Node.js serveStatic with simple configuration
    return serveStatic({
      root: "./frontend-dist",
      rewriteRequestPath: (path: string) => {
        // Handle React Router - serve index.html for non-asset paths
        if (!path.includes(".") && path !== "/") {
          return "/index.html";
        }
        return path;
      },
    })(c, next);
  }

  // Continue to next middleware in development
  await next();
});

// ========================================
// API ROUTES (BEFORE STATIC FILES)
// ========================================

apiApp.get("/", (c) => c.text("Hello from Hono.js + Prisma + CORS!"));
apiApp.get("/healthz", (c) => c.json({ status: "ok" }));

// ROUTES
apiApp.route("/auth", authApp);
apiApp.route("/register", registerApp);
apiApp.route("/center", centerApp);
apiApp.route("/appointment", appointmentApp);
apiApp.route("/screening-types", screeningTypesApp);
apiApp.route("/waitlist", waitlistApp);
apiApp.route("/donor", donationApp);
apiApp.route("/admin", adminApp);
apiApp.route("/notifications", notificationApp);

// Mount API app BEFORE static file serving
app.route("/api/v1", apiApp);

// ========================================
// PRODUCTION: SERVE STATIC FILES (AFTER API)
// ========================================

// ========================================
// FALLBACK HANDLERS
// ========================================

// Development fallback - helpful message
app.get("*", async (c) => {
  const { NODE_ENV } = env<{ NODE_ENV?: string }>(c, "node");

  if (NODE_ENV !== "production") {
    return c.html(`
      <html>
        <head><title>Zerocancer Backend</title></head>
        <body style="font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
          <h1>🏥 Zerocancer Backend</h1>
          <p><strong>Development Mode</strong></p>
          <p>The backend API is running. The frontend should be served separately in development.</p>
          <h2>🔗 Available Endpoints:</h2>
          <ul>
            <li><a href="/api/v1/healthz">/api/v1/healthz</a> - Health check</li>
            <li><a href="/api/v1/">/api/v1/</a> - API root</li>
          </ul>
          <h2>🚀 Frontend Development:</h2>
          <p>Run <code>pnpm dev</code> in the frontend directory to start the development server.</p>
          <p>The frontend will typically be available at <code>http://localhost:3000</code></p>
        </body>
      </html>
    `);
  }

  // Production fallback for unknown routes
  return c.json(
    {
      error: "Not Found",
      message: "The requested resource was not found.",
    },
    404
  );
});

export default app;
