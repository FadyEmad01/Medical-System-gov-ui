import "server-only";

import { apiClient } from "@/lib/api-client";
import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RegisterRequest,
} from "../types";

/** POST /api/auth/register — creates a Patient account and returns a JWT. */
export function registerPatient(body: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/register", body);
}

/** POST /api/auth/login — exchanges NationalId + password for a JWT. */
export function loginWithCredentials(
  body: LoginRequest,
): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/login", body);
}

/**
 * GET /api/auth/me — returns the identity claims encoded in the JWT.
 * Callers must pass the bearer token extracted from the session cookie.
 */
export function fetchCurrentUser(token: string): Promise<MeResponse> {
  return apiClient.get<MeResponse>("/auth/me", { token });
}
