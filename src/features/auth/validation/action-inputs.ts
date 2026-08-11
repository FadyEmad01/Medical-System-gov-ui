import { z } from "zod";

/**
 * Server-side schemas for Server Action inputs.
 *
 * The browser already validates with the form schemas, but Server Actions are
 * public POST endpoints — a malicious client can send anything. These schemas
 * are the security boundary: they mirror the backend contract (not the form),
 * so `confirmPassword` from the register form is intentionally absent here.
 */

export const loginActionInputSchema = z.object({
  nationalId: z.string().regex(/^\d{14}$/),
  password: z.string().min(1).max(200),
});

export const registerActionInputSchema = z.object({
  nationalId: z.string().regex(/^\d{14}$/),
  firstName: z.string().min(2).max(100),
  secondName: z.string().min(2).max(100),
  thirdName: z.string().min(2).max(100),
  fourthName: z.string().min(2).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["Male", "Female"]),
  mobileNumber: z.string().regex(/^01[0-9]\d{8}$/),
  governorate: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  address: z.string().min(5).max(500),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(200),
  email: z.string().email().max(254).optional(),
});

export type LoginActionInput = z.infer<typeof loginActionInputSchema>;
export type RegisterActionInput = z.infer<typeof registerActionInputSchema>;
