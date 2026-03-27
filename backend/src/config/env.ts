import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  PORT: z.string().default("3001"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
