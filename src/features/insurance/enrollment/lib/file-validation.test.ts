import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_FILE_SIZE,
  validateDocumentFile,
} from "./file-validation";

function fileWith(
  overrides: { name?: string; type?: string; size?: number } = {},
): File {
  const size = overrides.size ?? 1024;
  return new File([new Uint8Array(size)], overrides.name ?? "document.pdf", {
    type: overrides.type ?? "application/pdf",
  });
}

describe("validateDocumentFile", () => {
  it("accepts a small PDF with a matching MIME type", () => {
    expect(validateDocumentFile(fileWith())).toEqual({ ok: true });
  });

  it("accepts JPG, JPEG and PNG with matching MIME types", () => {
    expect(
      validateDocumentFile(fileWith({ name: "photo.jpg", type: "image/jpeg" })),
    ).toEqual({ ok: true });
    expect(
      validateDocumentFile(
        fileWith({ name: "photo.jpeg", type: "image/jpeg" }),
      ),
    ).toEqual({ ok: true });
    expect(
      validateDocumentFile(fileWith({ name: "photo.png", type: "image/png" })),
    ).toEqual({ ok: true });
  });

  it("accepts an uppercase extension when the MIME type matches", () => {
    expect(validateDocumentFile(fileWith({ name: "SCAN.PDF" }))).toEqual({
      ok: true,
    });
  });

  it("accepts a file exactly at the size limit", () => {
    const file = fileWith({ size: MAX_DOCUMENT_FILE_SIZE });

    expect(validateDocumentFile(file)).toEqual({ ok: true });
  });

  it("rejects a file larger than 10 MB even with a valid type", () => {
    const file = fileWith({ size: MAX_DOCUMENT_FILE_SIZE + 1 });

    expect(validateDocumentFile(file)).toEqual({
      ok: false,
      errorKey: "documents.errors.tooLarge",
    });
  });

  it("rejects an unsupported extension", () => {
    const file = fileWith({ name: "note.txt", type: "text/plain" });

    expect(validateDocumentFile(file)).toEqual({
      ok: false,
      errorKey: "documents.errors.invalidType",
    });
  });

  it("rejects a valid extension with a mismatched MIME type", () => {
    const file = fileWith({ name: "photo.pdf", type: "image/png" });

    expect(validateDocumentFile(file)).toEqual({
      ok: false,
      errorKey: "documents.errors.invalidType",
    });
  });

  it("rejects a valid extension with an unknown MIME type", () => {
    const file = fileWith({ name: "photo.png", type: "" });

    expect(validateDocumentFile(file)).toEqual({
      ok: false,
      errorKey: "documents.errors.invalidType",
    });
  });

  it("rejects a file without an extension", () => {
    const file = fileWith({ name: "scan" });

    expect(validateDocumentFile(file)).toEqual({
      ok: false,
      errorKey: "documents.errors.invalidType",
    });
  });
});
