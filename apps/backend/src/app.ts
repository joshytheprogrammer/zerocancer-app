import { Hono } from "hono";
import { cors } from "hono/cors";
import { appointmentApp } from "./api/appointment";
import { authApp } from "./api/auth";
import { registerApp } from "./api/registration";

const app = new Hono().basePath("/api/v1");

app.use("*", cors());

app.get("/", (c) => c.text("Hello from Hono.js + Prisma + CORS!"));
app.get("/healthz", (c) => c.json({ status: "ok" }));

// ROUTES
app.route("/auth", authApp);
app.route("/registration", registerApp);
app.route("/appointment", appointmentApp);

export default app;
