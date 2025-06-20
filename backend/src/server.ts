import { serve } from "@hono/node-server";
import app from "./app";

const port = process.env.PORT || 5000;

serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log(`Server running on http://localhost:${port}`);
