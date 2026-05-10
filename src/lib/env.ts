import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().url().optional(),

  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),

  // Encrypted credential vault — see docs/06 §8
  MASTER_ENCRYPTION_KEY: z.string().optional(),

  BIGCOMMERCE_STORE_HASH: z.string().optional(),
  BIGCOMMERCE_API_TOKEN: z.string().optional(),
  BIGCOMMERCE_CLIENT_ID: z.string().optional(),

  QUICKBOOKS_CLIENT_ID: z.string().optional(),
  QUICKBOOKS_CLIENT_SECRET: z.string().optional(),
  QUICKBOOKS_REDIRECT_URI: z.string().url().optional(),
  QUICKBOOKS_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),

  MAILCHIMP_API_KEY: z.string().optional(),
  MAILCHIMP_SERVER_PREFIX: z.string().optional(),

  GA4_PROPERTY_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  throw new Error("Invalid environment variables. See .env.example for the contract.");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
