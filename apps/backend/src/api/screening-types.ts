import { zValidator } from "@hono/zod-validator";
import {
  getScreeningTypesByCategoryQuerySchema,
  getScreeningTypesQuerySchema,
  screeningTypeCategorySchema,
  screeningTypeSchema,
} from "@zerocancer/shared";
import type {
  TGetScreeningTypeCategoriesResponse,
  TGetScreeningTypeResponse,
  TGetScreeningTypesResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "src/lib/db";

export const screeningTypesApp = new Hono();

// GET /api/screening-types - paginated, filtered, searched list
screeningTypesApp.get(
  "/",
  zValidator("query", getScreeningTypesQuerySchema, (result, c) => {
    if (!result.success) return c.json({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { page = 1, pageSize = 20, search } = c.req.valid("query");
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [types, total] = await Promise.all([
      db.screeningType.findMany({
        where,
        select: {
          id: true,
          name: true,
          screeningTypeCategoryId: true,
          active: true,
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.screeningType.count({ where }),
    ]);
    // Validate response
    const data = screeningTypeSchema.array().parse(types);
    return c.json<TGetScreeningTypesResponse>({
      ok: true,
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  }
);

// GET /api/screening-types/all - all active screening types (with optional search)
screeningTypesApp.get(
  "/all",
  zValidator("query", getScreeningTypesQuerySchema.partial(), (result, c) => {
    if (!result.success) return c.json({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { search } = c.req.valid("query");
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: "insensitive" };
    const types = await db.screeningType.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        screeningTypeCategoryId: true,
        active: true,
      },
      orderBy: { name: "asc" },
    });
    const data = screeningTypeSchema.array().parse(types);
    return c.json<TGetScreeningTypesResponse>({ ok: true, data });
  }
);

// GET /api/screening-types/categories - list all unique categories (by relation)
screeningTypesApp.get("/categories", async (c) => {
  const db = getDB();
  const categories = await db.screeningTypeCategory.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const data = screeningTypeCategorySchema.array().parse(categories);
  return c.json<TGetScreeningTypeCategoriesResponse>({
    ok: true,
    data,
  });
});

// GET /api/screening-types/category/:categoryId - paginated, filtered, searched list by category
screeningTypesApp.get(
  "/category/:categoryId",
  zValidator(
    "query",
    getScreeningTypesByCategoryQuerySchema.partial(),
    (result, c) => {
      if (!result.success)
        return c.json({ ok: false, error: result.error }, 400);
    }
  ),
  async (c) => {
    const db = getDB();
    const { search, page = 1, pageSize = 20 } = c.req.valid("query");
    const categoryId = c.req.param("categoryId");
    const where: any = { active: true, screeningTypeCategoryId: categoryId };
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [types, total] = await Promise.all([
      db.screeningType.findMany({
        where,
        select: {
          id: true,
          name: true,
          screeningTypeCategoryId: true,
          active: true,
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.screeningType.count({ where }),
    ]);
    const data = screeningTypeSchema.array().parse(types);
    return c.json<TGetScreeningTypesResponse>({
      ok: true,
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  }
);

// GET /api/screening-types/by-name/:name - get screening type by name
screeningTypesApp.get("/by-name/:name", async (c) => {
  const db = getDB();
  const name = c.req.param("name");
  const type = await db.screeningType.findFirst({
    where: { name },
    select: {
      id: true,
      name: true,
      screeningTypeCategoryId: true,
      active: true,
    },
  });
  if (!type) return c.json({ ok: false, message: "Not found" }, 404);
  const data = screeningTypeSchema.parse(type);
  return c.json<TGetScreeningTypeResponse>({ ok: true, data });
});

// GET /api/screening-types/:id - get screening type by id
screeningTypesApp.get("/:id", async (c) => {
  const db = getDB();
  const id = c.req.param("id");
  const type = await db.screeningType.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      screeningTypeCategoryId: true,
      active: true,
    },
  });
  if (!type) return c.json({ ok: false, message: "Not found" }, 404);
  const data = screeningTypeSchema.parse(type);
  return c.json<TGetScreeningTypeResponse>({ ok: true, data });
});
