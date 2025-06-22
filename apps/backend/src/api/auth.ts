import { zValidator } from "@hono/zod-validator";
import { actorSchema, loginSchema } from "@zerocancer/shared";
import type {
  TAuthMeResponse,
  TErrorResponse,
  TLoginResponse,
  TRefreshTokenResponse,
} from "@zerocancer/shared/types";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { jwt, sign, verify } from "hono/jwt";
import { getDB } from "src/lib/db";

export const authApp = new Hono();

authApp.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173", // Frontend dev
      "https://your-production-domain.com", // Production
    ],
    credentials: true, // Allow cookies
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400,
  })
);

// POST /api/auth/login?actor=patient|donor|center
authApp.post(
  "/login",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_login_data",
          error: result.error,
        },
        400
      );
  }),
  zValidator("query", actorSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_actor",
          error:
            "Actor type is required and must be one of: patient, donor, center.",
        },
        400
      );
  }),
  async (c) => {
    const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");

    const db = getDB();
    const { email, password } = c.req.valid("json");
    const actor = c.req.valid("query");

    let user: any = null;
    let passwordHash = "";
    let id = "";

    if (actor === "center") {
      user = await db.serviceCenter.findUnique({ where: { email } });
      passwordHash = user?.passwordHash;
      id = user?.id;
    } else {
      user = await db.user.findUnique({ where: { email } });
      if (!user || user.profile !== actor.toUpperCase()) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            err_code: "invalid_credentials",
            error: "Invalid email or password.",
          },
          401
        );
      }
      passwordHash = user.passwordHash;
      id = user.id;
    }
    if (!user || !(await bcrypt.compare(password, passwordHash))) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_credentials",
          error: "Invalid email or password.",
        },
        401
      );
    }

    const payload = {
      id,
      email: user.email,
      profile: actor === "center" ? "CENTER" : user.profile,
    };
    const token = await sign(
      { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 5 },
      JWT_TOKEN_SECRET
    );
    const refreshToken = await sign(
      { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      JWT_TOKEN_SECRET
    ); // 7 days

    // Set refresh token as httpOnly, secure cookie
    c.header(
      "Set-Cookie",
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=None; Secure`
    );

    return c.json<TLoginResponse>({
      ok: true,
      data: {
        token,
        user: {
          userId: id,
          fullName: user.fullName,
          email: user.email,
          profile: payload.profile,
        },
      },
    });
  }
);

// GET /api/auth/me (protected)
authApp.get(
  "/me",
  (c, next) => {
    const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");

    const jwtMiddleware = jwt({
      secret: JWT_TOKEN_SECRET,
    });

    return jwtMiddleware(c, next);
  },
  async (c) => {
    const jwtPayload = c.get("jwtPayload");
    // Optionally fetch more user info from DB here
    return c.json<TAuthMeResponse>({ ok: true, data: { user: jwtPayload } });
  }
);

// POST /api/auth/refresh
authApp.post("/refresh", async (c) => {
  const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");
  // Get refresh token from cookie
  const cookieHeader = c.req.header("Cookie") || "";
  const refreshToken = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("refreshToken="))
    ?.split("=")[1];
  if (!refreshToken) {
    return c.json<TErrorResponse>(
      {
        ok: false,
        err_code: "missing_refresh_token",
        error: "No refresh token provided.",
      },
      401
    );
  }
  try {
    const payload = await verify(refreshToken, JWT_TOKEN_SECRET);
    // Optionally check if token is revoked/expired in DB
    const newAccessToken = await sign(
      {
        id: payload.id,
        email: payload.email,
        profile: payload.profile,
        exp: Math.floor(Date.now() / 1000) + 60 * 5,
      },
      JWT_TOKEN_SECRET
    );

    const newRefreshToken = await sign(
      {
        id: payload.id,
        email: payload.email,
        profile: payload.profile,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      JWT_TOKEN_SECRET
    );

    c.header(
      "Set-Cookie",
      `refreshToken=${newRefreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=None; Secure`
    );

    return c.json<TRefreshTokenResponse>({
      ok: true,
      data: {
        token: newAccessToken,
      },
    });
  } catch (err) {
    return c.json<TErrorResponse>(
      {
        ok: false,
        err_code: "invalid_refresh_token",
        error: "Refresh token is invalid or expired.",
      },
      401
    );
  }
});

// POST /api/auth/logout
authApp.post("/logout", async (c) => {
  // Clear the refresh token cookie
  c.header(
    "Set-Cookie",
    "refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure"
  );
  // If storing refresh tokens in DB, mark as revoked
  return c.json({ ok: true, message: "Logged out successfully." });
});
