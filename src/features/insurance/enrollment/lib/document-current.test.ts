import { describe, expect, it } from "vitest";
import type { CitizenDocumentResponseDto } from "../types";
import {
  findCurrentDocument,
  formatDocumentFileSize,
} from "./document-current";

function document(
  overrides: Partial<CitizenDocumentResponseDto> = {},
): CitizenDocumentResponseDto {
  return {
    id: "doc-1",
    patientId: 7,
    dependentPersonId: null,
    documentType: "NationalId",
    documentNumber: null,
    fileName: "national-id.pdf",
    fileUrl: "https://cdn.example.test/national-id.pdf",
    fileType: "application/pdf",
    fileSize: 2048,
    uploadedAt: "2026-08-14T08:00:00Z",
    expiresAt: null,
    reviewStatus: "Pending",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    isCurrent: true,
    correlationId: "corr-1",
    ...overrides,
  };
}

describe("findCurrentDocument", () => {
  it("returns the current document for the requested type", () => {
    const docs = [
      document({ id: "old", isCurrent: false }),
      document({ id: "new", isCurrent: true }),
    ];
    expect(findCurrentDocument(docs, "NationalId")?.id).toBe("new");
  });

  it("returns null when only superseded records exist", () => {
    const docs = [document({ id: "old", isCurrent: false })];
    expect(findCurrentDocument(docs, "NationalId")).toBeNull();
  });

  it("returns null when no document matches the type", () => {
    expect(findCurrentDocument([], "NationalId")).toBeNull();
    expect(findCurrentDocument([document()], "BirthCertificate")).toBeNull();
  });

  it("ignores documents of other types even when current", () => {
    const docs = [document({ documentType: "BirthCertificate" })];
    expect(findCurrentDocument(docs, "NationalId")).toBeNull();
  });
});

describe("formatDocumentFileSize", () => {
  it("keeps bytes whole", () => {
    expect(formatDocumentFileSize(0)).toBe("0 B");
    expect(formatDocumentFileSize(512)).toBe("512 B");
    expect(formatDocumentFileSize(1023)).toBe("1023 B");
  });

  it("shows one decimal below 10 KB", () => {
    expect(formatDocumentFileSize(1024)).toBe("1.0 KB");
    expect(formatDocumentFileSize(1536)).toBe("1.5 KB");
  });

  it("rounds at 10 KB or more", () => {
    expect(formatDocumentFileSize(10 * 1024)).toBe("10 KB");
    expect(formatDocumentFileSize(10 * 1024 + 512)).toBe("11 KB");
  });

  it("switches to MB for large files", () => {
    expect(formatDocumentFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatDocumentFileSize(10 * 1024 * 1024)).toBe("10 MB");
  });
});
