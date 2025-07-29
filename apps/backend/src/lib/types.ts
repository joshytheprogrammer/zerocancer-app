export type AuthPayload = {
  id: string;
  email: string;
  profile: "PATIENT" | "DONOR" | "CENTER" | "CENTER_STAFF" | "ADMIN";
};

export type THonoApp = {
  Variables: { jwtPayload: AuthPayload };
  Bindings: TEnvs;
};

export type TEnvs = {
  DATABASE_URL: string;
  JWT_TOKEN_SECRET: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  FRONTEND_URL: string;
  ENV_MODE: "production" | "development" | "test";
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  CRON_API_KEY: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  VITE_CLOUDINARY_CLOUD_NAME: string;
  VITE_CLOUDINARY_UPLOAD_PRESET: string;
  COMPUTE_SERVICE_URL: string;
};
