import type { Gender, UserRole } from "@/types/enums";

export type { UserRole, Gender };

/** Body for POST /api/auth/register. */
export interface RegisterRequest {
  nationalId: string;
  firstName: string;
  secondName: string;
  thirdName: string;
  fourthName: string;
  dateOfBirth: string;
  gender: Gender;
  mobileNumber: string;
  governorate: string;
  district: string;
  address: string;
  username: string;
  password: string;
  email?: string;
}

/** Body for POST /api/auth/login. */
export interface LoginRequest {
  nationalId: string;
  password: string;
}

/** Response from register / login / test-token (the JWT issuance endpoints). */
export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  userId: number;
  nationalId: string;
  username: string;
  fullName: string;
  role: UserRole;
}

/** Response from GET /api/auth/me — identity claims read from the JWT. */
export interface MeResponse {
  userId: number;
  nationalId: string;
  username: string;
  fullName: string;
  role: UserRole;
}
