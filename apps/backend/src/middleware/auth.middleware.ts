import { TActors } from "@zerocancer/shared";
import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";
import { THonoAppVariables } from "src/lib/types";

// export const authMiddleware = (actor?: TActors) =>
//   createMiddleware((c, next) => {
//     const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");

//     const jwtMiddleware = jwt({
//       secret: JWT_TOKEN_SECRET,
//     });

//     return jwtMiddleware(c, next);
//   });

export const authMiddleware = (actor?: TActors | "center-staff") =>
  createMiddleware<{ Variables: THonoAppVariables }>(async (c, next) => {
    const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");

    const jwtMiddleware = jwt({
      secret: JWT_TOKEN_SECRET,
    });

    // Run JWT middleware first
    await jwtMiddleware(c, async () => {});

    // If no actor restriction, continue
    if (!actor) return next();

    // Check profile in payload
    const payload = c.get("jwtPayload");
    if (!payload || payload.profile !== actor.toUpperCase()) {
      return c.json({ ok: false, message: "Forbidden: actor mismatch" }, 403);
    }

    // If actor matches, continue
    return next();
  });
