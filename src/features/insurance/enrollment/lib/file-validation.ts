/** Backend upload limit for a single document (10 MB). */
export const MAX_DOCUMENT_FILE_SIZE = 10_485_760;

/** The only MIME type the backend accepts for each allowed extension. */
const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export type FileValidationResult =
  | { ok: true }
  | { ok: false; errorKey: string };

/**
 * Validates a document file before upload. Mirrors the backend rule: the
 * extension must be allowed AND the MIME type must match that extension, and
 * the size must stay within the 10 MB limit. Pure + deterministic.
 */
export function validateDocumentFile(file: File): FileValidationResult {
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return { ok: false, errorKey: "documents.errors.tooLarge" };
  }

  const expectedMime = MIME_BY_EXTENSION[extensionOf(file.name)];

  if (expectedMime === undefined || file.type !== expectedMime) {
    return { ok: false, errorKey: "documents.errors.invalidType" };
  }

  return { ok: true };
}

function extensionOf(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return fileName.slice(dotIndex + 1).toLowerCase();
}
