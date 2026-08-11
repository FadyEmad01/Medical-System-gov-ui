import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z
    .string()
    .url("API_BASE_URL must be a valid absolute URL")
    .refine((url) => !url.endsWith("/"), {
      message: "API_BASE_URL must not end with a trailing slash",
    }),
  APP_BASE_URL: z.string().url().optional().or(z.literal("")),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL,
    APP_BASE_URL: process.env.APP_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n` +
        `Check .env.local against .env.example.`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
