# Backend (Hono.js + Prisma)

This backend uses [Hono.js](https://hono.dev/) for the API and [Prisma](https://www.prisma.io/) for the database ORM. It is designed to work in a pnpm monorepo and share types with the frontend via the `shared` package.

## Getting Started

```bash
cd backend
pnpm install
pnpm dev
```

## Hono Context Awareness

- All route handlers receive a `Context` object from Hono.
- You can extend the context for custom types or middleware.
- Example:

```ts
import { Context } from "hono";

app.get("/hello", (c: Context) => {
  // c.req, c.res, c.env, etc.
  return c.text("Hello!");
});
```

## Using Shared Types

Import types from the shared package:

```ts
import type { User } from "@zerocancer/shared";
```

## Prisma

- The schema is in `prisma/schema.prisma`.
- Run migrations with:
  ```bash
  pnpm prisma migrate dev --name init
  ```
- Generate the client with:
  ```bash
  pnpm prisma generate
  ```

## Environment

- Set your database connection string in `.env`.

---

For more, see the root README for workspace setup.
