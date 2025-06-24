import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { appointmentApp } from "./api/appointments";
import { authApp } from "./api/auth";
import { registerApp } from "./api/registration";

const app = new Hono().basePath("/api/v1");

app.use(logger());
app.use("*", async (c, next) => {
  const { FRONTEND_URL } = env<{ FRONTEND_URL: string }>(c, "node");

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
app.get("/", (c) => c.text("Hello from Hono.js + Prisma + CORS!"));
app.get("/healthz", (c) => c.json({ status: "ok" }));

// ROUTES
app.route("/auth", authApp);
app.route("/register", registerApp);
app.route("/appointment", appointmentApp);

app.notFound((c) => {
  return c.json(
    { error: "Not Found", message: "The requested resource was not found." },
    404
  );
});

export default app;
