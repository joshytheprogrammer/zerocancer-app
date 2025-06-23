import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";

export const authMiddleware = () =>
  createMiddleware((c, next) => {
    const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");

    const jwtMiddleware = jwt({
      secret: JWT_TOKEN_SECRET,
    });

    return jwtMiddleware(c, next);
  });
