import "server-only";

import { apiClient } from "@/lib/api-client";
import type { ProfileResponseDto, UpdateProfileRequestDto } from "../types";

/** GET /profile — returns the authenticated patient's citizen profile. */
export function getProfile(token: string): Promise<ProfileResponseDto> {
  return apiClient.get<ProfileResponseDto>("/profile", { token });
}

/** PUT /profile — updates the six editable profile fields. */
export function updateProfile(
  token: string,
  body: UpdateProfileRequestDto,
): Promise<ProfileResponseDto> {
  return apiClient.put<ProfileResponseDto>("/profile", body, { token });
}
