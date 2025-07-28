export interface TEnvs {
  DATABASE_URL: string;
  JWT_TOKEN_SECRET: string;
  PORT?: string;
  NODE_ENV?: "production" | "development" | "test";
  FRONTEND_URL?: string;

  // Email configuration
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

export interface THonoApp {
  Bindings: TEnvs;
  Variables: {};
}
