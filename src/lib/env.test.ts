import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

async function loadEnv() {
  const mod = await import("./env");
  return mod;
}

describe("env", () => {
  it("parses a valid configuration", async () => {
    vi.stubEnv("API_BASE_URL", "http://stg-api.runasp.net/api");
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "test");

    const { env, isProduction, isDevelopment } = await loadEnv();

    expect(env.API_BASE_URL).toBe("http://stg-api.runasp.net/api");
    expect(env.APP_BASE_URL).toBe("http://localhost:3000");
    expect(env.NODE_ENV).toBe("test");
    expect(isProduction).toBe(false);
    expect(isDevelopment).toBe(false);
  });

  it("passes NODE_ENV through and derives the helpers", async () => {
    vi.stubEnv("API_BASE_URL", "http://stg-api.runasp.net/api");
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");

    const { env, isDevelopment, isProduction } = await loadEnv();

    expect(env.NODE_ENV).toBe("development");
    expect(isDevelopment).toBe(true);
    expect(isProduction).toBe(false);
  });

  it("rejects a non-URL API_BASE_URL", async () => {
    vi.stubEnv("API_BASE_URL", "not-a-url");

    await expect(loadEnv()).rejects.toThrow(
      /Invalid environment configuration/,
    );
  });

  it("rejects an API_BASE_URL with a trailing slash", async () => {
    vi.stubEnv("API_BASE_URL", "http://stg-api.runasp.net/api/");

    await expect(loadEnv()).rejects.toThrow(
      /must not end with a trailing slash/,
    );
  });
});
