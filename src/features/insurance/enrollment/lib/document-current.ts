import type { CitizenDocumentResponseDto, DocumentType } from "../types";

/**
 * The newest document for a type that the server still marks `isCurrent`.
 * Superseded uploads keep their records but are no longer current, so a slot
 * falls back to its idle state for those.
 */
export function findCurrentDocument(
  documents: CitizenDocumentResponseDto[],
  documentType: DocumentType,
): CitizenDocumentResponseDto | null {
  return (
    documents.find(
      (document) =>
        document.documentType === documentType && document.isCurrent,
    ) ?? null
  );
}

/**
 * Human-readable file size from the API's byte count. Bytes stay whole,
 * KB/MB get one decimal below 10 and round above it.
 */
export function formatDocumentFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${formatMagnitude(kb)} KB`;
  return `${formatMagnitude(kb / 1024)} MB`;
}

function formatMagnitude(value: number): string {
  if (value >= 10) return `${Math.round(value)}`;
  return `${value.toFixed(1)}`;
}
