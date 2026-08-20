import type { AuthActionError } from "@/features/auth/lib/action-error";
import type { Gender } from "../../types";
import type { AddDependentRequestDto, RelationshipType } from "../types";

const GENDER_VALUES: readonly Gender[] = ["Male", "Female"];

const RELATIONSHIP_TYPE_VALUES: readonly RelationshipType[] = [
  "Spouse",
  "Child",
  "Parent",
  "Guardian",
];

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

/**
 * Validates the dependent boundary: four required name parts, known enum
 * values, a parseable date, and a 14-digit national ID when provided.
 */
export function parseAddDependentInput(
  input: AddDependentRequestDto,
):
  | { ok: true; data: AddDependentRequestDto }
  | { ok: false; error: AuthActionError } {
  const firstName = input.firstName.trim();
  const secondName = input.secondName.trim();
  const thirdName = input.thirdName.trim();
  const fourthName = input.fourthName.trim();

  if (
    firstName === "" ||
    secondName === "" ||
    thirdName === "" ||
    fourthName === "" ||
    firstName.length > 50 ||
    secondName.length > 50 ||
    thirdName.length > 50 ||
    fourthName.length > 50
  ) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.invalidName",
        fieldErrors: {},
      },
    };
  }

  if (!GENDER_VALUES.includes(input.gender)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.genderRequired",
        fieldErrors: {},
      },
    };
  }

  if (!RELATIONSHIP_TYPE_VALUES.includes(input.relationshipType)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.relationshipRequired",
        fieldErrors: {},
      },
    };
  }

  if (!isIsoDate(input.dateOfBirth)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "dependents.errors.dateOfBirthRequired",
        fieldErrors: {},
      },
    };
  }

  const nationalId = input.nationalId?.trim() ?? "";
  if (nationalId !== "" && !/^\d{14}$/.test(nationalId)) {
    return {
      ok: false,
      error: {
        kind: "validation",
        formError: "errors.validationFailed",
        fieldErrors: { nationalId: "dependents.errors.nationalId" },
      },
    };
  }

  return {
    ok: true,
    data: {
      firstName,
      secondName,
      thirdName,
      fourthName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      relationshipType: input.relationshipType,
      ...(nationalId !== "" ? { nationalId } : {}),
    },
  };
}
