import "server-only";

import { env } from "./env";
import type { ProblemDetails } from "./problem-details";

const DEFAULT_TIMEOUT_MS = 15_000;

/** Discriminated error categories so callers can branch without inspecting HTTP codes. */
export type ApiErrorKind =
  | "validation"
  | "conflict"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "server"
  | "timeout"
  | "network";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly problemDetails?: ProblemDetails;

  constructor(
    kind: ApiErrorKind,
    status: number,
    message: string,
    problemDetails?: ProblemDetails,
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.problemDetails = problemDetails;
  }
}

interface RequestOptions {
  /** Bearer token to inject as `Authorization`. Omit for unauthenticated calls. */
  token?: string | null;
  /** Per-request timeout in ms. Defaults to 15s. */
  timeoutMs?: number;
  /** Custom headers (e.g., Accept, Idempotency-Key). */
  headers?: Record<string, string>;
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  async put<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("PUT", path, body, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = this.buildUrl(path);
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: this.buildHeaders(options),
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        redirect: "manual",
      });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") {
        throw new ApiError("timeout", 0, "Request timed out");
      }
      throw new ApiError(
        "network",
        0,
        "Unable to reach the server. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return undefined as T;

    const payload = await this.parseBody(response);

    if (response.ok) return payload as T;

    throw this.toApiError(response.status, payload);
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }
    return headers;
  }

  private async parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      // Still consume the body so the underlying connection can be reused.
      await response.text().catch(() => undefined);
      return undefined;
    }
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  private toApiError(status: number, payload: unknown): ApiError {
    const problem = (payload ?? {}) as ProblemDetails;
    const message =
      problem.detail ?? problem.title ?? `Request failed (${status})`;

    const kind: ApiErrorKind = STATUS_TO_KIND[status] ?? "server";

    return new ApiError(kind, status, message, problem);
  }
}

const STATUS_TO_KIND: Readonly<Record<number, ApiErrorKind>> = {
  400: "validation",
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
};

/** Shared singleton for the auth feature (and any future server-side fetchers). */
export const apiClient = new ApiClient(env.API_BASE_URL);
