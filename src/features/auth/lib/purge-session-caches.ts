import type { QueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "./me-query-key";

/**
 * Drop identity + role-scoped PII caches after logout or session expiry.
 * Admin/Doctor queries hold national IDs and review bundles — they must not
 * survive a session switch on a shared workstation.
 */
export function purgeSessionCaches(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
  queryClient.removeQueries({ queryKey: ["insurance"] });
  queryClient.removeQueries({ queryKey: ["admin"] });
  queryClient.removeQueries({ queryKey: ["doctor"] });
}
