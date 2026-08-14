import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Baby,
  Briefcase,
  FileText,
  Heart,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { DocumentType } from "../types";

/** All document types in display order (index-safe for dropdowns). */
export const DOCUMENT_TYPE_ORDER: readonly DocumentType[] = [
  "NationalId",
  "BirthCertificate",
  "MarriageCertificate",
  "EmploymentLetter",
  "DisabilityCertificate",
  "DeathCertificate",
  "GuardianAuthorization",
  "FamilyRegistration",
];

/** i18n key suffix for each document type label. */
export const DOCUMENT_TYPE_LABEL_KEY: Record<DocumentType, string> = {
  NationalId: "documents.types.nationalId",
  BirthCertificate: "documents.types.birthCertificate",
  MarriageCertificate: "documents.types.marriageCertificate",
  EmploymentLetter: "documents.types.employmentLetter",
  DisabilityCertificate: "documents.types.disabilityCertificate",
  DeathCertificate: "documents.types.deathCertificate",
  GuardianAuthorization: "documents.types.guardianAuthorization",
  FamilyRegistration: "documents.types.familyRegistration",
};

/** Icon for each document type. */
export const DOCUMENT_TYPE_ICON: Record<DocumentType, LucideIcon> = {
  NationalId: ScrollText,
  BirthCertificate: Baby,
  MarriageCertificate: Heart,
  EmploymentLetter: Briefcase,
  DisabilityCertificate: Accessibility,
  DeathCertificate: FileText,
  GuardianAuthorization: ShieldCheck,
  FamilyRegistration: Users,
};
